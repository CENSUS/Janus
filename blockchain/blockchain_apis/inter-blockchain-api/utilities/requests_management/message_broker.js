const amqp = require("amqplib");
const _ = require("lodash");
const { rabbitmqOptions } = require("../../config");
const config = require("../../config");
const {
  GeneralError,
} = require("../../helper/data_processors/error_processor");
const styles = require("../../helper/various/indicators");

const socketOpts = {
  ca: [config.tlsOptions.ca],
  cert: config.tlsOptions.cert,
  key: config.tlsOptions.key,
  rejectUnauthorized: true,
};

const defaultExchange = { name: "IBC-EXCHANGE", type: "topic" };

let instance;
class MessageBroker {
  constructor() {
    this.queues = {};
    this.channels = {};
  }

  async init() {
    this.connection = await amqp.connect(
      {
        protocol: "amqps",
        hostname:
          process.env.RABBITMQ_URL || rabbitmqOptions.hostname || "rabbitmq",
        port: 5671,
        username: rabbitmqOptions.user,
        password: rabbitmqOptions.password,
        locale: "en_US",
        vhost: rabbitmqOptions.vhost,
      },
      socketOpts
    );

    return this;
  }

  /**
   *
   * getQueueInfoCallback accepts a `queue` name that corresponds to an existing queue
   * It returns a callback fn that when called it returns the current length of the `queue`
   * @param {string} queue
   */
  async getQueueInfoCallback(queue, isDurable = false) {
    const tempChannel = await this.connection.createChannel();
    tempChannel.assertQueue(queue, { durable: isDurable });
    return async () => await tempChannel.checkQueue(queue);
  }

  setChannelPrefetchNr(channelName) {
    channelName = channelName.toUpperCase();

    const definedChannel = this.channels[channelName];
    return async (prefetchNr) => {
      await definedChannel.prefetch(prefetchNr, true);
    };
  }

  async createChannel(channelName) {
    channelName = channelName.toUpperCase();

    console.log(
      styles.MAGENTA,
      `Creating a Queue Channel - Channel name: ${channelName.toUpperCase()}`
    );

    await this.#createChannel(channelName);

    console.log(
      styles.GREEN,
      `Created a Queue Channel - Channel name: ${channelName.toUpperCase()}`
    );
  }

  async sendToDomainQueue(channelName, routingKey, queue, msg) {
    if (!this.connection) await this.init();
    channelName = channelName.toUpperCase();
    const definedChannel = this.#getChannel(channelName);
    routingKey = this.#constructRoutingKey(routingKey);
    definedChannel.assertExchange(defaultExchange.name, defaultExchange.type, {
      durable: true,
    });

    await definedChannel.publish(
      defaultExchange.name,
      routingKey,
      Buffer.from(JSON.stringify(msg))
    );
  }

  async subscribeToTopic(
    queue,
    handler,
    channelName,
    routingKey = undefined,
    prefetchCount = 100
  ) {
    if (!channelName) throw new GeneralError("Wrong channel");
    channelName = channelName.toUpperCase();

    const definedChannel = this.#getChannel(channelName);

    if (!Object.keys(this.channels).includes(channelName))
      this.channels[channelName] = definedChannel;

    if (!this.connection) await this.init();

    if (this.queues[queue]) {
      const existingHandler = _.find(this.queues[queue], (h) => h === handler);
      if (existingHandler) {
        return () => this.unsubscribe(queue, existingHandler);
      }
      this.queues[queue].push(handler);
      return () => this.unsubscribe(queue, handler);
    }

    definedChannel.assertExchange(defaultExchange.name, defaultExchange.type, {
      durable: true,
    });

    await definedChannel.assertQueue(queue, { durable: true });
    this.queues[queue] = [handler];

    await definedChannel.prefetch(prefetchCount, true);

    definedChannel.bindQueue(queue, defaultExchange.name, routingKey);

    definedChannel.consume(queue, async (msg) => {
      const ack = _.once(() => definedChannel.ack(msg));
      this.queues[queue].forEach((h) => h(msg, ack));
    });
    return () => this.unsubscribe(queue, handler);
  }

  async unsubscribe(queue, handler) {
    _.pull(this.queues[queue], handler);
  }

  // Private Section

  async #createChannel(channelName) {
    channelName = channelName.toUpperCase();
    this.channels[channelName] = await this.connection.createChannel();

    this.channels[channelName].assertExchange(
      defaultExchange.name,
      defaultExchange.type,
      {
        durable: true,
      }
    );
  }

  #getChannel(channelName) {
    channelName = channelName.toUpperCase();
    return this.channels[channelName];
  }

  #constructRoutingKey(channelInfo) {
    return Object.values(channelInfo)
      .filter((v) => v)
      .join(".");
  }
}

MessageBroker.getInstance = async function () {
  if (!instance) {
    const broker = new MessageBroker();
    instance = await broker.init();
  }
  return instance;
};

module.exports = MessageBroker;
