"use strict";

const {
  promiseHandler,
  canStillReachConsensus,
} = require("../../helper/data_processors/various_processors");
const styles = require("../../helper/various/indicators");
const { SyncEntityWithBC } = require("../request_objects/objects");
const checkIntervalTime = 0.1 * 60 * 1000;

class ElectionsManager {
  constructor(network) {
    this.networkInstance = network;
    this.ActiveElections = {};
    this.ActiveElectionsContracts = {};
    this.checkExpiredIntervalID = null;
  }

  setCheckForExpired() {
    console.log(
      styles.CYAN,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] A Validator is being created - Will check for expired Elections every ${
        checkIntervalTime / 1000
      } seconds`
    );

    return setInterval(this.checkForExpired.bind(this), checkIntervalTime);
  }

  removeCheckForExpired() {
    if (this.checkExpiredIntervalID) {
      console.log(
        styles.CYAN,
        `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
          this.networkInstance.organizationMSP
        }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Has ${
          Object.keys(this.ActiveElections).length
        } ACTIVE Elections. Will remove the Elections' Validator`
      );
      try {
        clearInterval(this.checkExpiredIntervalID);
        this.checkExpiredIntervalID = null;
      } catch (err) {
        console.log(
          styles.RED,
          `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
            this.networkInstance.organizationMSP
          }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Could not remove the Elections' Validator, (${err})`
        );
      } finally {
        console.log(
          styles.GREEN,
          `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
            this.networkInstance.organizationMSP
          }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Successfully removed the Elections' Validator - From now on, will not listen to Elections' changes`
        );
      }
    }
  }

  checkForExpired() {
    console.log(
      styles.CYAN,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] WILL check for expired Elections...`
    );

    if (!Object.keys(this.ActiveElections).length > 0) {
      this.removeCheckForExpired();
      return;
    }

    console.log(
      styles.CYAN,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] CHECKING for expired Elections...`
    );
    const currentTime = new Date(Date.now());
    const expiredElections = [];

    Object.keys(this.ActiveElections).map((electionID) => {
      let { validUntil } = this.ActiveElections[electionID];
      validUntil = new Date(validUntil);
      if (validUntil < currentTime) expiredElections.push(electionID);
    });

    console.log(
      styles.YELLOW,
      expiredElections.length > 0
        ? `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
            this.networkInstance.organizationMSP
          }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Expired Election(s)  found: ${expiredElections.toString()}. Will clear the expired Elections...`
        : `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
            this.networkInstance.organizationMSP
          }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] No expired Election(s) found`
    );

    expiredElections.length > 0 &&
      expiredElections.forEach((electionID) =>
        this.electionFinished(electionID)
      );
  }

  async appendToActive(elections) {
    await Promise.all(
      Object.keys(elections).map(async (electionID) => {
        console.log(
          styles.CYAN,
          `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
            this.networkInstance.organizationMSP
          }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] (ElectionID: ${electionID}) New Election received... Pushing into the existing cached Elections...`
        );

        this.ActiveElections[electionID] = elections[electionID];

        await this.checkIfCompletedElection(electionID);
      })
    );

    if (
      Object.keys(this.ActiveElections).length > 0 &&
      !this.checkExpiredIntervalID
    ) {
      console.log(
        styles.YELLOW,
        `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
          this.networkInstance.organizationMSP
        }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] No validator for Expired Elections was found - Creating a Validator...`
      );
      this.checkExpiredIntervalID = this.setCheckForExpired();
    }
  }

  updateBallotsCount(_electionID) {
    this.ActiveElections[_electionID].currentVotes++;
  }

  getElections() {
    return this.ActiveElections;
  }

  updateCachedElections(_electionID) {
    console.log(
      styles.GREEN,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] (ElectionID: ${_electionID}) Completed Election received - Updating the cached Elections...`
    );
    delete this.ActiveElections[_electionID];
    console.log(
      styles.GREEN,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] (ElectionID: ${_electionID}) Successfully removed ${_electionID} from the cached Elections. Cached Elections: ${Object.keys(
        this.ActiveElections
      ).toString()}`
    );
  }

  async syncMSPElections(contractName, contractChannel) {
    const requestObject = new SyncEntityWithBC("activeElectionsAPI");

    const contract =
      this.networkInstance.contracts[contractName][contractChannel];

    const [elections, electionsErr] = await promiseHandler(
      contract
        .createTransaction("syncEntityWithBC")
        .evaluate(Buffer.from(JSON.stringify(requestObject)))
    );

    if (electionsErr) {
      console.log(
        `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
          this.networkInstance.organizationMSP
        }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Error while syncing the Elections, ${electionsErr} `
      );
      process.exit(1);
    }

    let orgMSPElections = {};
    try {
      orgMSPElections = JSON.parse(
        Buffer.from(
          JSON.parse(Buffer.from(elections).toString("utf8")).payload.data
        ).toString("utf8")
      );
    } catch (err) {
      console.log(
        `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
          this.networkInstance.organizationMSP
        }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Error while syncing the Elections, ${err}`
      );
      process.exit(1);
    }

    const currentDate = new Date(Date.now());
    Object.keys(orgMSPElections).forEach(async (electionID) => {
      orgMSPElections[electionID]["electionParams"] = {
        electionContract: contractName,
        electionChannel: contractChannel,
      };

      let electionData = orgMSPElections[electionID];
      const {
        currentVotes,
        currentApprovals,
        votersCount,
        audienceMajorityNr,
        validUntil,
      } = electionData;

      let hasFinished =
        audienceMajorityNr === currentApprovals ||
        new Date(validUntil) < currentDate;

      let canReachConsensus =
        !hasFinished &&
        canStillReachConsensus(
          currentVotes,
          votersCount,
          currentApprovals,
          audienceMajorityNr
        );

      if (hasFinished || !canReachConsensus) {
        console.log(
          `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
            this.networkInstance.organizationMSP
          }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] (ElectionID: ${electionID}) Election successfully completed (Outcome: ${
            currentApprovals >= audienceMajorityNr ? "Approved" : "Declined"
          })`
        );
        await this.electionFinished(electionID, contractName, contractChannel);
      }
    });

    const activeElectionsNr = Object.keys(orgMSPElections).length;
    console.log("-".repeat(process.stdout.columns));

    console.log(
      styles.GREEN,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Fetched the ACTIVE Elections - This organization has ${activeElectionsNr} active Election(s). ${
        activeElectionsNr > 0
          ? `\nAvailable Elections: ${Object.keys(orgMSPElections)}`
          : "\nNo Election IDs to print"
      }`
    );

    await this.appendToActive(orgMSPElections);

    activeElectionsNr > 0 &&
      console.log(
        styles.MAGENTA,
        `Current ACTIVE Elections for ${
          this.networkInstance.organizationMSP
        }: [${Object.keys(this.getElections()).toString((electionIDs) =>
          console.log(electionIDs)
        )}]`
      );

    console.log("-".repeat(process.stdout.columns));
  }

  async checkIfCompletedElection(electionID) {
    if (!this.ActiveElections[electionID]) {
      console.log(
        styles.RED,
        `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
          this.networkInstance.organizationMSP
        }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] Unknown Election ID! Can not check if the Election has been completed. [Election ID: ${electionID}]`
      );
      return;
    }
    const { audienceMajorityNr, votersCount, currentVotes, currentApprovals } =
      this.ActiveElections[electionID];

    const isActive = canStillReachConsensus(
      currentVotes,
      votersCount,
      currentApprovals,
      audienceMajorityNr
    );

    const majorityNotNeeded = audienceMajorityNr === 0

    !isActive || majorityNotNeeded && (await this.electionFinished(electionID));
  }

  async electionFinished(
    electionID,
    electionContract = null,
    electionChannel = null
  ) {
    console.log(
      styles.YELLOW,
      `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
        this.networkInstance.organizationMSP
      }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] (ElectionID: ${electionID}) Completed Election found - Will communicate with the Blockchain`
    );

    if (!electionContract || !electionChannel)
      ({ electionContract, electionChannel } =
        this.ActiveElections[electionID]["electionParams"]);

    const contract =
      this.networkInstance.contracts[electionContract][electionChannel];

    try {
      await contract.submitTransaction(
        "updateElection",
        Buffer.from(electionID)
      );
    } catch (err) {
      console.log(
        styles.RED,
        `[${this.networkInstance.organization.toUpperCase()} (MSP: ${
          this.networkInstance.organizationMSP
        }, BC: ${this.networkInstance.baseBCName.toUpperCase()})] (ElectionID: ${electionID}) Could not update the Election, ${err}`
      );
    }
  }
}

module.exports = ElectionsManager;
