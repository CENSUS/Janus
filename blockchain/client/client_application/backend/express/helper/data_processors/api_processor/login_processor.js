const CertificateAuthority = require("./../../../utilities/bootstrap_ca");
const { enrollWithCA } = require("./../../../fabric_network/ca_communicator");
const { promiseHandler, matchStrings } = require("../processor");
const {
  GeneralError,
  UnauthorizedRequest,
  ForbiddenRequest,
} = require("../error_processor");

// It works like a login - It enrolls a user with the (organization's) CA and returns an Identity object ({credentials: {certificate: "", privateKey: ""}, mspId: "", type: "X.509"})
exports.caCertificateRetriever = async (
  username,
  password,
  organization,
  returnABuffer = false
) => {
  const [caInstance, caInstanceErr] = await promiseHandler(
    CertificateAuthority.getInstance(organization.toLowerCase())
  );

  if (caInstanceErr) throw new GeneralError(caInstanceErr);

  const [orgMspId, caClient] = [
    caInstance.getOrgMspId(),
    caInstance.getCAClient(),
  ];

  const [identity, identityError] = await promiseHandler(
    enrollWithCA(caClient, username, password, orgMspId)
  );

  if (identityError) throw new UnauthorizedRequest(identityError.message);

  if (returnABuffer)
    return Buffer.from(JSON.stringify(identity)).toString("base64");

  return identity;
};

// It accepts a CA's mandatory (for enrollment) information (username, password, organization)
// It outputs { isAdmin/ isAuditor / GID } (GID is derived from the enrollment's certificate)
exports.identityManagement = async (username, password, organization) => {
  const {
    deriveBasicAttributesFromCert,
    deriveEssentialAttrsFromCert,
    constructCertificate,
    deriveCertFromIdentity,
  } = require("./../client_processor");

  const [identity, identityErr] = await promiseHandler(
    this.caCertificateRetriever(username, password, organization)
  ); // Enrolls with the CA and returns the Identity object

  if (identityErr) throw new GeneralError(identityErr.message);

  const certificate = deriveCertFromIdentity(identity); // The certificate as `string`
  const constructedCertificate = constructCertificate(certificate); // The constructed PEM certificate

  // Extract `basic attributes` from the certificate
  const { subjectOU } = deriveBasicAttributesFromCert(constructedCertificate);

  // Extract the identity's GID from the Certificate - If the Certificate does not "carry" a GID attribute,
  // it can still be acceptable if and only if the OU of the Certificate is `admin`
  // or the entity is an AUDITOR

  let {
    GID,
    "CA-ADMIN": CA_ADMIN,
    AUDITOR,
  } = deriveEssentialAttrsFromCert(constructedCertificate, [
    "GID",
    "CA-ADMIN",
    "AUDITOR",
  ]); // Search for 'GID', 'CA-ADMIN', 'AUDITOR' attributes

  if (
    typeof GID === "undefined" &&
    typeof AUDITOR === "undefined" &&
    subjectOU !== "admin"
  )
    throw new UnauthorizedRequest("Invalid Identity");

  GID = typeof GID !== "undefined" ? GID.toUpperCase() : null;
  const isAdmin = subjectOU === "admin" && !CA_ADMIN ? true : false;
  const isCAAdmin = subjectOU === "admin" && CA_ADMIN ? true : false;
  const isAuditor = typeof AUDITOR !== "undefined" ? true : false;

  return {
    identity,
    isAdmin,
    isCAAdmin,
    isAuditor,
    GID,
  };
};

// Used to combine Identities
exports.extraIdentityManagement = async (
  username,
  password,
  organization,
  authenticatedGID
) => {
  const {
    deriveEssentialAttrsFromCert,
    constructCertificate,
    deriveCertFromIdentity,
    derivePKFromIdentity,
  } = require("./../client_processor");

  const identity = await this.caCertificateRetriever(
    username,
    password,
    organization
  ); // Enrolls with the CA and returns the Identity object

  const [certificate, privateKey] = [
    deriveCertFromIdentity(identity),
    derivePKFromIdentity(identity),
  ];

  const constructedCertificate = constructCertificate(certificate); // The constructed PEM certificate
  // Extract the identity's GID from the certificate - If the certificate does not "carry" a GID attribute, it can still be acceptable if and only if the OU of the certificate is `admin` or the entity is an auditor
  let { GID } = deriveEssentialAttrsFromCert(constructedCertificate, ["GID"]); // Search for 'GID' attributes
  if (!GID)
    throw new ForbiddenRequest("The identity does not own a GID attribute ");

  if (!matchStrings(authenticatedGID, GID))
    throw new ForbiddenRequest("Cannot combine, GIDs do not match!");

  return {
    GID: GID.toUpperCase(),
    certificate,
    privateKey,
  };
};
