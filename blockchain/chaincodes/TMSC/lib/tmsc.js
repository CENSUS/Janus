// The TMSC handles the functionality related to the dynamic
// update of trust anchors (involving CERTs, CRLs and
// TempACLs) and the trusted authorities as well as with the
// validation of the user credentials by trust anchors. The TMSC
// continuously tracks the blocks that contain the latest indexes
// Ind CERT , Ind CRL and Ind ACL of the linked lists.
"use strict";

const { Shim, ClientIdentity } = require("fabric-shim");
const { Contract, Context } = require("fabric-contract-api");
const constants = require("./utils/constants.js");
const {
    matchStrings,
    jsonParser,
    promiseHandler,
    bufferResponse,
    response,
    timestampToMilliseconds,
} = require("./utils/utils.js");
const {
    returnDomainStakeholdersInstance,
    getExtraCertAttrs,
    getTempACLAttrs,
    combineAttributes,
    invokerDomain,
    accessAudit,
    checkIfStakeholderIsRevoked,
    validateUserCerts,
    removeSignaturesFromUserCerts,
} = require("./helper.js");
const {
    constructCert,
    checkClientCertificate,
    checkCertRevokedByCRL,
} = require("./utils/helper.js");

const Election = require("./types/elections/election.js");
const TrustFile = require("./types/trust_anchors/trustFile.js");
const TrustFileManager = require("./types/trust_anchors/trustFileManager.js");
const Event = require("./utils/helper/events");
const ElectionManager = require("./types/elections/electionManager.js");
const StakeholderManager = require("./types/stakeholders/stakeholderManager.js");
const Stakeholder = require("./types/stakeholders/stakeholder.js");

class TMSCContext extends Context {
    constructor() {
        super();
        this.trustFileManager = new TrustFileManager(this);
        this.electionManager = new ElectionManager(this);
        this.stakeholderManager = new StakeholderManager(this);
    }
}

class TMSC extends Contract {
    createContext() {
        return new TMSCContext();
    }

    /**
     * Initialization function with which the Certificate/CRL of each organization is appended to the Proxy BC.
     * Additionally, it creates empty ACL files (JSONs) for each organization.
     * This function can only be invoked during the initialization/upgrade of the TMSC.
     * @param ctx
     * @param initPayload
     */
    async initLedger(ctx, initPayload) {
        console.info("============= START : Initialize Ledger ===========");

        const { data } = JSON.parse(initPayload);

        let [
            tempArrProxy,
            proxyStakeholderJSON,
            medicalDomainStakeholdersJSON,
            manufacturerDomainStakeholdersJSON,
            initCertificatesAndCRLs,
        ] = [
            [
                constants.proxyStakeholders,
                constants.medicalDomainStakeholders,
                constants.manufacturerDomainStakeholders,
            ],
            {},
            {},
            {},
            [],
        ];

        for (const domain in data) {
            for (const stakeholder in data[domain]) {
                proxyStakeholderJSON[
                    data[domain][stakeholder].name.toUpperCase()
                ] = {
                    name: data[domain][stakeholder].name,
                    domain: domain.toUpperCase(),
                    msp: data[domain][stakeholder].msp,
                };

                if (matchStrings(constants.medicalDomainStakeholders, domain)) {
                    medicalDomainStakeholdersJSON[
                        data[domain][stakeholder].name.toUpperCase()
                    ] = {
                        name: data[domain][stakeholder].name,
                        msp: data[domain][stakeholder].msp,
                    };
                } else if (
                    matchStrings(
                        constants.manufacturerDomainStakeholders,
                        domain
                    )
                ) {
                    manufacturerDomainStakeholdersJSON[
                        data[domain][stakeholder].name.toUpperCase()
                    ] = {
                        name: data[domain][stakeholder].name,
                        msp: data[domain][stakeholder].msp,
                    };
                }
                initCertificatesAndCRLs.push({
                    stakeholder: data[domain][stakeholder].name,
                    domain: domain,
                    acl: data[domain][stakeholder].acl,
                    certificate: data[domain][stakeholder].certificate,
                    crl: data[domain][stakeholder].crl,
                });
            }
        }

        const tempArrProxyJSONs = [
            proxyStakeholderJSON,
            medicalDomainStakeholdersJSON,
            manufacturerDomainStakeholdersJSON,
        ];

        for (let i = 0; i < tempArrProxy.length; i++) {
            const stakeholderInstance = Stakeholder.createInstance(
                tempArrProxy[i],
                tempArrProxyJSONs[i]
            );

            try {
                await ctx.stakeholderManager.add(stakeholderInstance);
            } catch (err) {
                throw new Error(
                    `Could not initialize the stakeholders, ${err}`
                );
            }
        }

        for (const object of initCertificatesAndCRLs) {
            try {
                // ACL FILE
                const ACLFile = TrustFile.createInstance();
                await ACLFile.defineFile(ctx, object.acl, false, true);

                if (!ACLFile.isValidFile) throw new Error(ACLFile.error);

                await ctx.trustFileManager.add(ACLFile);

                // CERTIFICATE FILE
                const CertificateFile = TrustFile.createInstance();

                await CertificateFile.defineFile(
                    ctx,
                    object.certificate,
                    false,
                    true
                );

                if (!CertificateFile.isValidFile)
                    throw new Error(CertificateFile.error);

                await ctx.trustFileManager.add(CertificateFile);

                // CRL FILE
                const CRLFile = TrustFile.createInstance();

                await CRLFile.defineFile(ctx, object.crl, false, true);

                if (!CRLFile.isValidFile) throw new Error(CRLFile.error);

                await ctx.trustFileManager.add(CRLFile);

                console.info(
                    `Successfully imported the (root) CA certificate, CRL and created an empty ACL for stakeholder: ${object.stakeholder}`
                );
            } catch (err) {
                return Shim.error(
                    `Could not initialize stakeholder ${object.stakeholder}, with error: ${err}`
                );
            }
        }
        console.info("============= END : Initialize Ledger ===========");
        return Shim.success(Buffer.from("Successfully initialized the TMSC"));
    }

    /**
     *
     * It is checked if  the `object` payload can be parsed to JSON. In case that this is true, it is
     * assumed that the payload is an ACL file and it is passed to the appropriate helper function
     * for further investigation. If the string cannot be parsed to JSON, it is assumed that the
     * payload is a Certificate/CRL. The exact type is defined based on how the file’s data
     * starts:
     * -----BEGIN X509 CRL----- OR -----BEGIN CERTIFICATE-----
     * If the file’s data starts with one of the above, then the corresponding helper function is called
     * in order to further examine if the Certificate/CRL can be accepted by the System.
     * If every check was completed successfully, the the current record is updated with the value
     * that the `object` holds.
     *
     * The same function (updateTrustAnchors) is used by the function `initLedger`. Its
     * functionalities include the case of the invoke being an Initialization invoke or a simple
     * update of an existing Certificate/CRL/TempACL.
     * @param ctx
     * @param object
     */
    async updateTrustAnchors(ctx, object) {
        const cid = new ClientIdentity(ctx.stub);

        // Check if invoker's Org is revoked
        const ownerOrgIsRevoked = await checkIfStakeholderIsRevoked(
            ctx,
            cid.getMSPID()
        );

        if (ownerOrgIsRevoked.status)
            return Shim.error(ownerOrgIsRevoked.message);
        // End of check

        object = jsonParser(object);

        const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const file = TrustFile.createInstance();

        await file.defineFile(ctx, object);

        if (!file.isValidFile) return Shim.error(file.error);

        const stakeholdersKey = Stakeholder.makeKey([
            constants.proxyStakeholders,
        ]);
        const stakeholderInstance = await ctx.stakeholderManager.get(
            stakeholdersKey
        );

        const invokerOwnsMSP =
            await stakeholderInstance.stakeholderIsInvokerStakeholder(
                ctx,
                cid.getMSPID(),
                file.organization
            );

        if (!invokerOwnsMSP)
            return Shim.error(
                `Insufficient rights to update the ${
                    file.fileType
                } for Organization ${file.organization.toUpperCase()}`
            );

        await ctx.trustFileManager.add(file);
        const [updateLogs, updateLogsErr] = await promiseHandler(
            ctx.trustFileManager.updateLogs(ctx, cid, file)
        );

        if (updateLogsErr) return Shim.error(updateLogsErr.message);

        const [isLogged, isLoggedErr, logDetails] = updateLogs;

        if (!isLogged || isLoggedErr)
            return Shim.error(
                isLoggedErr
                    ? isLoggedErr.message
                    : "The request could not be logged. Please, try again"
            );

        new Event(ctx, "TrustFileUpdate", logDetails).assignEvent();

        return Shim.success(
            Buffer.from(
                `Successfully updated the ${file.getFileType()} [ORGANIZATION: ${file.getFileOrganizationOwner()}]`
            )
        );
    }

    /**
     * It is used in order to prepare the Proxy BC for a new stakeholder append.
     * After checking that the provided MSP, Certificate, CRL, TempACL etc. are acceptable files,
     * it contacts the PSC in order to start an Election
     * @param ctx
     * @param orgMSP
     * @param caCert
     * @param caCRL
     * @param tempACL
     */
    async addCA(ctx, orgMSP, caCert, caCRL, tempACL) {
        const cid = new ClientIdentity(ctx.stub);

        // Check if invoker's Org is revoked
        const ownerOrgIsRevoked = await checkIfStakeholderIsRevoked(
            ctx,
            cid.getMSPID()
        );

        if (ownerOrgIsRevoked.status)
            return Shim.error(ownerOrgIsRevoked.message);
        // End of check

        const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        [orgMSP, caCert, caCRL, tempACL] = [
            jsonParser(orgMSP),
            jsonParser(caCert),
            jsonParser(caCRL),
            jsonParser(tempACL),
        ];

        const domainStakeholdersInstance =
            await returnDomainStakeholdersInstance(ctx);
        let { stakeholders, domain: initiatorOrgDomain } =
            domainStakeholdersInstance.getStakeholdersWithDetails();

        stakeholders =
            domainStakeholdersInstance.removeRevokedStakeholdersFromList(
                stakeholders
            );

        const constructedCert = constructCert(caCert);
        const [newOrganizationName, newCADomain] = [
            constructedCert.issuer.organizationName,
            constructedCert.issuer.organizationalUnitName.toUpperCase(),
        ];

        const stakeholderNotInState = Object.values(stakeholders).every(
            (stakeholder) =>
                !matchStrings(newOrganizationName, stakeholder.name)
        );

        if (!stakeholderNotInState) {
            const stakeholderInfo = Object.values(stakeholders).find(
                (stakeholder) =>
                    matchStrings(newOrganizationName, stakeholder.name)
            );

            if (!stakeholderInfo.isRevoked)
                return Shim.error(
                    `Stakeholder ${newOrganizationName} already exists and is not revoked`
                );
        }

        if (!matchStrings(initiatorOrgDomain, newCADomain))
            return Shim.error(
                `Stakeholder is from a different Domain. Check the Organizational Unit Name of the appended CA Certificate [INVOKER: ${initiatorOrgDomain}, NEW CA: ${newCADomain}]`
            );

        for (const document of [caCert, caCRL, tempACL]) {
            const file = TrustFile.createInstance();
            await file.defineFile(ctx, document, true);

            if (!file.isValidFile)
                return Shim.error(`The file is invalid. ${file.error}`);
        }

        tempACL = Buffer.from(tempACL, "base64").toString("utf-8");
        tempACL = jsonParser(tempACL);

        if (!matchStrings(tempACL["ORGANIZATION"], newOrganizationName))
            return Shim.error(
                "The ACL document is for a different organization"
            );

        tempACL = Buffer.from(JSON.stringify(tempACL), "utf-8").toString(
            "base64"
        );

        const electionInstance = Election.createInstance(
            "add_ca",
            initiatorOrgDomain,
            [orgMSP, caCert, caCRL, tempACL], // = data
            `Addition of ${newOrganizationName.toUpperCase()} [DOMAIN: ${newCADomain}]`,
            stakeholders
        );

        const [pscData, pscError] = await ctx.electionManager.startElection(
            cid,
            electionInstance
        );

        if (pscError) return Shim.error(pscError);

        electionInstance.setElectionID(pscData);
        electionInstance.createStateKey();

        await ctx.electionManager.add(electionInstance);

        new Event(ctx, "ElectionInitiated", pscData).assignEvent();

        return Shim.success(
            Buffer.from(
                `Successfully started an Election [Election ID: ${electionInstance.electionInfo.electionID}]`
            )
        );
    }

    /**
     * It checks if the caName can be accepted by the System
     * e.g. the caName is known to the Proxy BC and the invoker does not belong to it
     * Then, it contacts the PSC in order to start an Election to remove the stakeholder with the name `caName`
     * @param ctx
     * @param caName
     */

    async removeCA(ctx, caName) {
        const cid = new ClientIdentity(ctx.stub);

        // Check if invoker's Org is revoked
        const ownerOrgIsRevoked = await checkIfStakeholderIsRevoked(
            ctx,
            cid.getMSPID()
        );

        if (ownerOrgIsRevoked.status)
            return Shim.error(ownerOrgIsRevoked.message);
        // End of check

        caName = jsonParser(caName.replace(/\s/g, "-"));

        const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const stakeholdersKey = Stakeholder.makeKey([
            constants.proxyStakeholders,
        ]);
        const stakeholderInstance = await ctx.stakeholderManager.get(
            stakeholdersKey
        );

        // Uncomment for production
        // const acceptedInvoker = await checkIfKnownInvoker(ctx);

        // if (!acceptedInvoker.condition)
        //     return Shim.error(`Unknown CA Entity, ${acceptedInvoker.message}`);

        const isKnownStakeholder =
            stakeholderInstance.isKnownStakeholder(caName);

        if (!isKnownStakeholder)
            return Shim.error(`Unknown stakeholder [Stakeholder: ${caName}]`);

        const initiatorStakeholderIsRemovedStakeholder =
            await stakeholderInstance.stakeholderIsInvokerStakeholder(
                ctx,
                cid.getMSPID(),
                caName
            );

        if (initiatorStakeholderIsRemovedStakeholder)
            return Shim.error(
                `Can not ask to remove the Organization that you belong to`
            );

        stakeholderInstance.removeStakeholderFromStakeholders(caName);

        const { stakeholders, domain } =
            stakeholderInstance.getStakeholdersWithDetails();

        stakeholderInstance.removeRevokedStakeholdersFromList(stakeholders);

        const electionInstance = Election.createInstance(
            "remove_ca",
            domain,
            [caName], // = data
            `Removal of ${caName.toUpperCase()} [DOMAIN: ${domain}]`,
            stakeholders
        );

        const [pscData, pscError] = await ctx.electionManager.startElection(
            cid,
            electionInstance
        );

        if (pscError) return Shim.error(pscError);

        electionInstance.setElectionID(pscData);
        electionInstance.createStateKey();

        await ctx.electionManager.add(electionInstance);

        new Event(ctx, "ElectionInitiated", pscData).assignEvent();

        return Shim.success(
            Buffer.from(
                `Successfully started an Election [Election ID: ${electionInstance.electionInfo.electionID}]`
            )
        );
    }

    /**
     * When an Election ends (because of majority, or time end), PSC calls this function in order
     * to inform the TMSC that an Election has finished. Based on the Election's outcome, TMSC either just erases the
     * (temporarily saved) Election's data, or adds/removes a stakeholder by calling the (helper)
     * function addCAMajorityReached/removeCAMajorityReached.
     * The payload is a JSON object which holds the:
     *   ▪ electionID, the election’s ID
     *   ▪ electionApproved, the election’s outcome
     *   ▪ canStillReachConsensus, if majority has not been reached yet, it means that it is probable that the Election may end positively
     * If both the electionApproved and the canStillReachConsensus are false, then TMSC just removes the temporarily saved data and ends the procedure.
     * Otherwise, if the electionApproved is true, then it calls the appropriate helper function to add/remove the
     * stakeholder to/from the list of the active stakeholders.
     * @param ctx
     * @param payload
     * @returns
     */
    // Is executed by the PSC
    async majorityUpdate(ctx, payload) {
        const { electionID, electionApproved, canStillReachConsensus } =
            JSON.parse(payload);

        const electionKey = Election.makeKey([electionID]);
        const electionInstance = await ctx.electionManager.get(electionKey);

        if (!electionInstance)
            return Shim.success(
                bufferResponse(
                    true,
                    `Election finished unsuccessfully [ELECTION ID: ${electionID}]`
                )
            );

        if (!canStillReachConsensus && !electionApproved)
            await ctx.electionManager.removeInstance(electionKey);

        if (electionApproved) {
            await ctx.electionManager.updateFromElection(ctx, electionInstance);
            await ctx.electionManager.removeInstance(electionKey);
        }

        return Shim.success(
            bufferResponse(
                true,
                `Election finished successfully [ELECTION ID: ${electionID}]`
            )
        );
    }

    /**
     * This function is used in order to determine the various roles and temporal roles of a Client.
     * As an input it takes an array of: certificates of a Client.
     * Every certificate is checked in order to determine if it is revoked or if the (root) certificate that
     * generated the Client certificate is known to the TMSC and is not revoked.
     * Every certificate should include the same GID identifier.
     *
     * @param ctx
     * @param userCerts
     */
    async getUserValidation(ctx, userCerts) {
        userCerts = jsonParser(userCerts);

        if (Array.isArray(userCerts)) userCerts = userCerts[0];

        if (!userCerts.master)
            return Shim.error(
                response(
                    false,
                    "Wrong certificates structure. Please, contact an administrator"
                )
            );

        try {
            validateUserCerts(ctx, userCerts);
        } catch (err) {
            return Shim.error(response(false, err.message));
        }

        // Validation passed successfully - Thus, the signatures are not needed anymore
        userCerts = removeSignaturesFromUserCerts(userCerts);

        if (!Array.isArray(userCerts)) {
            return Shim.error(
                Buffer.from(`User's validation parameters error`)
            );
        }

        const proxyStakeholdersKey = Stakeholder.makeKey([
            constants.proxyStakeholders,
        ]);
        const proxyStakeholdersInstance = await ctx.stakeholderManager.get(
            proxyStakeholdersKey
        );

        const [certAttrs, tempAttrs] = [{}, {}];

        for (const userCert of userCerts) {
            const constructedCert = constructCert(userCert);
            const stakeholder =
                constructedCert.issuer.organizationName.toLowerCase();

            // Checks if the stakeholder exists or if revoked
            const stakeholderExists =
                proxyStakeholdersInstance.isKnownStakeholder(stakeholder);

            if (!stakeholderExists)
                return Shim.error(
                    response(
                        false,
                        `Organization ${stakeholder} either does not exist or is revoked`
                    )
                );

            const certificateValidation = await checkClientCertificate(
                ctx,
                constructedCert
            );

            if (!certificateValidation.condition)
                return Shim.error(certificateValidation);

            const CRLKey = TrustFile.makeKey([constants.indexCRL, stakeholder]);
            const CRLDoc = await ctx.trustFileManager.get(CRLKey);

            if (!CRLDoc.isValidFile)
                return Shim.error(
                    response(
                        false,
                        "Internal error. Communicate with the System's Administrator"
                    )
                );

            // The actual CRL data is nested under CRLDoc.data
            const CRLData = CRLDoc.data;

            const isCertRevoked = checkCertRevokedByCRL(
                CRLData,
                constructedCert
            );

            if (!isCertRevoked.condition)
                return Shim.success(response(false, isCertRevoked.message));

            const stakeholderData =
                await proxyStakeholdersInstance.getStakeholderByName(
                    ctx,
                    stakeholder
                );

            const stakeholderMSP = stakeholderData.msp.toUpperCase();

            if (!certAttrs[stakeholderMSP]) certAttrs[stakeholderMSP] = {};

            const extraCertAttrs = getExtraCertAttrs(constructedCert);

            Object.keys(extraCertAttrs).forEach((type) => {
                certAttrs[stakeholderMSP][type] =
                    typeof extraCertAttrs[type] !== "object"
                        ? (certAttrs[stakeholderMSP][type],
                          extraCertAttrs[type])
                        : {
                              ...(certAttrs[stakeholderMSP][type] || {}),
                              ...extraCertAttrs[type],
                          };
            });

            tempAttrs[stakeholderMSP] = {
                ...tempAttrs[stakeholderMSP],
                ...(await getTempACLAttrs(
                    ctx,
                    certAttrs[stakeholderMSP].GID,
                    stakeholderData
                )),
            };
        }

        const combinedAttrs = combineAttributes(ctx, certAttrs, tempAttrs);

        return Shim.success(Buffer.from(JSON.stringify(combinedAttrs)));
    }

    /**
     * It accepts a payload, which is a JSON Object.
     * This JSON Object, has the below root keys:
     * - certificate
     * - challenge
     * The challenge root key, has nested keys:
     * - challenge.raw, the raw text that was signed
     * - challenge.signature, the signature that was generated with the private key of the client and the raw text
     * `validateSignChallenge` checks if:
     * - the certificate is valid and not revoked
     * - the signature is acceptable
     * If both the certificate and the signature are valid, it returns true, along with a success message
     * otherwise, it returns false, along with an error message
     * @param {*} ctx
     * @param {*} payload
     */
    async validateSignChallenge(ctx, payload) {
        const cid = new ClientIdentity(ctx.stub);
        // Check if invoker's Org is revoked
        const ownerOrgIsRevoked = await checkIfStakeholderIsRevoked(
            ctx,
            cid.getMSPID()
        );

        if (ownerOrgIsRevoked.status)
            return Shim.error(ownerOrgIsRevoked.message);
        // End of check

        payload = jsonParser(payload);
        const { certificate, challenge } = payload;

        const constructedCert = constructCert(certificate);

        const currentTime = timestampToMilliseconds(ctx.stub.getTxTimestamp());

        if (constructedCert.validTo.getTime() < currentTime)
            return Shim.error(response(false, "The certificate has expired"));

        const userHoldsPK = constructedCert.publicKey.verify(
            Buffer.from(challenge.raw, "binary"),
            Buffer.from(challenge.signature, "binary"),
            "sha256"
        );

        const subjectKeyIdentifierMatch =
            constructedCert.verifySubjectKeyIdentifier();

        if (!userHoldsPK || !subjectKeyIdentifierMatch)
            return Shim.error(response(false, "Invalid Signature"));

        const certificateValidation = await checkClientCertificate(
            ctx,
            constructedCert
        );

        if (!certificateValidation.condition)
            return Shim.error(
                response(
                    false,
                    `Certificate error: ${certificateValidation.message}`
                )
            );

        return Shim.success(bufferResponse(true, "Accepted signature"));
    }

    /**
     * `isInvokerStakeholderRevoked` returns the state of a Stakeholder, based on the MspId of the
     * invoker
     * @param {*} ctx
     * @param {*} mspId
     */
    async isInvokerStakeholderRevoked(ctx) {
        const ownerOrgIsRevoked = await checkIfStakeholderIsRevoked(
            ctx,
            new ClientIdentity(ctx.stub).getMSPID()
        );

        return Shim.success(
            bufferResponse(ownerOrgIsRevoked.status, ownerOrgIsRevoked.message)
        );
    }

    /**
     * `getProxyStakeholders` returns the stakeholders of the Proxy BC.
     * This function may be used by other chaincodes that need this kind of information
     * @param ctx
     */
    async getProxyStakeholders(ctx) {
        const cid = new ClientIdentity(ctx.stub);

        const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"], ["AUDITOR"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const stakeholderKey = Stakeholder.makeKey([
            constants.proxyStakeholders,
        ]);

        const stakeholderInstance = await ctx.stakeholderManager.get(
            stakeholderKey
        );

        const stakeholders = stakeholderInstance.getStakeholders();

        return Shim.success(bufferResponse(true, stakeholders));
    }

    /**
     * `domainOfClient` returns the domain that the invoker is member of (e.g. `medical`)
     * This function may be used by other chaincodes that need this kind of information
     * @param ctx
     */
    async domainOfClient(ctx) {
        const cid = new ClientIdentity(ctx.stub);

        const foundDomain = await invokerDomain(ctx, cid);

        if (foundDomain) return Shim.success(bufferResponse(true, foundDomain));

        return Shim.error(response(false, "Unknown domain"));
    }

    /**
     * `returnDomainStakeholders` returns the stakeholders of a domain.
     * It accepts a `category` as a domain (e.g. category = PROXY/MEDICAL/MANUFACTURER) and it returns
     * the stakeholders of this category.
     * If there is a need to only get the active (= not revoked) stakeholders
     * `notRevoked` can be defined as `true`.
     * If `notRevoked` is defined as `false`, `returnDomainStakeholders` will return all the stakeholders
     * of the provided category, without filtering the stakeholders' condition.
     * If the provided `category` is unknown to the System, then an error message will be returned.
     * @param {*} ctx
     * @param {*} category
     * @param {*} notRevoked
     */
    async returnDomainStakeholders(ctx, category, notRevoked) {
        if (category) {
            category = category.toString().toUpperCase();
            if (
                ![
                    constants.proxyStakeholders,
                    constants.medicalDomainStakeholders,
                    constants.manufacturerDomainStakeholders,
                ].includes(category)
            ) {
                return Shim.error(
                    response(false, `Unknown category ${category}`)
                );
            }
        } else {
            category = constants.proxyStakeholders;
        }

        const stakeholdersKey = Stakeholder.makeKey([category]);
        const stakeholdersInstance = await ctx.stakeholderManager.get(
            stakeholdersKey
        );

        let stakeholders = stakeholdersInstance.getStakeholders();

        if (notRevoked)
            stakeholders =
                stakeholdersInstance.removeRevokedStakeholdersFromList(
                    stakeholders
                );

        return Shim.success(bufferResponse(true, stakeholders));
    }
}

module.exports = TMSC;
