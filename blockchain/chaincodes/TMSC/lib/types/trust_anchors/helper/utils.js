"use strict";

const { response } = require("../../../utils/utils");
const constants = require("../../../utils/constants");
const { constructCRL, checkCACertificate } = require("../../../utils/helper");
const Stakeholder = require("../../stakeholders/stakeholder");

const checkIfAppropriateACL = async (
    ctx,
    ACLObject,
    isNewCAAppend = false,
    isInit = false
) => {
    if (
        !ACLObject.ACL ||
        !ACLObject.ORGANIZATION ||
        Object.keys(ACLObject).length !== 2
    )
        return response(
            false,
            !ACLObject.ACL && !ACLObject.ORGANIZATION
                ? "The ACL's structure is not acceptable. The 'ACL', 'ORGANIZATION' key is missing"
                : !ACLObject.ACL
                ? "The ACL's structure is not acceptable. The 'ACL' key is missing"
                : !ACLObject.ORGANIZATION
                ? "The ACL's structure is not acceptable. The 'ORGANIZATION' key is missing"
                : "The ACL's structure is not acceptable"
        );

    const aclStakeholder = ACLObject.ORGANIZATION;

    const proxyStakeholdersKey = Stakeholder.makeKey([
        constants.proxyStakeholders,
    ]);
    const proxyStakeholdersInstance = await ctx.stakeholderManager.get(
        proxyStakeholdersKey
    );

    if (isInit)
        return response(
            true,
            `The ACL was accepted by the System [ORGANIZATION: ${aclStakeholder.toUpperCase()}]`
        );

    const foundStakeholder =
        await proxyStakeholdersInstance.getStakeholderByName(
            ctx,
            aclStakeholder
        );

    const isAppropriate =
        (!isNewCAAppend && foundStakeholder) ||
        (isNewCAAppend && !foundStakeholder) ||
        (isNewCAAppend && foundStakeholder && foundStakeholder.isRevoked);

    return response(
        isAppropriate,
        isAppropriate
            ? `The ACL was accepted by the System [ORGANIZATION: ${aclStakeholder.toUpperCase()}]`
            : `Stakeholder ${aclStakeholder} ${
                  isNewCAAppend && foundStakeholder
                      ? "already exists"
                      : "does not exist"
              } `
    );
};

const checkIfAppropriateCertificate = async (ctx, certificate, isInit) => {
    if (!certificate.isIssuer(certificate) || !certificate.isCA) {
        return response(
            false,
            `The Certificate with Serial Number ${certificate.serialNumber} is not appropriate`
        );
    }

    if (!isInit) {
        // const certificateExists = await checkCACertificateExistence(ctx, certificate);
        // if (certificateExists['condition']) {
        //     return response(
        //         false,
        //         `The Certificate with Serial Number ${certificate.serialNumber} already exists`
        //     );
        // } // Should be used in production!
    }

    const isCertificateValid = await checkCACertificate(
        ctx,
        certificate,
        isInit
    );

    if (!isCertificateValid.condition) {
        return response(
            false,
            `The Certificate with Serial Number ${certificate.serialNumber} is invalid - error: ${isCertificateValid.message}`
        );
    }
    return response(true, {
        response: "Accepted Certificate",
    });
};

const checkIfAppropriateCRL = async (ctx, crl, isInit) => {
    const constructedCRL = constructCRL(crl);

    if (!isInit) {
        const isCRLValid = await checkCRL(ctx, constructedCRL);

        if (!isCRLValid.condition) {
            return response(false, isCRLValid.message);
        }
    }

    const crlAttrs = getCRLAttrs(constructedCRL, ["O"]); //There is no need to check if the domain or the stakeholder are undefined - We did when we checked if the CRL is valid
    return response(true, {
        response: "Accepted CRL",
        extraData: {
            stakeholder: crlAttrs[0],
        },
    });
};

// Helper Functions

const getCRLAttrs = (constructedCRL, values) => {
    //values is an array that it has all the values that were requested
    if (!Array.isArray(values) || !values.length) {
        return;
    }

    const typeValues = constructedCRL.issuer.typesAndValues;

    const fetchedValues = [];

    const rdnmap = {
        "2.5.4.6": "C",
        "2.5.4.10": "O",
        "2.5.4.11": "OU",
        "2.5.4.3": "CN",
        "2.5.4.7": "L",
        "2.5.4.8": "S",
        "2.5.4.12": "T",
        "2.5.4.42": "GN",
        "2.5.4.43": "I",
        "2.5.4.4": "SN",
        "1.2.840.113549.1.9.1": "E-mail",
    };

    for (const typeAndValue of typeValues) {
        const typeval = rdnmap[typeAndValue.type];
        if (values.includes(typeval)) {
            fetchedValues.push(typeAndValue.value.valueBlock.value);
        }
    }
    return fetchedValues;
};

const checkCRL = async (ctx, constructedCRL) => {
    const TrustFile = require("../trustFile");
    const crlAttrs = getCRLAttrs(constructedCRL, ["O", "OU"]);
    const stakeholder = crlAttrs[0].toLowerCase();
    const domain = crlAttrs[1];
    if (typeof stakeholder === "undefined" || typeof domain === "undefined") {
        return response(
            false,
            `The CRL is not valid - error: domain: ${domain} stakeholder: ${stakeholder.toUpperCase()}`
        );
    }

    const CRLKey = TrustFile.makeKey([constants.indexCRL, stakeholder]);
    const CRLDoc = await ctx.trustFileManager.getState(CRLKey);

    if (!CRLDoc) {
        const certKey = TrustFile.makeKey([constants.indexCert, stakeholder]);
        const certDoc = await ctx.trustFileManager.getState(certKey);

        //No CRL - Thus we need to check if it is an import of a new CA.
        if (certDoc) {
            return response(
                true,
                "The CRL is valid - It is a new CA addition to the list of the current CAs"
            );
        } else {
            return response(false, "The CRL is invalid ");
        }
    }

    const constructedOlderCRL = constructCRL(CRLDoc.data);

    if (
        constructedCRL.thisUpdate.value <= constructedOlderCRL.thisUpdate.value
    ) {
        return response(
            false,
            `The CRL is not valid - error: Current used CRL date of update: ${constructedOlderCRL.thisUpdate.value}, New CRL date of update: ${constructedCRL.thisUpdate.value}`
        );
    }

    return response(
        true,
        `The CRL is valid - Current used CRL date of update: ${constructedOlderCRL.thisUpdate.value}, New CRL date of update: ${constructedCRL.thisUpdate.value}`
    );
};

module.exports = {
    checkIfAppropriateACL: checkIfAppropriateACL,
    checkIfAppropriateCRL: checkIfAppropriateCRL,
    checkIfAppropriateCertificate: checkIfAppropriateCertificate,
};
