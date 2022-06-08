const { Gateway: FabricGateway, Wallets } = require("fabric-network");
const CertificateAuthority = require("./bootstrap_ca");
const { GeneralError } = require("../helper/data_processors/error_processor");
const ElectionsManager = require("./modules/elections_manager");
const styles = require("../helper/various/indicators.js");
const _ = require("lodash");
const fs = require("fs");
const { initializeEvents } = require("../helper/data_processors/initializers");
const queue_manager = require("./modules/queue_manager");
const BlockchainInterconnector = require("./blockchain_interconnector");
const {
  newGrpcConnection,
  newIdentity,
  newSigner,
} = require("./gateway_utilities/utils");
const { connect } = require("@hyperledger/fabric-gateway");

const instanceAr = {};
class Network extends BlockchainInterconnector {
  constructor(organization, peer, orgConfig) {
    super();
    if (instanceAr[organization][peer]) {
      return instanceAr[organization][peer];
    }

    this.organization = organization;
    this.peer = peer;

    this.organizationMSP = null;
    this.orgConfig = null;
    this.identity = null;
    this.baseCcp = null;
    this.domainCcp = null;
    this.identityUser = null;
    this.wallet = null;
    this.opts = null;
    this.contracts = {};

    this.availableMSPs = {};

    this.#setOrgConfigData(orgConfig);
    this.#setIdentity(orgConfig);
    this.#setUser(orgConfig);

    this.baseIsInitialized = false;
    this.baseBCGatewayIsInitialized = false;
    this.domainBCGatewayIsInitialized = false;
    this.chaincodeEventsInitialized = false;

    this.peerBaseGatewayIsInitialized = false;
    this.peerDomainGatewayIsInitialized = false;

    // Network
    this.gateways = {};

    this.peerBaseGateway = null;
    this.peerDomainGateway = null;

    // Organization's Certificate Authority
    this.certificateAuthority = null;

    // Various
    this.chaincodeEvents = null;

    this.baseBCName = null;
    this.domainBCName = null;

    this.queueManager = null;
    this.baseOrgQueue = null;
    this.domainOrgQueue = null;
  }

  getFromOrgConfig(type) {
    switch (true) {
      case type === "fabric_blockchain" || type === "blockchain": {
        return this.orgConfig["fabric_blockchain"].split(",");
      }
      case type === "fabric_organization" || type === "organization": {
        return this.orgConfig["fabric_organization"];
      }
      case type === "fabric_channel" || type === "channel": {
        return this.orgConfig["fabric_channel"];
      }
      case type === `fabric_${this.baseBCName}_contracts` ||
        type === "base_domain_contracts": {
        return this.orgConfig[`fabric_${this.baseBCName}_contracts`].split(",");
      }
      case type === `fabric_${this.domainBCName}_contracts` ||
        type === "domain_contracts": {
        return this.orgConfig[`fabric_${this.domainBCName}_contracts`].split(
          ","
        );
      }
      case type === "fabric_wallet_dir" || type === "wallets_dir": {
        return this.orgConfig["fabric_wallet_dir"];
      }
      case type === "fabric_gateway_dir" || type === "gateway_dir": {
        return this.orgConfig["fabric_gateway_dir"];
      }
      case type === `fabric_ccp_${this.baseBCName}` || type === "base_ccp": {
        return this.orgConfig[`fabric_ccp_${this.baseBCName}`];
      }
      case type === `fabric_ccp_${this.domainBCName}` ||
        type === "domain_ccp": {
        return this.orgConfig[`fabric_ccp_${this.domainBCName}`];
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
  async initializeBase(baseBCName, domainBCName) {
    if (this.baseIsInitialized) throw new GeneralError("Already initialized");

    try {
      console.log(
        styles.DEEPBLUE,
        `[${this.peer}] Creating a Wallet and the base opts...`
      );

      await this.#constructInMemoryWallet();
      await this.#addIdentityToWallet();
      this.#constructOpts();

      this.baseBCName = baseBCName;
      this.domainBCName = domainBCName;

      console.log(styles.DEEPBLUE, `[${this.peer}] Reading the CCPs...`);

      this.#setCCP(this.orgConfig);

      this.organizationMSP =
        this.baseCcp.organizations[this.organization].mspid;

      this.certificateAuthority = CertificateAuthority.getInstance(
        this.organization
      ).initializeInstance(this.baseCcp);

      this.baseIsInitialized = true;
    } catch (err) {
      throw new GeneralError(err);
    }
  }

  initializeKnownMSPs(msps) {
    this.availableMSPs = msps;
  }

  async initializeQueueConnection() {
    this.queueManager = queue_manager;

    // Base queue (e.g. Proxy)

    const baseChannel = this.baseBCName;

    const baseRoutingKey = this.queueManager.constructRoutingKeyInfo(
      this.baseBCName,
      this.organization,
      this.peer
    );

    const baseQueue = this.queueManager.getQueue(this.baseBCName);

    this.baseOrgQueue = { baseChannel, baseQueue, baseRoutingKey };

    // Domain queue (e.g. Medical / Manufacturer)

    const domainChannel = this.domainBCName;

    const domainRoutingKey = this.queueManager.constructRoutingKeyInfo(
      this.domainBCName,
      this.organization,
      this.peer
    );

    const domainQueue = this.queueManager.getQueue(this.domainBCName);

    this.domainOrgQueue = { domainChannel, domainQueue, domainRoutingKey };
  }

  organizationCallback() {
    return this.#receiveOrganizationQueueData.bind(this);
  }

  initializeGatewayConnection() {
    if (!this.baseIsInitialized) throw new GeneralError("Not initialized");
    console.log(styles.DEEPBLUE, `[${this.peer}] Creating a Gateway...`);

    this.gateways[this.baseBCName] = new FabricGateway();
    this.baseBCGatewayIsInitialized = true;

    this.gateways[this.domainBCName] = new FabricGateway();
    this.domainBCGatewayIsInitialized = true;
  }

  initializePeerGatewayConnection() {
    const consoleLog = (type) => {
      const startInit = () => {
        if (this.peerGatewayIsInitialized)
          throw new GeneralError("Peer Gateway is already initialized");

        console.log(
          styles.DEEPBLUE,
          `[${this.peer}] Connection with the Peer's Gateway (${type})...`
        );
      };

      const endInit = () => {
        console.log(
          styles.DEEPBLUE,
          `[${this.peer}] Connected with the Peer's Gateway (${type})...`
        );
      };

      return { startInit: startInit, endInit: endInit };
    };

    const BASE = async () => {
      consoleLog("BASE").startInit();

      const grpcConnection = await newGrpcConnection(this.peer, this.baseCcp);

      this.peerIdentity = newIdentity(
        this.identity.credentials.certificate,
        this.baseCcp.organizations[this.organization].mspid
      );
      this.peerSigner = newSigner(this.identity.credentials.privateKey);

      this.peerBaseGateway = connect({
        client: grpcConnection,
        identity: this.peerIdentity,
        signer: this.peerSigner,
      });

      this.peerBaseGatewayIsInitialized = true;

      consoleLog("BASE").endInit();
    };

    const DOMAIN = async () => {
      consoleLog("DOMAIN").startInit();

      const grpcConnection = await newGrpcConnection(this.peer, this.domainCcp);

      this.peerDomainGateway = connect({
        client: grpcConnection,
        identity: this.peerIdentity,
        signer: this.peerSigner,
      });

      this.peerDomainGatewayIsInitialized = true;

      consoleLog("DOMAIN").endInit();
    };

    return { INITIALIZE_BASE: BASE, INITIALIZE_DOMAIN: DOMAIN };
  }

  async connectWithBaseGateway() {
    if (!this.gateways[this.baseBCName])
      throw new GeneralError(
        "A Base BC (normally, PROXY BC) Gateway is already initialized"
      );
    console.log(
      styles.DEEPBLUE,
      `[${this.peer}] Connecting with the Base Gateway...`
    );
    await this.gateways[this.baseBCName].connect(this.baseCcp, this.opts);
  }

  async connectWithDomainBCGateway() {
    if (!this.gateways[this.domainBCName])
      throw new GeneralError(
        "A Domain BC Gateway (normally, Medical or Manufacturer) is already initialized"
      );
    console.log(
      styles.DEEPBLUE,
      `[${this.peer}] Connecting with the Domain Gateway...`
    );
    await this.gateways[this.domainBCName].connect(this.domainCcp, this.opts);
  }

  async initializeContract(bcName, contractChannel, contractName) {
    if (
      this.contracts[contractName] &&
      this.contracts[contractName][contractChannel]
    )
      throw new GeneralError("Contract is initialized");

    try {
      this.contracts[contractName] = {};

      const contractNetwork = await this.gateways[bcName].getNetwork(
        contractChannel
      );

      this.contracts[contractName][contractChannel] =
        contractNetwork.getContract(contractName);
    } catch (err) {
      console.log(err);
    }
  }

  async sendToBaseQueue(msg) {
    await this.queueManager.sendToQueue(
      this.baseOrgQueue.baseChannel,
      this.baseOrgQueue.baseRoutingKey,
      this.baseOrgQueue.baseQueue,
      msg
    );
    return;
  }

  async sendToDomainQueue(msg) {
    await this.queueManager.sendToQueue(
      this.domainOrgQueue.domainChannel,
      this.domainOrgQueue.domainRoutingKey,
      this.domainOrgQueue.domainQueue,
      msg
    );
    return;
  }

  // Public Section

  deployMSPElectionManager() {
    console.log(
      styles.CYAN,
      `Deploying a new MSP Elections Manager for ${this.organization} [MSP: ${this.organizationMSP}]`
    );

    this.electionsManager = new ElectionsManager(this);
  }

  async startListeningToContractEvents(bcName, contractChannel, contractName) {
    this.chaincodeEvents = initializeEvents(
      instanceAr[this.organization][this.peer]
    ); // Needs the current instance
    await this.#initializeContractListener(
      bcName,
      contractChannel,
      contractName
    );
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

  async #receiveOrganizationQueueData(data) {
    const {
      requestData: { to: REQUEST_DESTINATION },
    } = data;

    switch (REQUEST_DESTINATION) {
      case "BASE": {
        await this.forwardRequest(data);
        return;
      }
      case "DOMAIN": {
        const domainResponse = await this.forwardRequest(data);
        domainResponse && (await this.sendToBaseQueue(domainResponse));
        return;
      }
      default:
        return;
    }
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
      this.baseCcp = JSON.parse(
        fs.readFileSync(
          orgConfig["fabric_gateway_dir"] +
            "/" +
            orgConfig[`fabric_ccp_${this.baseBCName}`]
        )
      );

      this.domainCcp = JSON.parse(
        fs.readFileSync(
          orgConfig["fabric_gateway_dir"] +
            "/" +
            orgConfig[`fabric_ccp_${this.domainBCName}`]
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

  async #initializeContractListener(bcName, networkName, contractName) {
    if (this.chaincodeEventsInitialized)
      throw new GeneralError(
        styles.RED,
        "Chaincode Events listener is already initialized"
      );
    try {
      console.log(
        styles.CYAN,
        `Adding an event listener for contract ${contractName} on Channel ${networkName}, Blockchain ${bcName}...`
      );

      const eventsBinder = this.chaincodeEvents.initializeEvents();

      try {
        await this.contracts[contractName][networkName].addContractListener(
          eventsBinder
        );
      } catch (err) {
        console.log(
          styles.RED,
          `!-- Failed: Setup contract events - ${err}${styles.RESET}`
        );
        return;
      }
    } catch (err) {
      console.log("Error while initializing contract events ", err);
      return;
    }
    console.log(
      styles.CYAN,
      `Success - Added an event listener for contract ${contractName} on Channel ${networkName}`
    );
  }
}

Network.getInstance = function (organization, peer, orgConfig) {
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

Network.getInstances = () => instanceAr;

module.exports = Network;
