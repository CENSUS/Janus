const path = require("path");
const INFRASTRUCTURE_ENDPOINT = `${process.env.INFRASTRUCTURE_ENDPOINT}`;

module.exports = Object.freeze({
  baseUrl: "",
  serverPort: 3001,
  backendTLSOptions: {
    ca: process.env.APP_DEV
      ? path.join(__dirname, "./../etc/ssl/ca.crt")
      : path.join(process.resourcesPath, "/app.asar/etc/ssl/ca.crt"),
    cert: process.env.APP_DEV
      ? path.join(__dirname, "./../etc/ssl/backend_tls.crt")
      : path.join(process.resourcesPath, "/app.asar/etc/ssl/backend_tls.crt"),
  },
  ENDPOINTS: {
    ACQUIRE_TOKEN_ENDPOINT: `https://api.${INFRASTRUCTURE_ENDPOINT}/v1/auth/acquire-app-token`,
    ACQUIRE_BLOCKCHAIN_TICKET_ENDPOINT: `https://api.${INFRASTRUCTURE_ENDPOINT}/v1/blockchain/acquire-ticket`,
    COMMUNICATE_WITH_BC_ENDPOINT: `https://api.${INFRASTRUCTURE_ENDPOINT}/v1/blockchain/communicate-with-bc`,
    ACQUIRE_CA_CONNECTION_PROFILES: `https://api.${INFRASTRUCTURE_ENDPOINT}/v1/ca-connection-profiles`,
  },
});
