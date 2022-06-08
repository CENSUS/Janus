"use strict";

const KNOWN_FILE_TYPES = {
    ACL: "indexACL",
    CERTIFICATE: "indexCert",
    CRL: "indexCRL",
};

const KNOWN_ELECTION_TYPES = Object.freeze({
    add_ca: "add_ca",
    remove_ca: "remove_ca",
});

module.exports = Object.freeze({
    indexCert: KNOWN_FILE_TYPES.CERTIFICATE,
    indexCRL: KNOWN_FILE_TYPES.CRL,
    indexACL: KNOWN_FILE_TYPES.ACL,
    proxyStakeholders: "PROXY",
    medicalDomainStakeholders: "MEDICAL",
    manufacturerDomainStakeholders: "MANUFACTURER",
    add_ca: KNOWN_ELECTION_TYPES.add_ca,
    remove_ca: KNOWN_ELECTION_TYPES.remove_ca,
    KNOWN_FILE_TYPES: KNOWN_FILE_TYPES,
});
