const Network = require("./blockchain_org_net_manager");
const styles = require("../helper/various/indicators");
const { GeneralError } = require("../helper/data_processors/error_processor");
const queue_manager = require("./modules/queue_manager");
const {
  peerNameNormalizer,
  getOrgConfig,
} = require("../helper/data_processors/various_processors");
const { PEERS } = require("../config");
const {
  getProxyBCQueueConfig,
  getInterBCQueueConfig,
} = require("../helper/configs/queue-config");

class BlockchainManager {
  constructor() {
    this.availableDomains = {};
    this.availableOrgs = {};
    this.availableChannels = [];
    this.maxConcurrentQueueUsers = {};
    this.isInitialized = false;

    this.availableMSPs = {};

    this.queueManager = queue_manager;

    this.organizationsCallbacks = {};
  }

  // PUBLIC SECTION

  get availableOrganizations() {
    return this.availableOrgs;
  }

  getKnownOrgCallbacks(routingKeyString) {
    const routingKeyParts = routingKeyString.split(".");
    const [domain, organization, peer] = [
      routingKeyParts[0],
      routingKeyParts[1],
      routingKeyParts[2],
    ];
    return this.organizationsCallbacks[domain][organization][peer];
  }

  getInstances() {
    return Network.getInstances();
  }

  async initialize() {
    const organizationAsMSP = (organization) => {
      organization = organization.replace(/-/g, "");
      organization =
        organization.charAt(0).toUpperCase() + organization.slice(1) + "MSP";
      return organization;
    };
    const addAvailableDomain = (domain) => {
      if (!Object.keys(this.availableDomains).includes(domain))
        this.availableDomains[domain] = {};

      if (!Object.keys(this.availableMSPs).includes(domain))
        this.availableMSPs[domain] = [];
    };

    const addAvailableOrg = (domain, organization) => {
      if (!Object.keys(this.availableDomains[domain]).includes(organization))
        this.availableDomains[domain][organization] = [];

      if (
        !Object.keys(this.availableMSPs[domain]).includes(
          organizationAsMSP(organization)
        )
      )
        this.availableMSPs[domain].push(organizationAsMSP(organization));
    };

    const addAvailablePeer = (domain, organization, peer) => {
      if (!this.availableDomains[domain][organization].includes(peer))
        this.availableDomains[domain][organization].push(peer);
    };

    if (this.isInitialized) throw new GeneralError("Already initialized");
    await Promise.all(
      PEERS.map(async (peer) => {
        console.log(
          styles.MAGENTA,
          `Will initialize a connection with the peer`,
          peer.toUpperCase()
        );
        const normalizedPeer = peerNameNormalizer(peer);

        this.orgConfig = getOrgConfig(normalizedPeer);

        const {
          fabric_blockchain_domain: blockchains,
          fabric_organization: organization,
        } = this.orgConfig;

        const derivedBlockchains = blockchains.split(",");
        const baseBlockchain = derivedBlockchains[0].trim();
        const domainBlockchain = derivedBlockchains[1].trim();

        if (!this.availableOrgs[organization])
          this.availableOrgs[organization] = [];

        this.availableOrgs[organization].push(peer);

        const instance = Network.getInstance(
          organization,
          peer,
          this.orgConfig
        );

        instance.initializeKnownMSPs(this.availableMSPs);

        await instance.initializeBase(baseBlockchain, domainBlockchain);
        instance.initializeGatewayConnection();
        await instance.connectWithBaseGateway();
        await instance.connectWithDomainBCGateway();

        // Peer Gateway
        await instance.initializePeerGatewayConnection().INITIALIZE_BASE();
        await instance.initializePeerGatewayConnection().INITIALIZE_DOMAIN();

        for (let bcName of derivedBlockchains) {
          bcName = bcName.trim();

          this.#appendKnownOrgCallback(
            bcName,
            organization,
            peer,
            instance.organizationCallback()
          );

          addAvailableDomain(bcName);
          addAvailableOrg(bcName, organization);
          addAvailablePeer(bcName, organization, peer);

          console.log(
            styles.MAGENTA,
            `[${peer}] Working with contracts of Blockchain ${bcName.toUpperCase()}`
          );

          const [channel, contracts] = [
            instance.getFromOrgConfig("channel"),
            instance.getFromOrgConfig(`fabric_${bcName}_contracts`),
          ];

          for (let contract of contracts) {
            contract = contract.trim();
            console.log(
              styles.MAGENTA,
              `[${peer}] Initializing a connection with contract ${contract} at Channel ${channel}`
            );

            await instance.initializeContract(bcName, channel, contract);

            console.log(
              styles.MAGENTA,
              `[${peer}] Will add an Event listener to contract ${contract} at Channel ${channel}`
            );
            await instance.startListeningToContractEvents(
              bcName,
              channel,
              contract
            );
          }
        }
        await instance.initializeQueueConnection();

        console.log(styles.GREEN, `[${peer}] Initialization completed`);
      })
    );
  }

  async initializeQueues() {
    this.#updateQueueManagerKnownOrgCallbacks();
    this.#defineQueuesConcurrentConfig();
    await this.#initializeDomainChannels();
    await this.#joinDomainChannels();
  }

  // PRIVATE SECTION

  #defineQueuesConcurrentConfig() {
    const proxyBCQueueConfig = getProxyBCQueueConfig();
    const interBCQueuesConfig = getInterBCQueueConfig();
    const availableDomains = Object.keys(this.availableDomains);

    availableDomains.forEach((domain) => {
      if (Object.keys(proxyBCQueueConfig).includes(domain.toUpperCase())) {
        this.maxConcurrentQueueUsers[domain.toUpperCase()] =
          proxyBCQueueConfig[domain.toUpperCase()]["MAX_CONCURRENT_CLIENTS"];
      } else {
        this.maxConcurrentQueueUsers[domain.toUpperCase()] =
          interBCQueuesConfig[domain.toUpperCase()]["MAX_CONCURRENT_CLIENTS"];
      }
    });
  }

  #appendKnownOrgCallback(domain, organization, peer, callback) {
    if (!Object.keys(this.organizationsCallbacks).includes(domain))
      this.organizationsCallbacks[domain] = {};

    if (
      !Object.keys(this.organizationsCallbacks[domain]).includes(organization)
    )
      this.organizationsCallbacks[domain][organization] = {};

    if (
      !Object.keys(this.organizationsCallbacks[domain][organization]).includes(
        peer
      )
    )
      this.organizationsCallbacks[domain][organization][peer] = callback;
  }

  #updateQueueManagerKnownOrgCallbacks() {
    this.queueManager.updateKnownOrganizationsCallbacks(
      this.organizationsCallbacks
    );
  }

  async #initializeDomainChannels() {
    await Promise.all(
      Object.keys(this.availableDomains).map(async (domain) => {
        await this.queueManager.createChannel(domain);

        if (!this.availableChannels.includes(domain))
          this.availableChannels.push(domain);
      })
    );
  }

  async #joinDomainChannels() {
    Object.keys(this.availableDomains).forEach(async (domain) => {
      const routingKey = `${domain}.#`;
      const maxConcurrentUsers =
        this.maxConcurrentQueueUsers[domain.toUpperCase()];

      await this.queueManager.subscribeToTopic(
        domain,
        routingKey,
        maxConcurrentUsers
      );
    });
  }
}

module.exports = new BlockchainManager();
