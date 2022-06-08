"use strict";
const grpc = require("@grpc/grpc-js");
const { signers } = require("@hyperledger/fabric-gateway");
const crypto = require("crypto");
const {
  UnauthorizedRequest,
} = require("../../helper/data_processors/error_processor");
const {
  jsonParser,
} = require("../../helper/data_processors/various_processors");

async function newGrpcConnection(peerName, orgCCP) {
  let peerInfo = orgCCP.peers[peerName];

  if (!orgCCP.peers[peerName]) {
    const foundPeerDomainName = Object.keys(orgCCP.peers).filter((key) =>
      key.startsWith(peerName)
    );

    peerInfo = orgCCP.peers[foundPeerDomainName];
  }

  const peerEndpoint = peerInfo.endpoint;
  const tlsRootCert = peerInfo.tlsCACerts.pem;
  const tlsRootCertAsBuf = Buffer.from(tlsRootCert);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCertAsBuf);

  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override":
      peerInfo.grpcOptions["ssl-target-name-override"],
  });
}

function newIdentity(certificate, mspId) {
  const credentials = Buffer.from(certificate);
  return { mspId, credentials };
}

function newSigner(privateKeyPem) {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

function chaincodeResponseResolver(data) {
  const chaincodeResp = jsonParser(data);
  if (chaincodeResp.status !== 200) {
    if (chaincodeResp.message && chaincodeResp.message.type === "Buffer") {
      // We always return a `Buffer` response from the BC, but we check just in case
      const buffer = Buffer.from(chaincodeResp.message.data, "base64");
      const errorResponse = jsonParser(buffer.toString("utf8"));
      throw new GeneralError(`${errorResponse} (Blockchain error)`);
    }

    const { message, status } = chaincodeResp;

    throw new UnauthorizedRequest(
      `${
        message
          ? `Message: ${message}`
          : status
          ? `Code: ${status}`
          : "Unknown Error"
      } (Blockchain error)`
    );
  }
  const buffer = Buffer.from(chaincodeResp.payload, "base64");
  const response = jsonParser(buffer.toString("utf8"));
  return response;
}

function decodeText(data) {
  return new TextDecoder().decode(data);
}

module.exports = {
  newGrpcConnection: newGrpcConnection,
  newIdentity: newIdentity,
  newSigner: newSigner,
  chaincodeResponseResolver: chaincodeResponseResolver,
  decodeText: decodeText,
};
