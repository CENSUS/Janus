const fs = require("fs");
const { jsonParser } = require("../data_processors/various_processors");

function getQueueInfo(configName) {
  switch (configName) {
    case "PROXY": {
      return (queueName = undefined) => {
        const config = jsonParser(
          fs.readFileSync("/rabbitmq/proxy-config.json", "utf-8")
        );
        return queueName ? config[queueName] : config;
      };
    }
    case "INTERBC": {
      return (queueName = undefined) => {
        const config = jsonParser(
          fs.readFileSync("/rabbitmq/interbc-config.json", "utf-8")
        );
        return queueName ? config[queueName] : config;
      };
    }
    default:
      return;
  }
}

module.exports = {
  getProxyBCQueueConfig: getQueueInfo("PROXY"),
  getInterBCQueueConfig: getQueueInfo("INTERBC"),
};
