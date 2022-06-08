import fs from "fs";
import { PrivateKey } from "@fidm/x509";

export const deriveCertFromIdentity = (identity) => {
  let certificate;
  if (identity.credentials.certificate) {
    certificate = identity.credentials.certificate;
  } else {
    certificate = identity;
  }
  return certificate.replace(/\\n/g, "\n");
};

export const derivePKFromIdentity = (identity) => {
  let privKey;
  if (identity.credentials.privateKey) {
    privKey = identity.credentials.privateKey;
  } else {
    privKey = identity;
  }
  return privKey.replace(/\\n/g, "\n");
};

export const signData = (data, privKeyPem) => {
  const privateKey = PrivateKey.fromPEM(privKeyPem);
  data = Buffer.from(data);
  return privateKey.sign(data, "sha256");
};

export const constructSignedIdentities = (
  masterIdentity,
  combinedIdentities
) => {
  const identities = { master: {}, combined: [] };

  const [mainIdentityCertificate, mainIdentityPrivKey] = [
    deriveCertFromIdentity(masterIdentity),
    derivePKFromIdentity(masterIdentity),
  ];

  const usedIdentities = [
    mainIdentityCertificate,
    ...combinedIdentities.map((identity) => identity.certificate),
  ];

  const masterSignedSignature = signData(usedIdentities, mainIdentityPrivKey);

  identities["master"] = {
    certificate: mainIdentityCertificate,
    signature: Array.from(masterSignedSignature),
  };

  combinedIdentities.forEach((combIdentity) => {
    const combinedIdentitySignature = signData(
      masterSignedSignature,
      combIdentity.privateKey
    );

    identities["combined"].push({
      certificate: combIdentity.certificate,
      signature: Array.from(combinedIdentitySignature),
    });
  });

  return identities;
};

export const constructBackendHeaders = (backendToken) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${backendToken}`,
});

export const constructBackendBCPayload = (
  willAccessBC,
  willCommit = false
) => ({
  willAccessBC,
  willCommit,
});

export const constructBackendServiceHeaders = (serviceToken) => ({
  ServiceAuthorization: `Bearer ${serviceToken}`,
});

export const combineBackendHeaders = (backendHeaders, serviceHeaders) => ({
  ...backendHeaders,
  ...serviceHeaders,
});

export const arrayToUINT8Array = (_array) => {
  if (!(_array instanceof Object.getPrototypeOf(Uint8Array))) {
    return new Uint8Array(_array);
  }
  return _array;
};

export const promiseHandler = (promise) => {
  return promise
    .then((data) => [data, undefined])
    .catch((error) => Promise.resolve([undefined, error]));
};

export const normalizeCCResponseFromBackend = (modifiedResponse) =>
  arrayToUINT8Array(modifiedResponse);

export const decodeText = (data) => new TextDecoder().decode(data);

export const chaincodeResponseResolver = (data) => {
  const chaincodeResp = jsonParser(data);
  if (chaincodeResp.status !== 200) {
    if (chaincodeResp.message.type === "Buffer") {
      // We always return a `Buffer` payload from the BC, but we check just in case
      const buffer = Buffer.from(chaincodeResp.message.data, "base64");
      const errorResponse = jsonParser(buffer.toString("utf8"));
      throw new GeneralError(`${errorResponse} (Blockchain error)`);
    }
    throw new UnauthorizedRequest(
      `${chaincodeResp.message} (Blockchain error)`
    );
  }
  const buffer = Buffer.from(chaincodeResp.payload, "base64");
  const response = jsonParser(buffer.toString("utf8"));
  return response;
};

export const jsonParser = (str) => {
  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (err) {
    return str;
  }
};

export const readFile = (path) => {
  try {
    const file = fs.readFileSync(path, "utf-8");
    return jsonParser(file);
  } catch (err) {
    throw err;
  }
};

export const matchStrings = (str, compStr, caseSensitive = false) => {
  return str.localeCompare(compStr, undefined, {
    sensitivity: caseSensitive ? "case" : "base",
  }) === 0
    ? true
    : false;
};

export const logMsg = (msg, extra) =>
  extra ? console.log(msg, extra) : console.log(msg);
