const fs = require("fs");

const RABBIT_MQ_CREDS = JSON.parse(
  fs.readFileSync("/rabbitmq-settings/rabbitmq_settings.json", "utf8")
)["rabbitmq_settings"];

module.exports = Object.freeze({
  tlsOptions: {
    ca: fs.readFileSync("/application/etc/ssl/ca.crt"),
    cert: fs.readFileSync("/application/etc/ssl/tls.crt"),
    key: fs.readFileSync("/application/etc/ssl/tls.key"),
  },
  rabbitmqOptions: {
    user: RABBIT_MQ_CREDS["username"],
    password: RABBIT_MQ_CREDS["password"],
    hostname: "rabbitmq",
    vhost: "/block",
  },
  PEERS: JSON.parse(
    fs.readFileSync("/fabric/application/peers/peers.json", "utf-8")
  ),
  supervisorStateTypes: {
    NORMAL: { name: "NORMAL", checkInterval: 5 * 1000, throttleMul: 1 },
    LOW: { name: "LOW", checkInterval: 4 * 1000, throttleMul: 0.7 },
    MEDIUM: { name: "MEDIUM", checkInterval: 3 * 1000, throttleMul: 0.4 },
    HIGH: { name: "HIGH", checkInterval: 2 * 1000, throttleMul: 0.1 },
    EXTREME: { name: "EXTREME", checkInterval: 1000, throttleMul: 0.01 },
  },
});
