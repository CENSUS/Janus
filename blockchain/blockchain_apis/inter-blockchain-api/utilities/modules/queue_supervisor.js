"use strict";

const _ = require("lodash");
const {
  getProxyBCQueueConfig,
  getInterBCQueueConfig,
} = require("../../helper/configs/queue-config");
const styles = require("../../helper/various/indicators");
const queue_manager = require("./queue_manager");
const state_types = require("../../config").supervisorStateTypes;

class QueueSupervisor {
  constructor() {
    this.queueManager = queue_manager;
    this.qmMessageBroker = this.queueManager.messageBroker;
    this.supervisorName = "QUEUE SUPERVISOR";

    this.queuesToSupervise = {};
    this.supervisedQueuesInfo = {};

    this.queueCheckInterval = {};

    // Queues Configs
    this.proxyQueuesConfig = null;
    this.interBCQueuesConfig = null;

    // Initialization
    this.#initializeQueuesConfigs();
    this.#initializeQueuesToSupervise();
  }

  #initializeQueuesConfigs() {
    this.proxyQueuesConfig = getProxyBCQueueConfig();
    this.interBCQueuesConfig = getInterBCQueueConfig();
  }

  #initializeQueuesToSupervise() {
    Object.values(this.interBCQueuesConfig)
      .filter((q) => q["SHOULD_SUPERVISE"])
      .forEach((queue) => {
        this.queuesToSupervise[queue["QUEUE_NAME"]] = queue;
      });
  }

  #logMessage(style, msg) {
    return console.log(style, `[${this.supervisorName}] ${msg}`);
  }

  async #checkQueue(supervisedQueueName) {
    const SUPERVISED_QUEUE_INFO =
      this.supervisedQueuesInfo[supervisedQueueName]["SUPERVISED_QUEUE_INFO"];

    // const AFFECTED_QUEUE_INFO =
    //   this.supervisedQueuesInfo[supervisedQueueName]["AFFECTED_QUEUE_INFO"];

    const QUEUE_INFO_CALLBACK =
      this.supervisedQueuesInfo[supervisedQueueName]["queueInfoCallback"];

    QUEUE_INFO_CALLBACK().then((queueData) => {
      const queueName = queueData.queue;
      const currentQueuedMsgs = queueData.messageCount;

      const congestionRatio =
        SUPERVISED_QUEUE_INFO["MAX_CONCURRENT_CLIENTS"] / currentQueuedMsgs;

      this.#logMessage(
        styles.CYAN,
        `[QUEUE: ${queueName}] Inspecting queue ...`
      );

      if (currentQueuedMsgs > 0) {
        this.#logMessage(
          styles.YELLOW,
          `[QUEUE: ${queueName}] Seems that the ${queueName} is congested. Congestion ratio is: ${congestionRatio} - Analyzing the congestion ratio... `
        );
        this.#defineCongestion(supervisedQueueName, congestionRatio);
      } else {
        this.#logMessage(
          styles.YELLOW,
          `[QUEUE: ${queueName}] Queue is not congested ... `
        );

        const currentState =
          this.supervisedQueuesInfo[supervisedQueueName].currentState;

        if (currentState !== state_types.NORMAL.name) {
          this.#defineCongestion(supervisedQueueName, congestionRatio);
        }
      }

      setTimeout(
        this.#checkQueue.bind(this, supervisedQueueName),
        this.supervisedQueuesInfo[supervisedQueueName].queueInfoCheckInterval
      );
    });
  }

  startSupervisor() {
    this.#logMessage(styles.MAGENTA, `Starting the Queue Supervisor`);

    Object.values(this.queuesToSupervise).map(async (queue) => {
      const {
        BLOCKCHAIN,
        QUEUE_NAME: affectedQueue,
        AFFECTED_BY: supervisedQueueName,
        // MAX_CONCURRENT_CLIENTS,
        // DURABLE,
      } = queue;

      this.#logMessage(
        styles.MAGENTA,
        `Found a Queue to supervise at Blockchain: ${BLOCKCHAIN.toUpperCase()}, Queue Name: ${supervisedQueueName.toUpperCase()} - This Queue affects InterBlockchain's Queue: ${affectedQueue}`
      );

      const supervisedQueueInfo = _.first(
        Object.values({
          ...this.proxyQueuesConfig,
          ...this.interBCQueuesConfig,
        })
          .filter((q) => q["QUEUE_NAME"] === supervisedQueueName)
          .map((q) => q)
      );

      const affectedQueueInfo = _.first(
        Object.values({
          ...this.proxyQueuesConfig,
          ...this.interBCQueuesConfig,
        })
          .filter((q) => q["QUEUE_NAME"] === affectedQueue)
          .map((q) => q)
      );

      const queueInfoCallback =
        await this.queueManager.messageBroker.getQueueInfoCallback(
          supervisedQueueName
        );

      const setChannelPrefetchCallback =
        this.queueManager.messageBroker.setChannelPrefetchNr(affectedQueue);

      this.supervisedQueuesInfo[supervisedQueueName] = {
        SUPERVISED_QUEUE_INFO: supervisedQueueInfo,
        AFFECTED_QUEUE_INFO: affectedQueueInfo,
        queueInfoCallback,
        queueInfoCheckInterval: state_types.NORMAL.checkInterval,
        setPrefetch: setChannelPrefetchCallback,
        currentState: state_types.NORMAL.name,
        channelPrefetchLocked: false,
      };

      this.#setChannelPrefetch(supervisedQueueName);
      this.#checkQueue(supervisedQueueName);
    });
  }

  // Private Section

  #defineCongestion(supervisedQueueName, congestionRatio) {
    switch (true) {
      case congestionRatio < 0.3: {
        this.#logMessage(
          styles.RED,
          `[Queue ${supervisedQueueName}] The Congestion is: ${state_types.EXTREME.name}`
        );
        this.#updateSupervisedState(state_types.EXTREME, supervisedQueueName);

        break;
      }
      case 0.3 <= congestionRatio < 0.5: {
        this.#logMessage(
          styles.YELLOW,
          `[Queue ${supervisedQueueName}] The Congestion is: ${state_types.HIGH.name}`
        );
        this.#updateSupervisedState(state_types.HIGH, supervisedQueueName);
        break;
      }
      case 0.5 <= congestionRatio < 1: {
        this.#logMessage(
          styles.YELLOW,
          `[Queue ${supervisedQueueName}] The Congestion is: ${state_types.MEDIUM.name}`
        );
        this.#updateSupervisedState(state_types.MEDIUM, supervisedQueueName);
        break;
      }
      case 1 <= congestionRatio < 2 && congestionRatio !== Infinity: {
        this.#logMessage(
          styles.GREEN,
          `[Queue ${supervisedQueueName}] The Congestion is: ${state_types.LOW.name}`
        );
        this.#updateSupervisedState(state_types.LOW, supervisedQueueName);
        break;
      }
      case 2 <= congestionRatio || congestionRatio === Infinity: {
        this.#logMessage(
          styles.GREEN,
          `[Queue ${supervisedQueueName}] The Congestion is: ${state_types.NORMAL.name}`
        );
        this.#updateSupervisedState(state_types.NORMAL, supervisedQueueName);
        break;
      }
    }
  }

  #updateSupervisedState(state, supervisedQueueName) {
    if (
      this.supervisedQueuesInfo[supervisedQueueName].queueInfoCheckInterval ===
        state.checkInterval &&
      this.supervisedQueuesInfo[supervisedQueueName].currentState === state.name
    ) {
      this.#logMessage(
        styles.MAGENTA,
        `[Supervised Queue: ${supervisedQueueName}] No need to update the current state nor the check interval timer`
      );

      this.#logCurrentSupervisedQueueState(supervisedQueueName);

      return;
    }

    this.#logMessage(
      styles.MAGENTA,
      `[Supervised Queue: ${supervisedQueueName}] Updating the state to: ${state.name} & check interval timer to: ${state.name}`
    );

    this.supervisedQueuesInfo[supervisedQueueName].queueInfoCheckInterval =
      state.checkInterval;

    this.supervisedQueuesInfo[supervisedQueueName].currentState = state.name;

    this.#logMessage(
      styles.GREEN,
      `[Supervised Queue: ${supervisedQueueName}] Successfully updated the check interval timer to: ${state.name}`
    );

    this.#setChannelPrefetch(supervisedQueueName);
  }

  #logCurrentSupervisedQueueState(supervisedQueueName) {
    this.#logMessage(
      styles.MAGENTA,
      `[Supervised Queue: ${supervisedQueueName}] Current state: ${
        this.supervisedQueuesInfo[supervisedQueueName].currentState
      }, Check Interval: ${
        this.supervisedQueuesInfo[supervisedQueueName].queueInfoCheckInterval /
        1000
      } seconds`
    );
  }

  async #setChannelPrefetch(supervisedQueueName) {
    const queueData = this.supervisedQueuesInfo[supervisedQueueName];
    const isPrefetchLocked = queueData.channelPrefetchLocked;

    if (isPrefetchLocked) return;

    queueData.channelPrefetchLocked = true;
    const currentState = queueData.currentState;
    const throttleMul = state_types[currentState]["throttleMul"];

    const { AFFECTED_QUEUE_INFO, setPrefetch } = queueData;

    const MAX_CONCURRENT_CLIENTS =
      AFFECTED_QUEUE_INFO["MAX_CONCURRENT_CLIENTS"];

    const newPrefetch = MAX_CONCURRENT_CLIENTS * throttleMul;

    await setPrefetch(newPrefetch);

    queueData.channelPrefetchLocked = false;
  }
}

module.exports = new QueueSupervisor();
