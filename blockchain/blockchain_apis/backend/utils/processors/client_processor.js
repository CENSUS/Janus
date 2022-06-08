"use strict";
const { Certificate } = require("@fidm/x509");
const {
  GeneralError,
  UnauthorizedRequest,
} = require("./../../middlewares/utils/error_types.js");
const loginProcessor = require("./api_processor/login_processor");
const {
  promiseHandler,
  jsonParser,
  matchStrings,
  arrayToUINT8Array,
} = require("./various.js");

exports.constructCertificate = (certAsString) =>
  Certificate.fromPEM(certAsString);

// It iterates over the extraCreds array ([{username: username, password: password, organization: organization}, ...]), enrolls a user with the appropriate CA and returns the Certificate of the found Identity with its corresponding GID.
exports.constructExtraCerts = async (extraCreds, rootGID) => {
  let certificates = [];

  for (const credentials of extraCreds) {
    const { username, password, organization } = credentials;

    const [extraCertificate, extraCertificateError] = await promiseHandler(
      this.deriveCertificateFromCA(username, password, organization)
    );
    if (extraCertificateError) {
      throw new UnauthorizedRequest(extraCertificateError);
    }
    const constructedExtraCertificate =
      this.constructCertificate(extraCertificate); // The constructed PEM certificate
    // Extract the identity's GID from the certificate
    const { GID } = this.deriveEssentialAttrsFromCert(
      constructedExtraCertificate,
      ["GID"]
    );

    if (!GID) {
      throw new UnauthorizedRequest(
        `The certificate of user ${username} is not applicable for this Blockchain request - A GID is missing`
      );
    }

    if (GID !== rootGID) {
      throw new UnauthorizedRequest(
        `The certificate for organization ${organization} does not belong to the GID: ${GID}`
      );
    }
    certificates.push(Buffer.from(extraCertificate).toString("base64"));
  }
  return certificates;
};

exports.deriveBasicAttributesFromCert = (constructedCert) => {
  return {
    issuerCN: constructedCert.issuer.commonName,
    issuerOrganization: constructedCert.issuer.organizationName,
    subjectCN: constructedCert.subject.commonName,
    subjectOrganization: constructedCert.subject.organizationName,
    subjectOU: constructedCert.subject.organizationalUnitName,
  };
};

exports.deriveEssentialAttrsFromCert = (constructedCert, neededAttrs = []) => {
  const extension = constructedCert.extensions.find(
    (ext) => ext.oid === "1.2.3.4.5.6.7.8.1"
  );
  const foundAttrs = {};
  if (extension) {
    const str = extension.value.toString();
    const obj = JSON.parse(str);
    for (const attr in obj.attrs) {
      for (const neededAttr of neededAttrs) {
        if (
          matchStrings(attr, neededAttr) ||
          matchStrings(obj.attrs[attr], neededAttr)
        ) {
          // It checks both the name and the value of an attribute - GID is always a `name`, AUDITOR is always a `value` ({'name': 'role', 'value': 'AUDITOR'...})
          foundAttrs[neededAttr] = obj.attrs[attr];
          break;
        }
      }
      if (Object.keys(foundAttrs).length === neededAttrs.length) break;
    }
  }
  return foundAttrs;
};

exports.deriveCertFromIdentity = (identity) => {
  let certificate;
  if (identity.credentials.certificate) {
    certificate = identity.credentials.certificate;
  } else {
    certificate = identity;
  }
  return certificate.replace(/\\n/g, "\n");
};

exports.communicateWithBlockchain = async (ticket, payload, network) => {
  const [transactionRes, transactionResErr] = await promiseHandler(
    network.transactWithDefaultGateway(ticket, payload)
  );

  if (transactionResErr) throw new GeneralError(transactionResErr.message);

  const CCResponse = transactionRes;

  let resolvedResponse = this.chaincodeResponseResolver(CCResponse); // It may be better to let the user do this (for computational purposes)

  return resolvedResponse;
};

exports.deriveCertificateFromCA = async (username, password, organization) => {
  const [identity, identityError] = await promiseHandler(
    loginProcessor.caCertificateRetriever(username, password, organization)
  ); // Enrolls with the CA and returns the Identity object
  if (identityError) {
    throw new GeneralError(identityError);
  }
  return this.deriveCertFromIdentity(identity); // The certificate as `string`
};

exports.constructBlockchainPayload = (functionParams, args) => {
  return {
    functionParams,
    args,
  };
};

exports.prepareCCResponseForClient = (response) => Array.from(response);

exports.chaincodeResponseResolver = (data) => {
  const chaincodeResp = jsonParser(data);
  if (chaincodeResp.status !== 200) {
    if (chaincodeResp.message.type === "Buffer") {
      // We always return a `Buffer` payload from the BC, but we check just in case
      const buffer = Buffer.from(chaincodeResp.message.data, "base64");
      const errorResponse = jsonParser(buffer.toString("utf8"));
      throw new GeneralError(`${errorResponse} (Blockchain error)`);
    }
    throw new GeneralError(`${chaincodeResp.message} (Blockchain error)`);
  }
  const buffer = Buffer.from(chaincodeResp.payload, "base64");
  const response = jsonParser(buffer.toString("utf8"));
  return response;
};

exports.decodeText = (data) => new TextDecoder().decode(data);

exports.normalizeCCResponse = (modifiedResponse) =>
  arrayToUINT8Array(modifiedResponse);
