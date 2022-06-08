"use strict";

const { Contract, Context } = require("fabric-contract-api");
const { Shim, ClientIdentity } = require("fabric-shim");
const Election = require("./types/elections/election");
const ElectionManager = require("./types/elections/electionManager");
const RecordManager = require("./types/records/recordManager");
const Event = require("./utils/helper/events");
const constants = require("./utils/constants");
const {
    getClientMSP,
    accessAudit,
    isInvokerStakeholderRevoked,
} = require("./helper");
const {
    jsonParser,
    timestampToMilliseconds,
    timestampToDate,
    promiseHandler,
    bufferResponse,
    matchStrings,
    deriveIdCNFromCID,
    constructMetadataResponse,
} = require("./utils/utils");
const Record = require("./types/records/record");

class LSCContext extends Context {
    constructor() {
        super();
        this.electionManager = new ElectionManager(this);
        this.recordManager = new RecordManager(this);
    }
}

class LSC extends Contract {
    createContext() {
        return new LSCContext();
    }
    // The role of the LSC is to maintain a global transaction
    // log that cannot be tampered, provided that a majority of
    // stakeholders from all domains is honest. As observed above,
    // the Logging Smart Contract is triggered any time a transac-
    // tion is processed. When a user request is received, the PSC
    // will trigger the LSC to open a transaction log. A logging
    // verification variable is attached to each request, forcing the
    // logging of every event, processed either in the PBC or in a
    // Domain BC. To avoid maintaining open logs in the PBC until
    // a response is received by the appropriate DBC, the Logging
    // SC caches a request when this is received; when a transaction
    // is complete, then the LSC will store the complete transaction
    // details in the PBC.

    // Triggered by the PSC when a request is made. Returns a
    // logging verification variable
    // Actuator: PSC
    // Input: request details
    // output: true/false
    // const request_details = {
    //     txID: txID,
    //     invoker: invoker,
    //     request_detail_1: userCerts,
    //     request_detail_2: data_id,
    //     fulfilled: false
    // };

    /**
     * `requestLog` is invoked when a Client makes a request.
     * `requestLog` is invoked by the `requestAccess` function of the PSC chaincode.
     * It accepts a `requestDetails` payload, which is thorougly described at the `requestAccess`
     * function of the PSC.
     * Upon logging completion, `requestLog` returns `true` to the caller function if the logging of the request was
     * successful, or `false` if:
     * - an error occured
     * - the request can not be logged for any other reason
     * @param {*} ctx
     * @param {*} requestDetails
     */
    async requestLog(ctx, requestDetails) {
        const cid = new ClientIdentity(ctx.stub);
        const organization = cid.getMSPID();
        const invoker = deriveIdCNFromCID(cid);

        const [domain, domainError] = await promiseHandler(getClientMSP(ctx));

        if (domainError) return Shim.error(domainError);

        const requestInstance = Record.createInstance(
            timestampToMilliseconds(ctx.stub.getTxTimestamp()),
            constants.REQUEST_LOG,
            { domain, organization, invoker },
            requestDetails
        );
        requestInstance.prepareNewRecord();

        try {
            await ctx.recordManager.add(requestInstance);
            return Shim.success(Buffer.from(JSON.stringify(true)));
        } catch (err) {
            return Shim.error(JSON.stringify(false));
        }
    }

    /**
     * `updateLog` is triggered by the TMSC when a CA-Admin updates the Certificate/CRL/Temporal ACL
     * of their Organization
     *
     * It accepts an `updateDetails` parameter, which holds all the information that is crucial to log the update.
     * `updateDetails` is a JSON object that holds the:
     * - domain of the stakeholder as domain (e.g. MEDICAL)
     * - subject which is the name of the organization as subject (e.g. Attikon_hospital)
     * - the document's type as docType (e.g. ACL)
     * - the transaction ID of the update as txID
     * - the invoker that made the update as invoker
     * - the invoker's MSP organization as invokerMSP (e.g. Attikon_hospitalMSP)
     * - the dataHash of the document as dataHash (e.g. hash(ACL))
     * - the time that the update operation took place as invocationTime
     *
     * `updateLog` does not create new/distinct documents at the couchDB. It updates the existing document, if it exists,
     * with the newly proposed `document information`. If a document (e.g. a Certificate) does not exist, only then it creates a new
     * document record. Otherwise, it updates the current record.
     *
     * if (recordUpdateNr > 1) {
     *      await ctx.recordManager.updateInstance(recordInstance);
     * } else {
     *      await ctx.recordManager.add(recordInstance);
     * }
     *
     * Upon successful operation, it returns `true`.
     * If the operation was not successful or an error occured, it returns `false`.
     *
     * @param {*} ctx
     * @param {*} updateDetails
     */
    async updateLog(ctx, updateDetails) {
        updateDetails = JSON.parse(updateDetails);

        const {
            domain,
            subject,
            docType,
            txID,
            invoker,
            invokerMSP,
            dataHash,
            invocationTime,
        } = updateDetails;

        const prepareInfo = {
            type: constants.UPDATE_LOG,
            values: { domain, subject: subject.toUpperCase(), docType },
            data: {
                txID,
                invoker,
                invokerMSP,
                dataHash,
                invocationTime,
            },
        };

        const updateKey = Record.makeKey([
            prepareInfo.type,
            ...Object.values(prepareInfo.values),
        ]);

        let recordInstance = await ctx.recordManager.get(updateKey);

        if (!recordInstance) {
            recordInstance = Record.createInstance(
                timestampToMilliseconds(ctx.stub.getTxTimestamp()),
                prepareInfo.type,
                prepareInfo.values,
                prepareInfo.data
            );
            recordInstance.prepareNewRecord();
        } else {
            recordInstance.raiseUpdateNr();
        }

        try {
            const recordUpdateNr = recordInstance.getRecordUpdateNr();
            if (recordUpdateNr > 1) {
                await ctx.recordManager.updateInstance(recordInstance);
            } else {
                await ctx.recordManager.add(recordInstance);
            }
        } catch (err) {
            return Shim.error(JSON.stringify(false));
        }
        return Shim.success(Buffer.from(JSON.stringify(true)));
    }

    /**
     * `updateRequestLog` is triggered by the PSC and the `updateFromDBC` function when a request is completed.
     * It is invoked in order to update an existing `request` record.
     * The provided payload, `data`, includes:
     * - the invoker as invoker
     * - the request ID as reqID
     * - the approval of the request as approved
     *
     * When called, `updateRequestLog` takes the provided `request ID` and updates the already logged (request) record, with the provided `request ID`, as fulfilled.
     * When `Fulfilled` is true it means that the request was completed.
     * It also changes the `request's` `approved` indicator to the value of the provided `approved`.
     *
     * Upon successful operation, it returns `true`.
     * If the operation was not successful or an error occured, it returns `false`.
     *
     * @param {*} ctx
     * @param {*} data
     */
    async updateRequestLog(ctx, data) {
        const cid = new ClientIdentity(ctx.stub);
        data = JSON.parse(data);
        const { invoker, reqID: requestID, approved, accessibleUntil } = data;
        const orgMSP = cid.getMSPID();

        const [domain, domainError] = await promiseHandler(getClientMSP(ctx));
        if (domainError) return Shim.error(domainError.message);

        const recordKey = Record.makeKey([
            constants.REQUEST_LOG,
            domain,
            orgMSP,
            invoker,
            requestID,
        ]);
        const recordInstance = await ctx.recordManager.get(recordKey);

        if (
            recordInstance &&
            matchStrings(requestID, recordInstance.recordInfo.requestID)
        ) {
            recordInstance.setApproval(approved);
            recordInstance.setAccessibleUntil(accessibleUntil);
            recordInstance.setFulfilled();

            try {
                await ctx.recordManager.updateInstance(recordInstance);
                return Shim.success(Buffer.from(JSON.stringify(true)));
            } catch (err) {
                return Shim.error(JSON.stringify(false));
            }
        }
        return Shim.success(Buffer.from(JSON.stringify(false)));
    }

    /**
     * Clients may access their requests through the `syncEntityWithBC` function that is implemented
     * at the PSC chaincode.
     *
     * When a Client wants to access their requests, they invoke the `syncEntityWithBC` function. Then, the PSC
     * invokes the `getUserRequestLog` and fetches the Client's requests.
     * If a `requestID` is included with the request, then `getUserRequestLog` returns the information of only that
     * request. Otherwise, if a `requestID` is not provided, it fetches the client's requests in batches.
     * For this reason, `getUseRequestLog`, also accepts a `pageSize` parameter as well as a `bookmark` parameter, in order to
     * fetch the last X records (where X = pageSize) every time that the `getUserRequestLog` is invoked. The bookmark parameter is used as an
     * index.
     *
     * An example of a payload can be:
     * - requestID as parameter
     * - pageSize as pageSize
     * - bookmark as bookmark
     * @param {*} ctx
     * @param {*} payload
     */
    async getUserRequestLog(ctx, payload) {
        const cid = new ClientIdentity(ctx.stub);
        const orgMSP = cid.getMSPID();
        const invoker = deriveIdCNFromCID(cid);

        const {
            parameter: requestID,
            pageSize = 20,
            bookmark = "",
        } = JSON.parse(payload);

        const [domain, domainError] = await promiseHandler(getClientMSP(ctx));

        if (domainError) return Shim.error(domainError.message);

        let [results, responseMetadata] = [null, null];
        if (requestID) {
            const recordKey = Record.makeKey([
                constants.REQUEST_LOG,
                domain,
                orgMSP,
                invoker,
                requestID,
            ]);
            results = await ctx.recordManager.get(recordKey);
            responseMetadata = constructMetadataResponse(false, 1, "-");
        } else {
            const queryString = {
                selector: {
                    recordInfo: {
                        parameters: { invoker },
                        type: constants.REQUEST_LOG,
                    },
                },
                sort: [{ created_at: "desc" }],
                use_index: ["created_at"],
            };
            const query =
                await ctx.recordManager.queryInstanceWithSelectorAndPagination(
                    queryString,
                    pageSize,
                    bookmark
                );
            ({ results, responseMetadata } = query);
        }

        if (!results) return Shim.error("Unknown Request ID");

        const recordsData = [];
        if (Array.isArray(results)) {
            // If !reqID (i.e. null), it returns an array with all the records
            for (const value of results)
                recordsData.push(value.Record.recordData);
        } else {
            recordsData.push(results.recordData);
        }

        return Shim.success(
            Buffer.from(
                JSON.stringify({
                    recordsData,
                    metadata: responseMetadata,
                })
            )
        );
    }

    /**
     * When Auditors want to access the Logs of the Proxy BC, they need to invoke the `retrieveLogInit` function.
     * They should provide the `retrieveLogInit` function with the `retrieveDetails` payload, which is a JSON Object that includes:
     * - the type of the Logs as type (e.g. REQUEST_LOG / UPDATE_LOG)
     * - the domain of the Logs as domain (e.g. PROXY / MEDICAL / MANUFACTURER)
     * e.g. retrieve_details: { domain: "PROXY", type: "REQUEST_LOG" }
     * By defining `PROXY` as the domain, they can have access to the logs that were created by all the domains (MEDICAL + MANUFACTURER domains).
     * `retrieveLogInit` first checks if both the `type` and the `domain` are available. If one of them is not known by the System, then
     * `retrieveLogInit` throws an error.
     * Then, `requestData` is constructed. `requestData` is a JSON Object that holds all the crucial information that is needed
     * in order to approve access to the Logs. `requestData` holds:
     * - the type of the request as type
     * - the domain of the request as audience
     * - the invoker's MSP as msp
     * - the status of the request as status, meaning if the request was fulfilled
     * - the approval of the request as approved, meaning if the request was approved
     * - the time until which the Auditor can have access to the Logs, as validUntil
     *
     * After defining the `requestData`, `retrieveLogInit` invokes the `majorityConsentInit` function at the PSC
     * in order to start a new Election. If the PSC was not able to start an Election, an error is thrown. Otherwise,
     * `retrieveLogInit` receives the Election ID from the PSC and saves the information of the request, along with the
     * Election ID, to the ledger. It then emits an `Election Initiated` event in order to inform the Inter-Blockchain API
     * about the newly created Election.
     * @param {*} ctx
     * @param {*} retrieveDetails
     * @returns
     */
    async retrieveLogInit(ctx, retrieveDetails) {
        const isStakeholderRevoked = await isInvokerStakeholderRevoked(ctx);
        if (isStakeholderRevoked.condition)
            return Shim.error(isStakeholderRevoked.message);

        const cid = new ClientIdentity(ctx.stub);

        const hasAccessToFN = accessAudit(cid, [["AUDITOR"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const invokerMSPID = cid.getMSPID();
        retrieveDetails = JSON.parse(retrieveDetails.toString());

        const type = retrieveDetails.type;
        const domain = retrieveDetails.domain.toUpperCase();

        const isDomainAvailable = new RegExp(
            constants.AVAILABLE_DOMAINS.join("|"),
            "i"
        );

        if (!isDomainAvailable.test(domain))
            return Shim.error(
                `Unknown domain - ${domain} is unknown to the System`
            );

        if (
            !new RegExp(constants.AVAILABLE_REQUEST_TYPES.join("|"), "i").test(
                type
            )
        )
            return Shim.error(
                `Unknown request type - ${type} is unknown to the System`
            );

        const requestData = {
            type: type,
            audience: domain,
            auditor: deriveIdCNFromCID(cid),
            msp: invokerMSPID,
            status: false,
            approved: false,
            validUntil: null,
        };

        const electionInstance = Election.createInstance(
            "logs",
            domain,
            requestData,
            `Access to Logs by ${invokerMSPID}`,
            {}
        );

        const [pscData, pscError] = await ctx.electionManager.startElection(
            cid,
            electionInstance
        );

        if (pscError) return Shim.error(pscError);

        electionInstance.setElectionID(pscData);

        electionInstance.createStateKey([
            constants.RETRIEVE_LOG_REQUEST,
            cid.getMSPID(),
            electionInstance.electionInfo.electionID,
        ]);

        electionInstance.setDataNonce(electionInstance.electionInfo.electionID);

        await ctx.electionManager.add(electionInstance);

        new Event(ctx, "ElectionInitiated", pscData).assignEvent();

        return Shim.success(
            bufferResponse(
                true,
                `Successfully started an Election [Election ID: ${electionInstance.electionInfo.electionID}]`
            )
        );
    }

    /**
     * When an Election ends (because of majority, or time end), PSC calls this function in order
     * to inform the LSC that an Election has finished. Based on the Election's outcome, LSC updates some
     * values of the request's data.
     *
     * The payload is a JSON object which holds the:
     *   ▪ electionID, the election’s ID
     *   ▪ electionApproved, the election’s outcome
     *   ▪ canStillReachConsensus, if majority has not been reached yet, it means that it is probable that the Election may end positively
     *   ▪ creator, which is the Organization's MSP
     * If both the electionApproved and the canStillReachConsensus are false, then LSC updates the request's data to:
     * - status: true
     * - approved: false
     * Otherwise, if the electionApproved is true, then it sets the request's data as:
     * - status: true,
     * - approved: true,
     * - validUntil: the time until the Logs can be accessible by the Auditor that initiated the Election
     * @param {*} ctx
     * @param {*} payload
     * @returns
     */
    async majorityUpdate(ctx, payload) {
        // Should be executed by the PSC

        const {
            electionID,
            electionApproved,
            canStillReachConsensus,
            creator, // = Creator Org (MSP)
        } = jsonParser(payload);

        const electionKey = Election.makeKey([
            constants.RETRIEVE_LOG_REQUEST,
            creator,
            electionID,
        ]);

        const electionInstance = await ctx.electionManager.get(electionKey);

        if (electionApproved) {
            const currentTime = timestampToMilliseconds(
                ctx.stub.getTxTimestamp()
            );
            electionInstance.data.status = true;
            electionInstance.data.approved = true;
            electionInstance.data.validUntil = new Date(
                currentTime + 24 * 60 * 60 * 1000
            ); // This is valid for 1 day - e.g. for 3 days: 3 * 24 * 60 * 60 * 1000 = 3 days
        } else {
            if (!canStillReachConsensus) {
                electionInstance.data.status = true;
                electionInstance.data.approved = false;
            }
        }

        await ctx.electionManager.updateInstance(electionInstance);

        return Shim.success(
            Buffer.from(
                bufferResponse(
                    true,
                    `The Election finished successfully [REQID: ${electionID}]`
                )
            )
        );
    }

    /**
     * When an auditor wants to list their `Access Logs` requests, they can invoke the `syncAudits`
     * function. This function accepts a payload which holds:
     * - a request ID as parameter
     * If no parameter is passed with the `payload`, then the Auditor can fetch their requests in batches.
     * Otherwise, if a parameter is passed, then the Auditor can get the information of this particular request ID.
     *
     * `syncAudits` gets the available audits of an Auditor by utilizing the MSPID and the ID of the Auditor.
     *
     * const [invokerMSPID, invokerID] = [cid.getMSPID(), cid.getCertCN()];
     *
     *  if (!requestID) {
     *     const query = { selector: { data: { auditor: invokerID } } };
     *     const electionResults =
     *         await ctx.electionManager.queryInstanceWithSelector(query);
     *
     *     electionResults.forEach((item) => orgAudits.push(item.Record.data));
     *  } else {
     *     const electionKey = Election.makeKey([
     *        constants.RETRIEVE_LOG_REQUEST,
     *         invokerMSPID,
     *         requestID,
     *    ]);
     *
     *     const electionInstance = await ctx.electionManager.get(electionKey);
     *
     *    if (electionInstance && electionInstance.data.auditor === invokerID)
     *        orgAudits.push(electionInstance.data);
     *  }
     *
     * @param {*} ctx
     * @param {*} payload
     */
    async syncAudits(ctx, payload) {
        const isStakeholderRevoked = await isInvokerStakeholderRevoked(ctx);
        if (isStakeholderRevoked.condition)
            return Shim.error(isStakeholderRevoked.message);

        const cid = new ClientIdentity(ctx.stub);

        const { parameter: requestID } = JSON.parse(payload);

        const hasAccessToFN = accessAudit(cid, [["AUDITOR"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const [invokerMSPID, invokerID] = [
            cid.getMSPID(),
            deriveIdCNFromCID(cid),
        ];

        let orgAudits = [];

        if (!requestID) {
            const query = { selector: { data: { auditor: invokerID } } };
            const electionResults =
                await ctx.electionManager.queryInstanceWithSelector(query);

            electionResults.forEach((item) => orgAudits.push(item.Record.data));
        } else {
            const electionKey = Election.makeKey([
                constants.RETRIEVE_LOG_REQUEST,
                invokerMSPID,
                requestID,
            ]);

            const electionInstance = await ctx.electionManager.get(electionKey);

            if (electionInstance && electionInstance.data.auditor === invokerID)
                orgAudits.push(electionInstance.data);
        }

        if (requestID && orgAudits.length === 0)
            return Shim.error(
                `Unknown request ID or insufficient rights to access [REQUEST ID: ${requestID}]`
            );

        return Shim.success(Buffer.from(JSON.stringify(orgAudits)));
    }

    /**
     * When the Auditors want to retrieve the Logs of the Proxy BC
     * they should utilize the `retrieveLogs` function.
     *
     * `retrieveLogs` accepts a `requestData` payload which holds:
     * - the request ID of the request as `requestID`
     * - the pageSize, which is the number of the requests to fetch, as `pageSize`
     * - a bookmark that is used as an index, as `bookmark`
     *
     * Upon accessing the `requestData`, `retrieveLogs` checks if there has been an Election with
     * the provided requestID and that is owned by the invoker's Organization MSP. If no Election was found
     * then an error is thrown. Otherwise, `retrieveLogs` performs a series of checks in order to investigate
     * if the Auditor can access the Logs and if the access period is not over.
     * - If one of the checks was not successful or the access period is over, then an error is thrown.
     * - If all the checks were passed and the access period is still active, then the auditor
     * gets the Logs.
     *
     * All these checks are carried out whenever the auditor refreshes them or tries to fetch more.
     *
     * @param {*} ctx
     * @param {*} requestData
     */
    async retrieveLogs(ctx, requestData) {
        const isStakeholderRevoked = await isInvokerStakeholderRevoked(ctx);
        if (isStakeholderRevoked.condition)
            return Shim.error(isStakeholderRevoked.message);

        const cid = new ClientIdentity(ctx.stub);
        const invokerMSPID = cid.getMSPID();

        const hasAccessToFN = accessAudit(cid, [["AUDITOR"]]);
        if (!hasAccessToFN.hasAccess) return Shim.error(hasAccessToFN.message);

        const {
            requestID,
            pageSize = 50,
            bookmark = "",
        } = jsonParser(requestData);

        if (!requestID) return Shim.error("A Request ID is required");

        const electionKey = Election.makeKey([
            constants.RETRIEVE_LOG_REQUEST,
            invokerMSPID,
            requestID,
        ]);

        const electionInstance = await ctx.electionManager.get(electionKey);

        const electionData = electionInstance
            ? electionInstance.data
            : undefined;

        if (!electionData)
            return Shim.error(
                `Unknown Request ID or insufficient rights to access [REQUEST ID: ${requestID}]`
            );

        const { auditor, msp, status, approved, validUntil, audience, type } =
            electionData;

        if (msp !== cid.getMSPID())
            return Shim.error(
                `Your are not eligible to access the Election with ID ${requestID}. Your Organization does not own this Audit [OWNER ORGANIZATION: ${msp}]`
            );

        if (auditor !== deriveIdCNFromCID(cid))
            return Shim.error(
                `You are not eligible to access the Election with ID ${requestID}. This Audit belongs to another Auditor of your Organization`
            );

        if (!status)
            return Shim.error(
                `The Election with ID ${requestID} has not ended yet`
            );

        if (!approved)
            return Shim.error(
                `Organizations did not approve access to the Logs [REQUEST ID: ${requestID}]`
            );

        if (new Date(validUntil) < timestampToDate(ctx.stub.getTxTimestamp()))
            return Shim.error(
                `You can not access the Logs of the Election with ID ${requestID}. The Audit period has ended at ${validUntil}. In order to access the Logs, make a new Request`
            );

        const queryString = {
            selector: {
                recordInfo: { type },
            },
            sort: [{ created_at: "desc" }],
            use_index: ["created_at"],
        };

        if (audience !== "PROXY")
            queryString.selector.recordInfo["parameters"] = {
                domain: audience,
            };

        const query =
            await ctx.recordManager.queryInstanceWithSelectorAndPagination(
                queryString,
                pageSize,
                bookmark
            );

        const { results, responseMetadata } = query;

        const logs = [];
        results.forEach((log) => {
            logs.push(log.Record);
        });

        return Shim.success(
            Buffer.from(
                JSON.stringify({
                    type,
                    logs,
                    responseMetadata,
                })
            )
        );
    }
}

module.exports = LSC;
