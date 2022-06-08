import grpc from "@grpc/grpc-js";
import { signers } from "@hyperledger/fabric-gateway";
import crypto from "crypto";
import {
  deriveCertFromIdentity,
  derivePKFromIdentity,
} from "../../utilities/various.js";

export const newGrpcConnection = async (peerName, orgCCP) => {
  const peerInfo = orgCCP.peers[peerName];
  const peerEndpoint = peerInfo.endpoint;
  const tlsRootCert = peerInfo.tlsCACerts.pem;
  const tlsRootCertAsBuf = Buffer.from(tlsRootCert);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCertAsBuf);

  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override":
      peerInfo.grpcOptions["ssl-target-name-override"],
  });
};

export const newIdentity = (identity) => {
  const certificate = deriveCertFromIdentity(identity);
  const mspId = identity.mspId;
  const credentials = Buffer.from(certificate);
  return { mspId, credentials };
};

export const newSigner = (identity) => {
  const privateKeyPem = derivePKFromIdentity(identity);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
};
