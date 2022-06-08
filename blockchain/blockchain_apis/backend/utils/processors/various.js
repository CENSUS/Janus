const config = require("../../config/main_config");

exports.backend_to_frontend_response_creator = (data, isAccepted = true) => ({
  isAccepted,
  data,
});

exports.countZerosOfDecimal = (number) => -Math.floor(Math.log10(number) + 1);

exports.toBase64 = (string) => {
  if (Buffer.from(string, "base64").toString("base64") !== string) {
    return Buffer.from(string).toString("base64");
  }
  return string;
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
  const probableNoise = url.startsWith(config.baseUrl);
  if (probableNoise) {
    // The Regex checks if there is a version defined in the URL (e.g. `/api/v1`)
    if (url.match(/\/(v\d+)\//)) {
      // Remove the api noise (e.g. `/api/v1`) and return the remaining URL (e.g. `/user/sync`)
      return url.replace(/([^\/]*\/){3}/, "/");
    }
  }
  return url;
};

exports.recoverActiveCertificates = (object) => {
  let certificates = [];

  Object.keys(object).map((organization) => {
    certificates = [
      ...certificates,
      ...Object.values(object[organization])
        .filter((user) => user.isActive)
        .map((user) => user.certificate),
    ];
  });

  return certificates;
};

exports.certificatesToBase64 = (certificates = []) => {
  let bufferedCerts = [];
  certificates.forEach((certificate) => {
    bufferedCerts.push(Buffer.from(certificate).toString("base64"));
  });
  return bufferedCerts;
};

exports.arrayToUINT8Array = (_array) => {
  if (!(_array instanceof Object.getPrototypeOf(Uint8Array))) {
    return new Uint8Array(_array);
  }
  return _array;
};

exports.prepareEndorsedProposalForClient = (endorsedProposal) => {
  const { transactionBytes, transactionDigest } = endorsedProposal;

  return {
    endorsedProposal: {
      transactionBytes: Array.from(transactionBytes),
      transactionDigest: transactionDigest.toString("base64"),
    },
  };
};

exports.peerNameNormalizer = (peer) => peer.replace(/-/g, "_");

exports.getOrgConfig = (peer) =>
  JSON.parse(Buffer.from(process.env[`${peer}_fabric_config`] || "{}"));

exports.prepareCommitedTransactionForClient = (commitedResponse) =>
  Array.from(commitedResponse);
