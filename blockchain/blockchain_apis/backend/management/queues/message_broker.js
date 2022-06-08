const amqp = require("amqplib");
const _ = require("lodash");
const { rabbitmqOptions, tlsOptions } = require("../../config/main_config.js");

const socketOpts = {
  ca: [tlsOptions.ca],
  cert: tlsOptions.cert,
  key: tlsOptions.key,
  rejectUnauthorized: true,
};

let instance;
class MessageBroker {
  constructor() {
    this.queues = {};
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
    this.ticketsChannel = await this.connection.createChannel();
    return this;
  }

  async sendTicket(queue, msg) {
    if (!this.connection) await this.init();
    this.ticketsChannel.sendToQueue(queue, Buffer.from(msg));
  }

  async subscribeTicketsChannel(queue, handler, prefetchCount = undefined) {
    if (!this.connection) {
      await this.init();
    }

    if (this.queues[queue]) {
      const existingHandler = _.find(this.queues[queue], (h) => h === handler);
      if (existingHandler) {
        return () => this.unsubscribe(queue, existingHandler);
      }
      this.queues[queue].push(handler);
      return () => this.unsubscribe(queue, handler);
    }

    await this.ticketsChannel.assertQueue(queue, { durable: false });
    this.queues[queue] = [handler];

    await this.ticketsChannel.prefetch(prefetchCount || 0, true);

    this.ticketsChannel.consume(queue, async (msg) => {
      const ack = _.once(() => this.ticketsChannel.ack(msg));
      this.queues[queue].forEach((h) => h(msg, ack));
    });
    return () => this.unsubscribe(queue, handler);
  }

  async unsubscribe(queue, handler) {
    _.pull(this.queues[queue], handler);
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
