const fs = require("fs");

const RABBIT_MQ_CREDS = JSON.parse(
  fs.readFileSync("/rabbitmq-settings/rabbitmq_settings.json", "utf8")
)["rabbitmq_settings"];

module.exports = Object.freeze({
  metrics: { metricsOn: true, cliLog: false, pageLog: true }, // on = true, off = false
  baseUrl: "/",
  serverPort: 4220,
  tlsOptions: {
    ca: fs.readFileSync("/application/etc/ssl/ca.crt"),
    cert: fs.readFileSync("/application/etc/ssl/tls.crt"),
    key: fs.readFileSync("/application/etc/ssl/tls.key"),
  },
  executablesExecs: {
    linux: { fileName: "moh-client.AppImage" },
    windows: { fileName: "moh-client.exe" },
    mac: { fileName: "" },
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
  jwtPass: require("crypto").randomBytes(256).toString("base64"),
  ACCEPTABLE_DATA_IDS: process.env.ACCEPTABLE_DATA_IDS,
});
