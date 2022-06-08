"use strict";

const { constructCert } = require("../../../utils/helper");
const {
    matchStrings,
    jsonParser,
    checkIfBASE64Encoded,
    response,
} = require("../../../utils/utils");

const {
    checkIfAppropriateACL,
    checkIfAppropriateCertificate,
    checkIfAppropriateCRL,
} = require("./utils");

/**
 *
 * Investigates if it is: a CERTIFICATE, a CRL or a tempACL
 */
const inspectTypeOfInput = async (
    ctx,
    document,
    isNewCAAppend = false,
    isInit = false
) => {
    const documentAsUTF8 = checkIfBASE64Encoded(document)
        ? Buffer.from(document, "base64").toString("utf-8")
        : document;
    const jsonObject = jsonParser(documentAsUTF8);

    let [foundType, errorMessage] = [null, null];

    if (typeof jsonObject === "object") {
        foundType = "ACL";
        const appropriateACL = await checkIfAppropriateACL(
            ctx,
            jsonObject,
            isNewCAAppend,
            isInit
        );

        if (appropriateACL.condition)
            return response(true, {
                type: foundType,
                extraData: {
                    stakeholder: jsonObject.ORGANIZATION,
                    data: jsonObject.ACL,
                },
            });

        errorMessage = appropriateACL.message;
    }

    const indicator = documentAsUTF8.substring(0, documentAsUTF8.indexOf("\n"));

    if (matchStrings(indicator, "-----BEGIN CERTIFICATE-----", true)) {
        foundType = "CERTIFICATE";
        const constructedCert = constructCert(document);
        const appropriateCert = await checkIfAppropriateCertificate(
            ctx,
            constructedCert,
            isInit
        );
        if (appropriateCert.condition) {
            return response(true, {
                type: foundType,
                extraData: {
                    stakeholder: constructedCert.issuer.organizationName,
                    serialNumber: constructedCert.serialNumber,
                    data: document,
                },
            });
        }
        errorMessage = appropriateCert.message;
    }

    if (matchStrings(indicator, "-----BEGIN X509 CRL-----", true)) {
        foundType = "CRL";
        const appropriateCRL = await checkIfAppropriateCRL(
            ctx,
            document,
            isInit
        );
        if (appropriateCRL.condition) {
            let stakeholder = appropriateCRL.message.extraData.stakeholder;
            return response(true, {
                type: foundType,
                extraData: {
                    stakeholder,
                    data: document,
                },
            });
        }
        errorMessage = appropriateCRL.message;
    }

    return response(false, {
        type: foundType ? foundType : "UNKNOWN",
        extraData: {
            errorMessage: errorMessage || "No error data",
        },
    });
};

module.exports = { inspectTypeOfInput: inspectTypeOfInput };
