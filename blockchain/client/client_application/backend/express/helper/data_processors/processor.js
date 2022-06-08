"use strict";
const { Wallets } = require("fabric-network");
const config = require("../../config");

// exports.backend_to_frontend_response_creator = (data, isAccepted = true) => {
//     jsonifiedResponse = {
//         isAccepted: isAccepted,
//         data: data,
//     };
//     return jsonifiedResponse;
// };

exports.toBase64 = (string) => {
  if (Buffer.from(string, "base64").toString("base64") !== string) {
    return Buffer.from(string).toString("base64");
  }
  return string;
};

exports.importIdentityToMemWallet = async (userID, identity) => {
  const wallet = await Wallets.newInMemoryWallet();
  wallet.put(userID, identity);
  return wallet;
};

exports.buildCAAuthenticatorObject = async (identity) => {
  const wallet = await Wallets.newInMemoryWallet();
  const provider = wallet.getProviderRegistry().getProvider(identity.type);
  return await provider.getUserContext(identity);
};

exports.matchStrings = (str, compStr, caseSensitive = false) => {
  return str.localeCompare(compStr, undefined, {
    sensitivity: caseSensitive ? "case" : "base",
  }) === 0
    ? true
    : false;
};

exports.promiseHandler = (promise) => {
  return promise
    .then((data) => [data, undefined])
    .catch((error) => Promise.resolve([undefined, error]));
};

exports.jsonParser = (str) => {
  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (err) {
    return str;
  }
};

exports.clearUrlFromAPINoise = (url) => {
  const probableNoise =
    url.startsWith(config.baseUrl) || url.match(/\/(v\d+)\//);

  if (probableNoise) {
    // The Regex checks if there is a version defined in the URL (e.g. `/api/v1` or '/v1)
    if (url.match(/\/(v\d+)\//)) {
      // Remove the api noise (e.g. `/api/v1`) and return the remaining URL (e.g. `/user/sync`)
      return url.match(/\/(v\d+)\//)
        ? url.replace(/([^\/]*\/){2}/, "/")
        : url.replace(/([^\/]*\/){3}/, "/");
    }
  }
  return url;
};

exports.recoverActiveIdentities = (object) => {
  let identities = [];

  Object.keys(object).forEach((organization) => {
    identities = [
      ...identities,
      ...Object.values(object[organization])
        .filter((user) => user.isActive)
        .map((user) => user.combinedIdentity),
    ];
  });

  return identities;
};

exports.certificatesToBase64 = (certificates = []) => {
  let bufferedCerts = [];
  certificates.forEach((certificate) => {
    bufferedCerts.push(Buffer.from(certificate).toString("base64"));
  });
  return bufferedCerts;
};

exports.constructBackendHeaders = (backendToken) => ({
  "Content-Type": "application/json",
  Authorization: backendToken,
});

exports.constructBackendServiceHeaders = (serviceToken) => ({
  ServiceAuthorization: `Bearer ${serviceToken}`,
});

exports.combineBackendHeaders = (backendHeaders, serviceHeaders) => ({
  ...backendHeaders,
  ...serviceHeaders,
});

exports.constructBackendBCPayload = (willAccessBC, willCommit = false) => ({
  willAccessBC,
  willCommit,
});

exports.arrayToUINT8Array = (_array) => {
  if (!(_array instanceof Object.getPrototypeOf(Uint8Array))) {
    return new Uint8Array(_array);
  }
  return _array;
};
