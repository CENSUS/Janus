const StatsManager = require("../../statistics/stats_manager.js");
const {
  metrics: { metricsOn },
} = require("../../../config/main_config.js");
const event_types = require("../../../config/bc_network/events/event_types.js");
const styles = require("../../../config/styles.js");

module.exports = class ChaincodeEvents {
  constructor(orgMSP, user) {
    if (!orgMSP || !user) {
      return;
    }
    this.orgMSP = orgMSP;
    this.user = user;
  }

  async initializeEvents() {
    const listener = async (event) => {
      const eventCreator =
        event.getTransactionEvent().transactionData.actions[0].header.creator
          .mspid;
      if (eventCreator != this.orgMSP) {
        //console.info(styles.YELLOW, `AS ${this.user} UNDER ${this.orgMSP}: The event is not emitted by this organization [Emitted From: ${eventCreator}]`);
        return;
      }
      console.info(
        styles.GREEN,
        `AS ${this.user} UNDER ${this.orgMSP}: Caught new event emitted by the chaincode...`
      );
      console.log(styles.GREEN, `Contract Event Received: ${event.eventName}`);
      this.investigateEvent(event);
    };
    return listener;
  }

  async investigateEvent(event) {
    if (event_types[event.eventName]) {
      if (event_types[event.eventName].shouldAvoid) {
        console.log(
          styles.MAGENTA,
          `Avoiding: ${event.eventName} - Will not do anything with this event`
        );
        return;
      }

      const eventName = event.eventName;
      const eventObject = event_types[event.eventName];
      const eventCreator =
        event.getTransactionEvent().transactionData.actions[0].header.creator
          .mspid;

      const asset = event.payload.toString();
      const assetParsed = JSON.parse(asset);
      const eventTransaction = event.getTransactionEvent();

      // const eventBlock = eventTransaction.getBlockEvent();

      const eventData = {
        eventName,
        eventObject,
        eventTransaction,
        eventCreator,
        assetParsed,
      };

      this.manageEvent(eventData);
    } else {
      console.log(
        styles.RED,
        `<--------- UNKNOWN EVENT: ${event.eventName} - Will not do anything with this event`
      );
    }
  }

  async manageEvent(eventData) {
    const {
      eventName,
      // eventObject,
      // eventTransaction,
      // eventCreator,
      assetParsed,
    } = eventData;

    // const requestData = {
    //   txid: eventTransaction.transactionId,
    //   org: this.user, //this.user or orgMSP?
    //   orgMSP: eventCreator,
    // };

    switch (eventName) {
      case event_types.UpdatedLogData.eventName: {
        if (metricsOn) StatsManager.completeBCActionRTT(assetParsed.reqID);
        break;
      }
      default:
        console.log(
          styles.RED,
          `<--------- UNKNOWN ACTION FOR EVENT ${eventName} - Will not do anything with this event`
        );
    }
  }
};
