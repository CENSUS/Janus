"use strict";
const { Certificate } = require("@fidm/x509");
const asn1 = require("asn1js");
const pkijs = require("pkijs");
const pvutils = require("pvutils");

const {
    matchStrings,
    response,
    timestampToMilliseconds,
    checkIfBASE64Encoded,
} = require("./utils");

const constants = require("./constants");
const Stakeholder = require("../types/stakeholders/stakeholder");

const constructCert = (certificate) => {
    if (typeof certificate !== "string")
        throw new Error("Expected PEM Certificate as string");

    if (!checkIfBASE64Encoded(certificate))
        certificate = Buffer.from(certificate, "utf-8").toString("base64");

    certificate = Buffer.from(certificate, "base64").toString("utf-8");
    return Certificate.fromPEM(certificate);
};

const constructCRL = (crl) => {
    if (typeof crl !== "string") {
        throw new Error("Expected PEM CRL as string");
    }

    const crlBuf = Buffer.from(crl, "base64").toString("utf-8");
    const crlPem = crlBuf.replace(/(-----(BEGIN|END) X509 CRL-----|\n)/g, "");

    const raw = Buffer.from(crlPem, "base64").toString("binary");

    const buf = new ArrayBuffer(raw.length);
    const bufView = new Uint8Array(buf);

    for (let i = 0, strLen = raw.length; i < strLen; i++) {
        bufView[i] = raw.charCodeAt(i);
    }

    const buffer = new Uint8Array(buf).buffer;
    const asn1crl = asn1.fromBER(buffer);

    const constructedCRL = new pkijs.CertificateRevocationList({
        schema: asn1crl.result,
    });

    return constructedCRL;
};

const checkCARevoked = async (ctx, caName) => {
    const TrustFile = require("../types/trust_anchors/trustFile");

    // const stakeholders = JSON.parse(await ctx.stub.getState(proxyStakeholders));
    // let domain;

    // try {
    //     ({ domain } = stakeholders[caName.toUpperCase()]);
    // } catch (err) {
    //     return response(
    //         false,
    //         `Unknown Organization ${caName}`
    //     );
    // }

    const stakeholderKey = Stakeholder.makeKey([constants.proxyStakeholders]);
    const stakeholdersInstance = await ctx.stakeholderManager.get(
        stakeholderKey
    );
    const stakeholders = stakeholdersInstance.getStakeholders();

    const stakeholderDoesNotExist = Object.values(stakeholders).every(
        (stakeholder) => !matchStrings(caName, stakeholder.name)
    );

    if (stakeholderDoesNotExist)
        return response(true, "The Organization does not exist");

    const stakeholder = await stakeholdersInstance.getStakeholderByName(
        ctx,
        caName
    );

    if (stakeholder.isRevoked)
        return response(true, "The Organization is revoked");

    // const caCertKey = TrustFile.makeKey([
    //     constants.indexCert,
    //     caName.toLowerCase(),
    // ]);
    // const caCertInstance = await ctx.trustFileManager.getHistory(caCertKey);

    //Checks if the last (appended) CA Cert/CRL/ACL matches the revoked ones
    // const revokedCACompKey = ctx.stub.createCompositeKey(revokedCAs, [
    //     domain,
    //     caName,
    // ]);
    // const revokedCA = await ctx.stub.getState(revokedCACompKey);

    // if (revokedCA.length === 0)
    //     //Not revoked certs for this CA - We can return
    //     return response(false, "No revoked CA documents");

    // const latestRevokedRecords = JSON.parse(revokedCA.toString());
    // const revokedCert = latestRevokedRecords.certificate;
    // const revokedCRL = latestRevokedRecords.crl;
    // const revokedTempACL = latestRevokedRecords.tempACL;

    // const caCertCompKey = ctx.stub.createCompositeKey(indexCert, [caName]);
    // const lastAppendedCACert = JSON.parse(
    //     await ctx.stub.getState(caCertCompKey)
    // );

    // const caCRLCompKey = ctx.stub.createCompositeKey(indexCRL, [caName]);
    // const lastAppendedCRL = JSON.parse(await ctx.stub.getState(caCRLCompKey));

    // const caTempACLKey = ctx.stub.createCompositeKey(indexACL, [caName]);
    // const lastAppendedACL = JSON.parse(await ctx.stub.getState(caTempACLKey));

    // if (
    //     revokedCert === lastAppendedCACert ||
    //     revokedCRL === lastAppendedCRL ||
    //     revokedTempACL === lastAppendedACL
    // )
    //     return response(true, "The CA is revoked");

    return response(false, "The CA is not revoked");
};

const checkClientCertificate = async (ctx, constructedCert) => {
    const TrustFile = require("../types/trust_anchors/trustFile");

    const currentTime = timestampToMilliseconds(ctx.stub.getTxTimestamp());

    if (constructedCert.validTo.getTime() < currentTime)
        return response(false, "The certificate has expired");

    const clientOrg = constructedCert.issuer.organizationName.toLowerCase();

    // Get every indexCert record of the stakeholder
    const rootCACertInstanceHistory = await ctx.trustFileManager.getHistory([
        constants.indexCert,
        clientOrg,
    ]);

    if (rootCACertInstanceHistory) {
        const foundData = await Promise.all(
            rootCACertInstanceHistory.map(async (historyInstance) => {
                const certInstance = historyInstance.Value;
                const timestamp = historyInstance.Timestamp;

                const { data: caCertData, isRevoked } = certInstance;

                const constructedCACert = constructCert(caCertData);

                if (
                    matchStrings(
                        constructedCert.authorityKeyIdentifier,
                        constructedCACert.subjectKeyIdentifier,
                        true
                    )
                ) {
                    if (isRevoked)
                        return response(false, {
                            timestamp,
                            reason: `Your organization is revoked [ORGANIZATION: ${constructedCert.issuer.organizationName.toUpperCase()}]`,
                        });

                    const CRLDocKey = TrustFile.makeKey([
                        constants.indexCRL,
                        constructedCert.issuer.organizationName.toLowerCase(),
                    ]);
                    const CRLDocInstance = await ctx.trustFileManager.get(
                        CRLDocKey
                    );
                    const CRLDoc = CRLDocInstance.data;

                    const isCACertRevoked = checkCertRevokedByCRL(
                        CRLDoc,
                        constructedCACert
                    );

                    if (!isCACertRevoked.condition)
                        return response(false, {
                            timestamp,
                            reason: "The root Certificate is revoked",
                        });

                    const isClientCertRevoked = checkCertRevokedByCRL(
                        CRLDoc,
                        constructedCert
                    );

                    if (!isClientCertRevoked.condition)
                        return response(false, {
                            timestamp,
                            reason: "The Client's Certificate is revoked",
                        });

                    const subjectKeyIdentifierMatch =
                        constructedCert.verifySubjectKeyIdentifier();

                    if (!subjectKeyIdentifierMatch)
                        return response(false, {
                            timestamp,
                            reason: "Error in Subject Key identifier",
                        });

                    if (
                        !(
                            constructedCACert.validFrom <=
                            constructedCert.validFrom
                        ) ||
                        !(constructedCert.validTo <= constructedCACert.validTo)
                    )
                        return response(false, {
                            timestamp,
                            reason: "The certificate has expired or is not active",
                        });

                    const signatureNotNull =
                        constructedCACert.checkSignature(constructedCert); // If `null`, then the signature is valid

                    if (signatureNotNull)
                        return response(false, {
                            timestamp,
                            reason: "The signature of the certificate is malformed",
                        });

                    return response(true, {
                        timestamp,
                        reason: "The certificate is valid",
                    });
                }
            })
        );

        const isCertActive = foundData
            .filter((response) => typeof response !== "undefined")
            .sort((a, b) => b.message.timestamp - a.message.timestamp)[0];

        return response(isCertActive.condition, isCertActive.message.reason);
    }

    return response(false, "The certificate is invalid");
};

const checkCACertificate = async (ctx, constructedCACert, isInit = false) => {
    const TrustFile = require("../types/trust_anchors/trustFile");

    const rootCACertKey = TrustFile.makeKey([
        constants.indexCert,
        constructedCACert.issuer.organizationName.toLowerCase(),
    ]);
    const rootCACertInstance = await ctx.trustFileManager.get(rootCACertKey);

    if (rootCACertInstance) {
        const { data: certificate } = rootCACertInstance;

        // Check if the latest Certificate of the stakeholder is revoked
        // If it is revoked => The organization can not renew their certificate
        if (rootCACertInstance.isRevoked)
            response(false, "The organization is revoked");

        const constructedRootCert = constructCert(certificate);

        const CRLDocKey = TrustFile.makeKey([
            constants.indexCRL,
            constructedCACert.issuer.organizationName.toLowerCase(),
        ]);
        const CRLDocInstance = await ctx.trustFileManager.get(CRLDocKey);
        const { data: CRLDoc } = CRLDocInstance;

        const rootSubjectKeyIdentifierMatch =
            constructedCACert.verifySubjectKeyIdentifier();

        if (
            rootSubjectKeyIdentifierMatch ||
            constructedCACert.validTo.getTime() > new Date().getTime()
        ) {
            const isCertRevoked = checkCertRevokedByCRL(
                CRLDoc,
                constructedCACert
            );

            if (!isCertRevoked.condition) {
                return response(false, "The certificate is revoked");
            }

            if (
                !(
                    constructedRootCert.validFrom <= constructedCACert.validFrom
                ) ||
                !(constructedCACert.validTo <= constructedRootCert.validTo)
            ) {
                return response(
                    false,
                    "The new certificate is older than the already existing certificate"
                );
            }

            // const isSignatureOk =
            //     constructedRootCert.checkSignature(constructedCACert); // If `null`, then the signature is valid

            // if (isSignatureOk)
            //     return response(
            //         false,
            //         "The signature of the certificate is malformed"
            //     );

            return response(true, "The certificate is valid");
        }
    }

    return isInit &&
        constructedCACert.isCA &&
        constructedCACert.isIssuer(constructedCACert)
        ? response(true, "The certificate is valid")
        : response(false, "The certificate is invalid");
};

const checkCertRevokedByCRL = (crlRecord, certificate) => {
    const constructedCRL = constructCRL(crlRecord);

    if (
        !constructedCRL.revokedCertificates ||
        constructedCRL.revokedCertificates === 0
    ) {
        return response(true, "The certificate is valid");
    }

    for (const { userCertificate } of constructedCRL.revokedCertificates) {
        let revokedCertSerialNumber = pvutils.bufferToHexCodes(
            userCertificate.valueBlock.valueHex
        );

        if (certificate.serialNumber === revokedCertSerialNumber) {
            return response(false, "The certificate is REVOKED");
        }
    }

    return response(true, "The certificate is VALID");
};

module.exports = {
    checkCARevoked: checkCARevoked,
    constructCert: constructCert,
    constructCRL: constructCRL,
    checkClientCertificate: checkClientCertificate,
    checkCACertificate: checkCACertificate,
    checkCertRevokedByCRL: checkCertRevokedByCRL,
};
