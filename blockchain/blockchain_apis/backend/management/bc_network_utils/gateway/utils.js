"use strict";
const grpc = require("@grpc/grpc-js");
const { signers } = require("@hyperledger/fabric-gateway");
const crypto = require("crypto");

async function newGrpcConnection(peerName, orgCCP) {
  const peerInfo = orgCCP.peers[peerName];
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

module.exports = {
  newGrpcConnection: newGrpcConnection,
  newIdentity: newIdentity,
  newSigner: newSigner,
};
