const Network = require("./blockchain_org_net_manager.js");
const styles = require("./../config/styles.js");
const {
  peerNameNormalizer,
  getOrgConfig,
} = require("./../utils/processors/various.js");
const { PEERS } = require("./../config/config");
const { GeneralError } = require("./../middlewares/utils/error_types.js");

class BlockchainManager {
  constructor() {
    this.availableOrgs = {};
    this.isInitialized = false;
  }

  get availableOrganizations() {
    return this.availableOrgs;
  }

  getNetworkInstance(organization, peer) {
    return Network.getInstance(organization, peer);
  }

  async initialize() {
    if (this.isInitialized) throw new GeneralError("Already initialized");

    await Promise.all(
      PEERS.map(async (peer) => {
        console.log(
          styles.MAGENTA,
          `Will initialize a connection with peer`,
          peer.toUpperCase()
        );
        const normalizedPeer = peerNameNormalizer(peer);

        this.orgConfig = getOrgConfig(normalizedPeer);

        const { fabric_organization: organization } = this.orgConfig;

        if (!this.availableOrgs[organization])
          this.availableOrgs[organization] = [];

        this.availableOrgs[organization].push(peer);

        const instance = Network.getInstance(
          organization,
          peer,
          this.orgConfig
        );

        await instance.initializeBase();
        instance.initializeGatewayConnection();
        await instance.connectWithGateway();

        // Peer Gateway
        await instance.initializePeerGatewayConnection();

        const [channel, contracts] = [
          instance.getFromOrgConfig("channel"),
          instance.getFromOrgConfig("contracts"),
        ];

        for (let contract of contracts) {
          contract = contract.trim();
          console.log(
            styles.MAGENTA,
            `[${peer}] Initializing a connection with contract ${contract} at Channel ${channel}`
          );

          await instance.initializeContract(channel, contract);

          console.log(
            styles.MAGENTA,
            `[${peer}] Will add an Event listener to contract ${contract} at Channel ${channel}`
          );
          await instance.startListeningToContractEvents(channel, contract);
        }
        console.log(styles.GREEN, `[${peer}] Initialization completed`);
      })
    );
  }
}

module.exports = new BlockchainManager();
