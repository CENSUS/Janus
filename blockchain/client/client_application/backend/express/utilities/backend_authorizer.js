const { acquireBackendToken } = require("../apis/apiAccessor");
const {
  deriveCertFromIdentity,
  derivePKFromIdentity,
} = require("../helper/data_processors/client_processor");
const { signData } = require("../helper/data_processors/crypto");

class BackendAuthorizer {
  constructor() {
    this.token = null; // A JWT token
  }

  async acquireToken(identity) {
    // Fetch the base certificate and private key

    const certificate = deriveCertFromIdentity(identity);
    const privKey = derivePKFromIdentity(identity);

    // Create a signature from: the certificate, signed by: the private key
    const signature = signData(certificate, privKey).toString("base64");

    // Create the payload for the Backend API
    const payload = {
      certificate,
      signature,
    };

    return await acquireBackendToken(payload);
  }
}

module.exports = new BackendAuthorizer();
