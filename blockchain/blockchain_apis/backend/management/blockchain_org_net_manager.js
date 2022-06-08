const { Gateway: FabricGateway, Wallets } = require("fabric-network");
const CertificateAuthority = require("./bootstrap_ca");
const { connect } = require("@hyperledger/fabric-gateway");
const fs = require("fs");
const {
  newGrpcConnection,
  newSigner,
  newIdentity,
} = require("./bc_network_utils/gateway/utils.js");
const {
  evaluateAction,
  endorseAction,
  commitAction,
} = require("./bc_network_utils/gateway/actions.js");
const ChaincodeEvents = require("./bc_network_utils/chaincodes/chaincode_events");
const { GeneralError } = require("../middlewares/utils/error_types");
const styles = require("../config/styles.js");

const instanceAr = {};
class Network {
  constructor(organization, peer, orgConfig) {
    if (instanceAr[organization][peer]) {
      return instanceAr[organization][peer];
    }

    this.organization = organization;
    this.peer = peer;

    this.orgConfig = null;
    this.identity = null;
    this.ccp = null;
    this.identityUser = null;
    this.wallet = null;
    this.opts = null;
    this.contracts = {};

    this.#setOrgConfigData(orgConfig);
    this.#setIdentity(orgConfig);
    this.#setCCP(orgConfig);
    this.#setUser(orgConfig);

    this.baseIsInitialized = false;
    this.gatewayIsInitialized = false;

    // Peer Gateway
    this.peerIdentity = null;
    this.peerSigner = null;
    this.peerGatewayIsInitialized = false;

    // Network
    this.gateway = null;

    this.peerGateway = null;

    // Organization's Certificate Authority
    this.certificateAuthority = CertificateAuthority.getInstance(
      this.organization
    );

    // Initialize the Certificate Authority Instance
    this.certificateAuthority.initializeInstance(this.ccp);

    // Initialize the Blockchain Actions
    this.BC_ACTIONS = {};
    this.BC_ACTIONS.evaluateProposalAction = evaluateAction.bind(this);
    this.BC_ACTIONS.endorseAction = endorseAction.bind(this);
    this.BC_ACTIONS.commitAction = commitAction.bind(this);
  }

  getFromOrgConfig(type) {
    switch (true) {
      case type === "fabric_blockchain" || type === "blockchain": {
        return this.orgConfig["fabric_blockchain"];
      }
      case type === "fabric_organization" || type === "organization": {
        return this.orgConfig["fabric_organization"];
      }
      case type === "fabric_channel" || type === "channel": {
        return this.orgConfig["fabric_channel"];
      }
      case type === "fabric_contracts" || type === "contracts": {
        return this.orgConfig["fabric_contracts"].split(",");
      }
      case type === "fabric_wallet_dir" || type === "wallets_dir": {
        return this.orgConfig["fabric_wallet_dir"];
      }
      case type === "fabric_gateway_dir" || type === "gateway_dir": {
        return this.orgConfig["fabric_gateway_dir"];
      }
      case type === "fabric_ccp" || type === "ccp": {
        return this.orgConfig["fabric_ccp"];
      }
      case type === "fabric_gateway_hostport" || type === "peer_hostport": {
        return this.orgConfig["fabric_gateway_hostport"];
      }
      case type === "fabric_gateway_sslHostOverride" ||
        type === "peer_sslHostOverride": {
        return this.orgConfig["fabric_gateway_sslHostOverride"];
      }
      case type === "fabric_user" || type === "user": {
        return this.orgConfig["fabric_user"];
      }
      case type === "fabric_gateway_tlsCertPath" || type === "tlsCertPath": {
        return this.orgConfig["fabric_gateway_tlsCertPath"];
      }
    }
  }

  // Public Section
  async initializeBase() {
    if (this.baseIsInitialized) throw new GeneralError("Already initialized");
    try {
      console.log(
        styles.DEEPBLUE,
        `[${this.peer}] Creating a Wallet and the base opts...`
      );

      await this.#constructInMemoryWallet();
      await this.#addIdentityToWallet();
      this.#constructOpts();

      this.baseIsInitialized = true;
    } catch (err) {
      throw new GeneralError(err.message);
    }
  }

  initializeGatewayConnection() {
    if (!this.baseIsInitialized) throw new GeneralError("Not initialized");
    console.log(styles.DEEPBLUE, `[${this.peer}] Creating a Gateway...`);
    this.gateway = new FabricGateway();

    this.gatewayIsInitialized = true;
  }

  async initializePeerGatewayConnection() {
    if (this.peerGatewayIsInitialized)
      throw new GeneralError("Peer Gateway is already initialized");
    console.log(
      styles.DEEPBLUE,
      `[${this.peer}] Connecting with the Peer's Gateway...`
    );

    const mspId = this.ccp.organizations[this.organization].mspid;

    const grpcConnection = await newGrpcConnection(this.peer, this.ccp);

    this.peerIdentity = newIdentity(
      this.identity.credentials.certificate,
      mspId
    );
    this.peerSigner = newSigner(this.identity.credentials.privateKey);

    this.peerGateway = connect({
      client: grpcConnection,
      identity: this.peerIdentity,
      signer: this.peerSigner,
    });

    this.peerGatewayIsInitialized = true;

    console.log(
      styles.DEEPBLUE,
      `[${this.peer}] Connected with Peer's Gateway...`
    );
  }

  async connectWithGateway() {
    if (!this.gateway)
      throw new GeneralError("A Gateway needs to be initialized");
    console.log(
      styles.DEEPBLUE,
      `[${this.peer}] Connecting with the Gateway...`
    );
    await this.gateway.connect(this.ccp, this.opts);
  }

  async initializeContract(contractChannel, contractName) {
    if (
      this.contracts[contractName] &&
      this.contracts[contractName][contractChannel]
    )
      throw new GeneralError("Contract is initialized");

    try {
      this.contracts[contractName] = {};

      const contractNetwork = await this.gateway.getNetwork(contractChannel);

      this.contracts[contractName][contractChannel] =
        contractNetwork.getContract(contractName);
    } catch (err) {
      console.log(err);
    }
  }

  // Public Section

  async startListeningToContractEvents(contractChannel, contractName) {
    await this.#initializeContractListener(contractChannel, contractName);
  }

  get getIdentity() {
    if (!this.identity) this.#setIdentity();
    return this.identity;
  }

  getOrgConfigData() {
    return this.orgConfig;
  }

  getCAClient() {
    return this.certificateAuthority.getCAClient();
  }

  validateCertificate(certificate) {
    const successfulValidation =
      this.certificateAuthority.validateCertificate(certificate);

    if (successfulValidation) return true;
    return false;
  }

  async evaluateProposal(signedClientProposal) {
    try {
      return await this.BC_ACTIONS.evaluateProposalAction(signedClientProposal);
    } catch (err) {
      throw new GeneralError(err.message);
    }
  }

  async endorseProposal(signedClientProposal) {
    try {
      return await this.BC_ACTIONS.endorseAction(signedClientProposal);
    } catch (err) {
      throw new GeneralError(err.message);
    }
  }

  async commitTransaction(savedBytes, signedDigest) {
    try {
      return await this.BC_ACTIONS.commitAction(savedBytes, signedDigest);
    } catch (err) {
      throw new GeneralError(err.message);
    }
  }

  // Private Section

  // Various
  #constructOpts() {
    this.opts = {
      wallet: this.wallet,
      identity: this.identityUser,
      discovery: {
        enabled: true,
        asLocalhost: false,
      },
    };
  }

  async #constructInMemoryWallet() {
    this.wallet = await Wallets.newInMemoryWallet();
  }

  async #addIdentityToWallet() {
    if (!this.identity) throw new GeneralError("An Identity is needed");

    await this.wallet.put(this.getFromOrgConfig("user"), this.identity);
  }

  #setOrgConfigData(orgConfig) {
    this.orgConfig = orgConfig;
  }

  #setUser(orgConfig) {
    this.identityUser = orgConfig["fabric_user"];
  }

  #setCCP(orgConfig) {
    try {
      this.ccp = JSON.parse(
        fs.readFileSync(
          orgConfig["fabric_gateway_dir"] + "/" + orgConfig["fabric_ccp"]
        )
      );
    } catch (err) {
      throw new GeneralError(`Could not set the CCP, ${err}`);
    }
  }

  #setIdentity(orgConfig) {
    try {
      this.identity = JSON.parse(
        fs.readFileSync(
          orgConfig["fabric_wallet_dir"] +
            "/" +
            orgConfig["fabric_user"] +
            ".id"
        )
      );
    } catch (err) {
      throw new GeneralError(`Could not set an Identity, ${err}`);
    }
  }

  async #initializeContractListener(channelName, contractName) {
    const eventsBinder = await new ChaincodeEvents(
      this.gateway.getIdentity().mspId,
      this.peer
    ).initializeEvents();
    try {
      console.log(
        styles.CYAN,
        `[${this.peer}] Adding an event listener for contract ${contractName} at Channel ${channelName}...`
      );
      await this.contracts[contractName][channelName].addContractListener(
        eventsBinder
      );
    } catch (err) {
      console.log(
        styles.RED,
        `[${this.peer}] !-- Failed: Setup contract events - ${err}${styles.RESET}`
      );
      return;
    }
    console.log(
      styles.CYAN,
      `[${this.peer}] Success - Added an event listener for contract ${contractName} on Channel ${channelName}`
    );
  }
}

Network.getInstance = function (organization, peer, orgConfig = null) {
  organization = organization.toLowerCase();

  if (!instanceAr[organization]) instanceAr[organization] = {};
  const instance = instanceAr[organization][peer];
  if (!instance) {
    try {
      if (organization && peer) {
        instanceAr[organization][peer] = new Network(
          organization,
          peer,
          orgConfig
        );

        console.log(
          "\x1b[34m%s\x1b[0m",
          `[Organization: ${organization}, Peer: ${peer}] Network instance is ready`
        );

        return instanceAr[organization][peer];
      } else {
        throw new GeneralError(
          `[Organization: ${organization}, Peer: ${peer}] Error initializing new Network Interface`
        );
      }
    } catch (err) {
      console.log(`[${peer}] Error in new Network instance with error ${err}`);
      process.exit();
    }
  }
  return instance;
};

module.exports = Network;
