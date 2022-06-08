const fs = require("fs");
const { jsonParser } = require("./../../utils/processors/various.js");

function getQueueInfo(queueName) {
  return jsonParser(fs.readFileSync("/rabbitmq/proxy-config.json"))[queueName];
}

module.exports = getQueueInfo;
