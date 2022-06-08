"use strict";
const {
  jsonParser,
  defineRoutingKey,
} = require("../../helper/data_processors/various_processors");
const styles = require("../../helper/various/indicators");
const MessageBroker = require("../requests_management/message_broker");

class QueueManager {
  constructor() {
    this.networkInstances = {};

    this.knownOrganizationCallbacks = {};

    MessageBroker.getInstance().then((broker) => {
      this.messageBroker = broker;
    });
  }

  // Public Section

  updateKnownOrganizationsCallbacks(callbacks) {
    this.knownOrganizationCallbacks = callbacks;
  }

  async createChannel(channelName) {
    await this.#initializeChannel(channelName);
  }

  async subscribeToTopic(channelName, routingKey, maxConcurrentUsers) {
    await this.#subscribeToTopic(channelName, routingKey, maxConcurrentUsers);
  }

  async sendToQueue(channel, routingKey, queue, msg) {
    await this.#sendToQueue(channel, routingKey, queue, msg);
  }

  constructRoutingKeyInfo(domainBCName, organization, peer) {
    return this.#defineRoutingKeyInfo(domainBCName, organization, peer);
  }

  getQueue(domain) {
    return this.#defineQueue(domain);
  }

  // Private section

  async #initializeChannel(channelName) {
    await this.messageBroker.createChannel(channelName);
  }

  async #subscribeToTopic(channelName, routingKey, maxConcurrentUsers) {
    const queue = this.#defineQueue(channelName);
    const handler = this.#defineQueueHandler().bind(this);
    await this.messageBroker.subscribeToTopic(
      queue,
      handler,
      channelName,
      routingKey,
      maxConcurrentUsers
    );
  }

  async #sendToQueue(channelName, routingKey, queue, msg) {
    await this.messageBroker.sendToDomainQueue(
      channelName,
      routingKey,
      queue,
      msg
    );
  }

  #defineQueue(domain) {
    return `${domain.toUpperCase()}`;
  }

  #defineQueueHandler() {
    return async (msg, ack) => {
      const queueData = jsonParser(msg.content.toString());
      const routingKeyString = msg.fields.routingKey;
      const routingKeyInfo = defineRoutingKey(routingKeyString);

      try {
        const orgCallback =
          this.knownOrganizationCallbacks[routingKeyInfo.domain][
            routingKeyInfo.organization
          ][routingKeyInfo.peer];

        await orgCallback(queueData);
        ack();
      } catch (err) {
        console.log(styles.RED, `[Queue Manager] Callback error - ${err}`);
        ack();
      }
    };
  }

  #defineRoutingKeyInfo(domain, organization, peer) {
    return {
      domain,
      organization,
      peer,
    };
  }
}

module.exports = new QueueManager();
