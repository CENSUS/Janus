"use strict";

const { Shim, ClientIdentity } = require("fabric-shim");
const hasher = require("crypto").createHash;
const { Contract, Context } = require("fabric-contract-api");
const AuthoritySign = require("./types/authoritySign");
const constants = require("./utils/constants");
const ElectionManager = require("./types/elections/election/electionManager");
const BallotManager = require("./types/elections/ballot/ballotManager");
const Event = require("./utils/helper/events");
const chaincodeInstances = require("./utils/helper/interChaincode/preconfiguredInstances");
const {
    fetchPartialCompositeKey,
    getActiveStakeholderElectionsAPI,
    majorityConsentCheck,
    buildCollectionName,
    getBallotsOfStakeholder,
    getDomainStakeholders,
    validateSignChallenge,
    verifyElectionOwnership,
    isActiveElection,
    accessAudit,
    electionExtraInfo,
    isInvokerStakeholderRevoked,
    removeSignaturesFromUserCerts,
} = require("./helper");

const {
    promiseHandler,
    timestampToDate,
    jsonParser,
    matchStrings,
    response,
    bufferResponse,
    deriveIdCNFromCID,
    checkIfBASE64Encoded,
    timestampToMilliseconds,
} = require("./utils/utils");

const Election = require("./types/elections/election/election");
const Ballot = require("./types/elections/ballot/ballot");

class PSCContext extends Context {
    constructor() {
        super();
        this.electionManager = new ElectionManager(this);
        this.ballotManager = new BallotManager(this);
    }
}

class PSC extends Contract {
    // Registered users may request access to data only through
    // the PSC. The PSC will verify the log-in credentials and
    // trigger the Logging Smart Contract (discussed below) to log
    // the request. Then the PSC will pre-process the request, in
    // order to identify the appropriate Domain Blockchain that will
    // process this request. When a response is received from the
    // Domain Blockchain, the PSC will send the response to: i) the
    // user, encrypted with the user’s public key; and ii) the Logging
    // Smart Contract to log the transaction.

    createContext() {
        return new PSCContext();
    }

    /**
     * It is invoked by the TMSC/LSC in order to propose an Election. It checks if another
     * election, with the same payload, is active. If another election is active, it returns an error.
     * If an election can be initialized, it creates a Ballot for each stakeholder (organization) that their
     * vote is needed and generates an Election ID. The Election ID is based on the provided
     * payload. It also creates an Event that it returns, along with the Election ID, to the caller
     * function. This event must be emitted by the caller function in order to inform the Inter-Blockchain API
     * that an election has started. While we could emit this event by the PSC
     * itself, Hyperledger Fabric limits us with one event per transaction and the function that is
     * able to emit the event can only be the function that started the procedure (= caller function).
     * Thus, we need to provide the event to the caller function.
     * @param {*} ctx
     * @param {*} payload
     */
    async majorityConsentInit(ctx, payload) {
        // For some reason, there is a bug (in HF) and an optional arg (stakeholders = {}) cannot be assigned - Thus, the others CCs should include an empty stakeholders' Object ({})
        // The problem stems from the fact that an invocation can also happen from the TMSC, so the CC won't be able to complete the request (with error: same TX IDs)
        // const cid = new ClientIdentity(ctx.stub);
        const cid = new ClientIdentity(ctx.stub);

        const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"], ["AUDITOR"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        payload = JSON.parse(payload);
        const invokerMSPID = cid.getMSPID();

        const electionInstance = Election.createInstance(payload);

        // In order to avoid duplicate Elections
        // e.g. A Stakeholder (1) asks to remove another Stakeholder (2), while in the meantime, a third Stakeholder (3)
        // asks to remove the second (2) Stakeholder
        // all the ACTIVE (and ONLY the ACTIVE) Elections are examined in case that any of them carries the same dataHash
        const currentActiveElections = await fetchPartialCompositeKey(
            ctx,
            constants.ACTIVE_ELECTION,
            []
        );

        for (const election of currentActiveElections) {
            const electionID = ctx.stub.splitCompositeKey(election.Key)
                .attributes[1];

            const activeElectionKey = Election.makeKey([electionID]);
            const activeElection = await ctx.electionManager.get(
                activeElectionKey
            );

            if (!activeElection) continue;

            if (
                matchStrings(
                    activeElection.dataHash,
                    electionInstance.dataHash,
                    true
                )
            )
                return Shim.error(
                    `An active Election already exists [ELECTION ID: ${activeElection.electionID}, ELECTION START DATE: ${activeElection.startDate}, ELECTION END DATE: ${activeElection.validUntil}, INITIATOR: ${activeElection.creator}]`
                );
        }

        const [stakeholdersData, stakeholdersDataErr] = await promiseHandler(
            getDomainStakeholders(
                ctx,
                invokerMSPID,
                electionInstance.getAudience(),
                false,
                electionInstance.getStakeholders(),
                true
            )
        );

        if (stakeholdersDataErr) return Shim.error(stakeholdersDataErr.message);

        const stakeholders = stakeholdersData[0];

        electionInstance.prepareElection(ctx, stakeholders, invokerMSPID);
        electionInstance.createStateKey();

        const activeElectionKey = ctx.stub.createCompositeKey(
            constants.ACTIVE_ELECTION,
            [invokerMSPID, electionInstance.electionID]
        );

        try {
            await ctx.electionManager.addState(electionInstance);
            await ctx.stub.putState(activeElectionKey, Buffer.alloc(1));
        } catch (err) {
            return Shim.error(response(false, "Could not create an Election"));
        }

        for (const stakeholder in electionInstance.stakeholders) {
            const { msp } = electionInstance.stakeholders[stakeholder];

            if (matchStrings(invokerMSPID, msp)) continue;

            // Creates the `envelopes` for the votes (one for every organization)
            const ballot = Ballot.createInstance(
                msp,
                electionInstance.electionID
            );

            await ctx.ballotManager.add(ballot);
        }

        const eventData = electionInstance.constuctElectionEvent(ctx);
        return Shim.success(bufferResponse(true, eventData));
    }

    /**
     * `majorityClientVote` is used by the CA-ADMINs of each stakeholder in order to
     * vote to an Election.
     * `authoritySign` is a JSON Object which holds three key-value pairs:
     * - nonce: The Election's ID
     * - signature: The signed message that verifies if the CA-ADMIN actually possess the
     * Private Key of the certificate
     * - approved: The approval/denial
     *
     * Before proceeding, `majorityClientVote` checks if a ballot for the provided nonce
     * and the invoker (CA-ADMIN) exists. If one exists, it checks if the CA-ADMIN has already casted their vote and
     * if the election is still active. If every check is successful, it validates the sign challenge.
     * In order to validate the sign challenge, `majorityClientVote` contacts the TMSC and the
     * `validateSignChallenge` function. If the sign challenge validation was successful, it updates the CA-Admin's ballot record
     * and emit an event
     * @param {*} ctx
     * @param {*} authoritySign
     * @returns
     */
    async majorityClientVote(ctx, authoritySign) {
        const cid = new ClientIdentity(ctx.stub);

        const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const invokerMSPID = cid.getMSPID();
        const invoker = deriveIdCNFromCID(cid);

        authoritySign = JSON.parse(authoritySign);

        let authoritySignData;
        try {
            authoritySignData = new AuthoritySign(authoritySign);
        } catch (err) {
            return Shim.error(err.message);
        }

        const ballotKey = Ballot.makeKey([
            invokerMSPID,
            authoritySignData.nonce,
        ]);
        const ballotInstance = await ctx.ballotManager.get(ballotKey);

        if (!ballotInstance)
            return Shim.error(
                `An Election does not exist or you are not eligible to vote [ELECTION ID: ${authoritySignData.nonce}]`
            );

        if (ballotInstance.signed)
            return Shim.error(
                `You have already voted [ELECTION ID: ${authoritySignData.nonce}}]`
            );

        const electionKey = Election.makeKey([authoritySignData.nonce]);
        const electionInstance = await ctx.electionManager.get(electionKey);

        if (!electionInstance)
            return Shim.error(
                `The Election was not found - Communicate with the System's Administrator [ELECTION ID: ${authoritySignData.nonce}]`
            );

        if (matchStrings(invokerMSPID, electionInstance.creator, true))
            return Shim.error(
                `Can not vote to an Election that your Organization has started, MSP IDs match error: [CREATOR: ${electionInstance.creator}, YOU: ${invokerMSPID}]`
            );

        const currentTime = timestampToDate(ctx.stub.getTxTimestamp());

        if (!(currentTime < new Date(electionInstance.validUntil)))
            return Shim.error("The Election period is over");

        const derivedPublicCertificate = cid.getIDBytes().toString("base64"); // The certificate of the invoker

        const [signChallenge, signChallengeErr] = await promiseHandler(
            validateSignChallenge(
                ctx,
                derivedPublicCertificate,
                electionInstance.challengeData,
                authoritySignData.signature
            )
        );

        if (signChallengeErr)
            return Shim.error(
                "Could not validate the signature",
                signChallengeErr.message
            );

        if (!signChallenge.condition)
            return Shim.error(
                `Invalid signature, error ${signChallenge.message}`
            );

        try {
            ballotInstance.castVote(
                ctx,
                invoker,
                authoritySignData.approved,
                authoritySignData.signature
            );

            await ctx.ballotManager.updateInstance(ballotInstance);
        } catch (err) {
            return Shim.error(
                `Could not append the approval to the Election with ID: ${authoritySignData.nonce}`
            );
        }

        const eventData = {
            electionType: electionInstance.electionType,
            electionID: authoritySignData.nonce,
            voter: invokerMSPID,
        };

        new Event(ctx, "BallotUpdated", eventData).assignEvent();

        return Shim.success(
            Buffer.from(
                `Successful Vote [ELECTION ID: ${
                    authoritySignData.nonce
                }, APPROVAL: ${
                    authoritySignData.approved ? "APPROVED" : "DECLINED"
                }]`
            )
        );
    }

    /**
     * `updateElection` is a step before terminating an Election.
     * It is invoked by the InterBlockchain API, when:
     * - consensus is achieved
     * or
     * - election time end is reached
     * When invoked, `updateElection` does not fully trust Inter-Blockchain's request.
     * So, `updateElection` checks if the Election is, indeed, completed.
     * If the Election is not completed, it returns an error message to the Inter-Blockchain API while
     * emitting an `Election Still in Progress` event.
     * Otherwise, it verifies that the invoker that made the request through the Inter-Blockchain API
     * is a member of the Organization that started the Election.
     * Then, it contacts the appropriate chaincode (TMSC/LSC) and the `majorityUpdate` function, to inform it that the Election
     * has ended. If the contact was successful, PSC removes the Election from the active Elections and emits an `Election Ended` event.
     * @param {*} ctx
     * @param {*} electionID
     */
    async updateElection(ctx, electionID) {
        const cid = new ClientIdentity(ctx.stub);
        const invokerMSPID = cid.getMSPID();

        const [consentCheck, consentCheckErr] = await promiseHandler(
            majorityConsentCheck(ctx, electionID, invokerMSPID)
        );

        if (consentCheckErr) return Shim.error(consentCheckErr.message);

        const electionApproved = consentCheck.condition;
        const { electionData, canStillReachConsensus } = consentCheck.message;

        if (!verifyElectionOwnership(ctx, electionData.creator, invokerMSPID))
            return Shim.error(
                `Your organization does not own this election [ELECTION ID: ${electionID}]`
            );

        const currentTime = timestampToDate(ctx.stub.getTxTimestamp());

        if (
            electionApproved ||
            (!electionApproved && !canStillReachConsensus) ||
            !(currentTime < new Date(electionData.validUntil))
        ) {
            // Means that the election has ended

            const activeElectionCompositeKey = ctx.stub.createCompositeKey(
                constants.ACTIVE_ELECTION,
                [invokerMSPID, electionID]
            );

            try {
                await ctx.stub.deleteState(activeElectionCompositeKey);
            } catch (err) {
                return Shim.error("Could not remove the Active Election");
            }

            const chaincodeToCall =
                electionData.electionType === "logs" ? "LSC" : "TMSC"; // Should use .env

            const invokePayload = {
                electionID: electionData.electionID,
                electionApproved,
                canStillReachConsensus,
                creator: electionData.creator,
            };

            const CCInstance =
                chaincodeInstances[chaincodeToCall].majorityUpdate(ctx);

            await CCInstance.makeContact([invokePayload]);
            const [CCResponse, CCResponseErr] = [
                CCInstance.response,
                CCInstance.error,
            ];

            if ((CCResponse && !CCResponse.condition) || CCResponseErr)
                return Shim.error(
                    CCResponse ? CCResponse.message : CCResponseErr.message
                );

            new Event(ctx, "ElectionEnded", electionID).assignEvent();

            return Shim.success(
                bufferResponse(true, "The Election ended successfully")
            );
        }
        new Event(ctx, "ElectionStillInProgress", electionID).assignEvent();

        return Shim.success(
            bufferResponse(true, "The Election is still in progress")
        );
    }

    /**
     * `validateUser` takes as input an array of userCerts.
     * In order to validate the provided user certificates, it contacts the
     * TMSC and the `getUserValidation` function.
     * It returns the roles and the temporal roles of the user, based on the provided certificates.
     * @param {*} ctx
     * @param {*} userCerts
     * @returns
     */
    async validateUser(ctx, userCerts) {
        userCerts = jsonParser(userCerts);
        const certificates = Array.isArray(userCerts) ? userCerts : [userCerts];

        const TMSCInstance = chaincodeInstances.TMSC.getUserValidation(ctx);
        await TMSCInstance.makeContact([certificates]);

        const [userValidation, userValidationErr] = [
            TMSCInstance.response,
            TMSCInstance.error,
        ];

        if ((userValidation && !userValidation.condition) || userValidationErr)
            return Shim.error(
                userValidation
                    ? userValidation.message
                    : userValidationErr.message
            );

        return Shim.success(Buffer.from(JSON.stringify(userValidation)));
    }

    /**
     * `requestAccess` takes as input the:
     * - userCerts, which are the certificates that will be used to obtain the roles and
     * temporal roles of the client
     * - data_id: the request's payload
     * Prior to anything else, `requestAccess` first constructs the `requestDetails` in order to
     * log the request with the LSC chaincode. The `requestDetails` object consists of the:
     * - transaction ID (txID)
     * - invoker
     * - invocation time
     * - requestDetails: { userCerts, data_id }
     * It then hashes the `requestDetails` object in order to produce a request ID, and it also appends this
     * request ID to the aforementioned requestDetails object.
     * It then contacts the LSC and the `requestLog` function, to log the request. The payload passed to the LSC, is the
     * `requestDetails` object that was previously constructed.
     * If the logging of the request is not successful, `requestAccess` will return an error.
     * Upon successful logging of the request, the `requestAccess` will send the provided certificates (`userCerts`) to the
     * TMSC and the `getUserValidation` function in order to validate the client and to
     * obtain the available roles and temporal roles.
     * If the user validation is successful:
     * `requestAccess` will construct an `eventData` object which holds the:
     *  - transaction ID as TXID,
     *  - request ID as REQID,
     *  - invoker as invoker,
     *  - user's roles and temporal roles as userRole,
     *  - data_id as data_id,
     * Upon constructing the `eventData` object, `requestAccess` emits an `Request Forward PBC to DBC` event that includes the `eventData` object
     * and which the Inter-Blockchain API will receive (as an event) to complete the request.
     * If the user validation is not successful, `requestAccess` will return an error.
     * @param {*} ctx
     * @param {*} userCerts
     * @param {*} data_id
     */
    async requestAccess(ctx, userCerts, data_id) {
        const isStakeholderRevoked = await isInvokerStakeholderRevoked(ctx);
        if (isStakeholderRevoked.condition)
            return Shim.error(isStakeholderRevoked.message);

        const cid = new ClientIdentity(ctx.stub);

        userCerts = jsonParser(userCerts);
        // userCerts = Array.isArray(userCerts) ? userCerts : [userCerts];

        const txID = ctx.stub.getTxID();
        const invoker = deriveIdCNFromCID(cid);
        const invocationTime = timestampToDate(ctx.stub.getTxTimestamp());

        const certificates = removeSignaturesFromUserCerts(
            Object.assign({}, userCerts)
        );
        certificates.forEach((certificate, index) => {
            if (!checkIfBASE64Encoded(certificate))
                certificates[index] = Buffer.from(
                    certificate,
                    "utf-8"
                ).toString("base64");
        });

        const requestDetails = {
            txID,
            invoker,
            invocationTime,
            requestDetails: { certificates, dataID: data_id },
        };

        const reqID = hasher("sha1")
            .update(JSON.stringify(requestDetails))
            .digest("hex");

        requestDetails.requestID = reqID;

        const LSCInstance = chaincodeInstances.LSC.requestLog(ctx);
        await LSCInstance.makeContact([requestDetails]);

        const [LSCResponse, LSCResponseErr] = [
            LSCInstance.response,
            LSCInstance.error,
        ];

        if (LSCResponseErr) return Shim.error(LSCResponseErr.message);

        if (LSCResponse) {
            const TMSCInstance = chaincodeInstances.TMSC.getUserValidation(ctx);
            await TMSCInstance.makeContact([userCerts]);

            const [userValidation, userValidationErr] = [
                TMSCInstance.response,
                TMSCInstance.error,
            ];

            if (
                (userValidation && !userValidation.condition) ||
                userValidationErr
            )
                return Shim.error(
                    userValidationErr
                        ? userValidationErr.message
                        : userValidation.message
                );

            if (userValidation.condition) {
                // True, forward the request
                const userRole = userValidation.message;
                const eventData = {
                    TXID: txID,
                    REQID: reqID,
                    invoker: invoker,
                    userRole: userRole,
                    data_id: data_id,
                };

                new Event(
                    ctx,
                    "RequestForwardPBCtoDBC",
                    eventData
                ).assignEvent();

                return Shim.success(
                    Buffer.from(
                        JSON.stringify({
                            details: {
                                requestID: reqID,
                                transactionID: txID,
                            },
                            message: `The request has been successfully submitted and is being processed - [REQUEST ID: ${reqID}]`,
                        })
                    )
                );
            } else {
                return Shim.error(
                    `The request could not be processed - User validation error: ${userValidation.message}`
                );
            }
        } else {
            return Shim.error(
                "The request could not be processed - Internal error"
            );
        }
    }

    /**
     * Upon request completion, Inter-Blockchain API invokes the `updateFromDBC` function in order to
     * save the response's data to the Proxy BC and to complete the request. In order to do so, Inter-Blockchain API sends a `data` payload
     * to the `updateFromDBC` function which is an object and it includes:
     * - the invoker as invoker
     * - the transaction's ID as txID,
     * - the request's ID as reqID,
     * - the approval of the request as approved
     * Along with the `data` payload, it sends, as transient data, the response that it was received from the
     * stakeholders' database(s).
     * Then, `updateFromDBC` creates a `dataToLog` object, which includes the:
     * - the invoker as invoker
     * - the transaction's ID as txID,
     * - the request's ID as reqID,
     * - the approval of the request as approved
     * and forwards it to the LSC chaincode and the `updateRequestLog` function in order to update the existing `request log` record
     * that is bound with this request ID identifier.
     * If the update of the existing `request log` is successful, `updateFromDBC` saves the transient data to the private collection
     * of the organization that the client who made the request belongs to and emits a `Updated Log Data` event.
     * Otherwise, if the logging was not updated successfuly or the transient data could not be put to the private collection of the
     * organization, it returns an error.
     * @param {*} ctx
     * @param {*} data
     */
    async updateFromDBC(ctx, data) {
        const cid = new ClientIdentity(ctx.stub);

        const { invoker, txID, reqID, approved } = JSON.parse(data);

        const private_data = ctx.stub.getTransient();
        const transient_data = private_data.get("database_response");

        const ACSCResponse = jsonParser(transient_data.toString("utf8"));
        const { data: dbData, accessibleUntil } = ACSCResponse;

        const dataToLog = {
            invoker,
            txID,
            reqID,
            approved,
            accessibleUntil,
        };

        const LSCInstance = chaincodeInstances.LSC.updateRequestLog(ctx);
        await LSCInstance.makeContact([dataToLog]);

        const [updateLogs, updateLogsErr] = [
            LSCInstance.response,
            LSCInstance.error,
        ];

        if (updateLogsErr) return Shim.error(updateLogsErr.message);

        if (!updateLogs) {
            new Event(ctx, "InabilityToLogUpdate", dataToLog).assignEvent();
            return Shim.error(JSON.stringify(false));
        }

        // Now that the request's details were logged, we can store the response (data)
        const privateMSPCollection = buildCollectionName(ctx, cid.getMSPID());

        const dataAsBuf = Buffer.from(JSON.stringify(dbData));

        try {
            await ctx.stub.putPrivateData(
                privateMSPCollection,
                reqID,
                dataAsBuf
            );
        } catch (err) {
            new Event(ctx, "InabilityToLogData", dataToLog).assignEvent();
            return Shim.error(JSON.stringify(false));
        }

        new Event(ctx, "UpdatedLogData", dataToLog).assignEvent();

        return Shim.success(Buffer.from(JSON.stringify(true)));
    }

    /**
     * `syncEntityWithBC` is a generic function that can be used when an entity (CA-Admin, Auditor, Client, API etc.)
     * wants to access data stored at the Proxy BC.
     * `syncEntityWithBC` provides the below options:
     * - userRequest
     * - activeElectionsAPI
     * - activeElectionsOfStakeholder
     * - isActiveElection
     * - electionInspect
     *
     * In general,
     *
     * - `userRequest` communicates with the LSC and the `getUserRequestLog` function and returns the
     * requests that the client has made. The Client can provide a distinct `request ID` in order to fetch the data
     * for it, or an empty `request ID`, in order to get all of the requests that were made by them.
     *
     * - `activeElectionsAPI` can be accessed by the APIs of the System to fetch the Active Elections
     *
     * - `activeElectionsOfStakeholder` can be accessed by the `CA-ADMINs` of the System in order to
     *  get the Ballots of the stakeholder
     *
     * - `isActiveElection`, as the name suggests, checks if the provided Election ID key belongs to an active
     * Election of a stakeholder
     *
     * - `electionInspect` fetches various information about an Election (e.g. voters)
     * @param {*} ctx
     * @param {*} payload
     */
    async syncEntityWithBC(ctx, payload) {
        payload = jsonParser(payload);

        const cid = new ClientIdentity(ctx.stub);
        switch (payload.type) {
            case "userRequest": {
                const isStakeholderRevoked = await isInvokerStakeholderRevoked(
                    ctx
                );
                if (isStakeholderRevoked.condition)
                    return Shim.error(isStakeholderRevoked.message);

                const { parameter, bookmark } = payload;

                const LSCInstance =
                    chaincodeInstances.LSC.getUserRequestLog(ctx);

                await LSCInstance.makeContact([{ parameter, bookmark }]);

                const [response, responseErr] = [
                    LSCInstance.response,
                    LSCInstance.error,
                ];

                if (responseErr) return Shim.error(responseErr);

                return Shim.success(Buffer.from(JSON.stringify(response)));
            }
            case "activeElectionsAPI": {
                const [apiActiveElections, apiActiveElectionsErr] =
                    await promiseHandler(
                        getActiveStakeholderElectionsAPI(
                            ctx,
                            cid.getMSPID(),
                            true
                        )
                    );

                if (apiActiveElectionsErr)
                    return Shim.error(apiActiveElectionsErr.message);

                return Shim.success(
                    Buffer.from(JSON.stringify(apiActiveElections))
                );
            }
            case "activeElectionsOfStakeholder": {
                const isStakeholderRevoked = await isInvokerStakeholderRevoked(
                    ctx
                );
                if (isStakeholderRevoked.condition)
                    return Shim.error(isStakeholderRevoked.message);

                const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"]]);
                if (!hasAccessToFN.hasAccess)
                    return Shim.error(hasAccessToFN.message);

                const stakeholderElections = await getBallotsOfStakeholder(
                    ctx,
                    cid.getMSPID()
                );
                return Shim.success(
                    Buffer.from(JSON.stringify(stakeholderElections))
                );
            }
            case "isActiveElection": {
                // Should only allow access to TMSC
                const {
                    parameters: { nonce: electionIDActiveEl, stakeholders },
                } = payload;

                const isActiveData = await isActiveElection(
                    ctx,
                    electionIDActiveEl,
                    stakeholders
                );

                return Shim.success(Buffer.from(JSON.stringify(isActiveData)));
            }
            case "electionInspect": {
                const isStakeholderRevoked = await isInvokerStakeholderRevoked(
                    ctx
                );
                if (isStakeholderRevoked.condition)
                    return Shim.error(isStakeholderRevoked.message);

                const hasAccessToFN = accessAudit(cid, [["CA-ADMIN"]]);
                if (!hasAccessToFN.hasAccess)
                    return Shim.error(hasAccessToFN.message);

                const {
                    parameters: { electionID },
                } = payload;

                const [extraInfo, extraInfoErr] = await promiseHandler(
                    electionExtraInfo(ctx, electionID, cid.getMSPID())
                );

                if (extraInfoErr) return Shim.error(extraInfoErr);

                return Shim.success(Buffer.from(JSON.stringify(extraInfo)));
            }

            default:
                return Shim.error(`Unknown request type ${payload.type}`);
        }
    }

    /**
     * `getDataFromBC` can be utilized in order to get the data of a successful request that
     * was made by a Client of an organization. It accepts a `payload` that is an Object with a root key that defines
     * the request ID of the request that the Client wants to fetch the data for. Thus, the `payload` contains:
     * - the request ID as requestID
     *
     * `getDataFromBC` takes this `request ID` and forwards it to the LSC chaincode.
     * The LSC inspects the request ID in order to find out if the request:
     * - belongs to the invoker of the function
     * - is fulfilled
     * - is approved
     *
     * If all of the above criteria are met, then `getDataFromBC` gets the data of the request from the private
     * collection of the organization that the Client belongs to and returns it to the Client.
     *
     * If the criteria are not met or the LSC cannot complete the request, then `getDataFromBC` throws an error.
     * @param {*} ctx
     * @param {*} payload
     */
    async getDataFromBC(ctx, payload) {
        const isStakeholderRevoked = await isInvokerStakeholderRevoked(ctx);
        if (isStakeholderRevoked.condition)
            return Shim.error(isStakeholderRevoked.message);

        const { requestID } = JSON.parse(payload);
        const cid = new ClientIdentity(ctx.stub);

        // const cid = new ClientIdentity(ctx.stub);

        // First, we ask the LSC to provide us with the request's data (requestID), in order to authenticate that the user possess this requestID
        const LSCInstance = chaincodeInstances.LSC.getUserRequestLog(ctx);

        await LSCInstance.makeContact([{ parameter: requestID }]);

        const [response, responseErr] = [
            LSCInstance.response,
            LSCInstance.error,
        ];

        if (responseErr) return Shim.error(responseErr);

        if (response.length === 0 || !response)
            return Shim.error(
                `Either you are not eligible to access the data or the request ID is unknown [REQID: ${requestID}]`
            );

        const {
            data: { invoker },
            info: { fulfilled, approved, accessibleUntil },
        } = jsonParser(response.recordsData[0]);

        if (matchStrings(deriveIdCNFromCID(cid), invoker, true))
            return Shim.error(
                `You are not eligible to access the data [REQID: ${requestID}]`
            );

        if (!fulfilled)
            return Shim.error(
                `The request has not been fulfilled yet, please try again later [REQID: ${requestID}]`
            );

        if (!approved)
            return Shim.error(
                `The request was not approved [REQID: ${requestID}]`
            );

        if (
            timestampToMilliseconds(ctx.stub.getTxTimestamp()) > accessibleUntil
        )
            return Shim.error(
                `You are not eligible to access the data. Access ended at: ${new Date(
                    accessibleUntil
                ).toString()} [REQID: ${requestID}] - `
            );

        let requestedData;
        const privateMSPCollection = buildCollectionName(ctx, cid.getMSPID());
        // const verifiedClient = verifyClientOrgMatchesPeerOrg(
        //     ctx,
        //     cid.getMSPID()
        // );

        try {
            requestedData = await ctx.stub.getPrivateData(
                privateMSPCollection,
                requestID
            );
            // await ctx.stub.deletePrivateData(PRIVATE_COLLECTION, reqID); // Should be used in production
        } catch (err) {
            return Shim.error(
                `Internal error, could not find the requested data [REQID: ${requestID}]`
            );
        }

        // if (!requestedData || requestedData.length === 0) {
        //     // Check if the data still exists (the data is deleted after an invocation)
        //     return Shim.error(
        //         `The data is no longer available [REQID: ${reqID}]`
        //     );
        // }
        return Shim.success(requestedData);
    }
}

module.exports = PSC;
