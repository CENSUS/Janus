"use strict";
const styles = require("../../helper/various/indicators.js");
const events = require("../../helper/various/event_types.js");

const {
  jsonParser,
  getSpecialTypeEvents,
} = require("../../helper/data_processors/various_processors.js");
const specialEvents = getSpecialTypeEvents();

class ChaincodeEvents {
  constructor(network) {
    this.networkInstance = network;
  }

  initializeEvents() {
    return async (event) => {
      const eventCreator =
        event.getTransactionEvent().transactionData.actions[0].header.creator
          .mspid;

      const eventName = event.eventName;
      if (specialEvents.includes(eventName)) {
        this.investigateSpecialEvent(event);
      } else {
        if (!this.orgMSPOwnsEvent(eventCreator, eventName)) return;
        this.investigateEvent(event);
      }
    };
  }

  async investigateSpecialEvent(event) {
    if (events[event.eventName].shouldAvoid) {
      return;
    }
    const eventCreator =
      event.getTransactionEvent().transactionData.actions[0].header.creator
        .mspid;
    const eventName = event.eventName;
    const eventInfo = events[event.eventName];

    if (eventInfo.isElectionType) {
      const asset = event.payload.toString();
      const assetParsed = jsonParser(asset);

      if (eventInfo.electionInitiated) {
        if (!this.orgMSPOwnsEvent(eventCreator, eventName)) return;
        this.printEventData(event);
        const { condition, message } = assetParsed;
        condition &&
          this.networkInstance.electionsManager.appendToActive(message);
      } else if (eventInfo.electionBallotUpdate) {
        const { electionID } = assetParsed;
        if (!this.orgMSPOwnsActiveElection(electionID)) return;

        this.printEventData(event);
        this.networkInstance.electionsManager.updateBallotsCount(electionID);
        this.networkInstance.electionsManager.checkIfCompletedElection(
          electionID
        );
      } else if (eventInfo.electionEndedUpdate) {
        if (!this.orgMSPOwnsEvent(eventCreator, eventName)) return;
        const electionID = assetParsed;
        this.networkInstance.electionsManager.updateCachedElections(electionID);
      }
    }
  }

  async investigateEvent(event) {
    if (events[event.eventName]) {
      if (events[event.eventName].shouldAvoid) {
        return;
      }
      const eventCreator =
        event.getTransactionEvent().transactionData.actions[0].header.creator
          .mspid;

      const asset = event.payload.toString();
      const assetParsed = JSON.parse(asset);
      const eventInfo = events[event.eventName];
      const eventTransaction = event.getTransactionEvent();

      if (eventInfo.shouldForward) {
        const requestData = {
          txid: eventTransaction.transactionId,
          org: this.networkInstance.organizationMSP,
          orgMSP: eventCreator,
          from: eventInfo.forwardParameters.from,
          to: eventInfo.forwardParameters.to,
        };
        const dataToAppend = {
          requestData,
          dataToPush: assetParsed,
        };

        let response = false;
        if (requestData.to === "BASE") {
          response = await this.networkInstance.appendToBaseQueue(dataToAppend);
        } else if (requestData.to === "DOMAIN") {
          response = await this.networkInstance.appendToDomainQueue(
            dataToAppend
          );
        }

        !response &&
          console.log(
            styles.YELLOW,
            `Could not add ${eventTransaction.transactionId} for forwarding [FROM: ${eventInfo.forwardParameters.from}, TO: ${eventInfo.forwardParameters.to}]`
          );
      }
    }
  }

  orgMSPOwnsEvent(eventCreator, eventName, includeEventNotOwner = false) {
    if (eventCreator !== this.networkInstance.organizationMSP) {
      includeEventNotOwner &&
        console.info(
          styles.YELLOW,
          `[${this.networkInstance.organizationMSP.toUpperCase()}, ${this.networkInstance.peer.toUpperCase()}] The event is not emitted by this organization [Emitted From: ${eventCreator}]`
        );
      return false;
    }

    return true;
  }

  orgMSPOwnsActiveElection(electionID) {
    const activeElections =
      this.networkInstance.electionsManager.getElections();
    return electionID in activeElections;
  }

  printEventData(event) {
    const eventTransaction = event.getTransactionEvent();
    console.log(
      `*** event: ${event.eventName} - transaction: ${eventTransaction.transactionId} status:${eventTransaction.status}`
    );
    const eventBlock = eventTransaction.getBlockEvent();
    console.log(`*** block: ${eventBlock.blockNumber.toString()}`);
  }
}

module.exports = ChaincodeEvents;
