"use strict";

const ChaincodeEvents = require("../../utilities/modules/chaincode_events");
const styles = require("../various/indicators");
const { accessNestedJSON } = require("./various_processors");
const ELECTION_CONTRACTS = JSON.parse(process.env.ELECTION_CONTRACTS);


module.exports = {
  updateMSPElections: async function () {
    const NetworkBootstrapper = require("../../utilities/blockchain_manager");

    console.log("-".repeat(process.stdout.columns));
    console.log(styles.CYAN, `Updating the MSPs Elections`);
    console.log("-".repeat(process.stdout.columns));
    const networkInstances = NetworkBootstrapper.getInstances();

    await Promise.all(
      Object.keys(networkInstances).map(async (organization) => {
        await Promise.all(
          Object.values(networkInstances[organization]).map(
            async (instance) => {
              const { contracts: instanceContracts } = instance;

              await Promise.all(
                Object.values(ELECTION_CONTRACTS).map(async (elContract) => {
                  const {
                    contractName: elContractName,
                    contractChannel: elContractChannel,
                  } = elContract;
                  await Promise.all(
                    elContractChannel.map(async (elChannel) => {
                      const hasAccess =
                        typeof accessNestedJSON(
                          instanceContracts,
                          elContractName,
                          elChannel
                        ) !== "undefined"
                          ? true
                          : false;
                      if (hasAccess && !instance.MSPElections) {
                        console.log(
                          styles.YELLOW,
                          `A Contract that supports Elections for ${instance.organization} was found\nNo MSP Elections Manager instance was found`
                        );
                        instance.deployMSPElectionManager();
                      }
                      hasAccess &&
                        (await instance.electionsManager.syncMSPElections(
                          elContractName,
                          elChannel
                        ));
                    })
                  );
                })
              );
            }
          )
        );
      })
    );
  },
  initializeEvents: function (NetworkBoostrapper) {
    return new ChaincodeEvents(NetworkBoostrapper);
  },
};
