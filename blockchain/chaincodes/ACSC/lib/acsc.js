"use strict";

const { Contract, Context } = require("fabric-contract-api");
const { Shim } = require("fabric-shim");
const { accessLog, constructResponseData } = require("./helper.js");
const { jsonParser, bufferResponse } = require("./utils/utils.js");
const chaincodeInstances = require("./utils/helper/interChaincode/preconfiguredInstances.js");
const Event = require("./utils/helper/events.js");
const RecordManager = require("./types/records/recordManager.js");
const { policyEnforcer } = require("./policies.js");
const { ACCESS_OPTIONS, REQUEST_DETAILS } = require("./utils/objects.js");

class ACSCContext extends Context {
    constructor() {
        super();
        this.recordManager = new RecordManager(this);
    }
}

class ACSC extends Contract {
    createContext() {
        return new ACSCContext();
    }

    /**
     * When a request to access data is made by a Client, Inter-Blockchain forwards the
     * request to the `policyEnf` function of the ACSC chaincode.
     *
     * `policyEnf` accepts these arguments:
     * - verified_attributes, which holds the verified roles and temporal roles of a Client
     *   and their GID
     * - data_id, which defines a request
     *
     * ACSC then:
     * - derives the available Roles from the `verified_attributes`
     * - analyzes/separates the provided `data_id` to usable, by it, parts (dataIDType, dataIDParameters, dataIDOrganization: if any)
     *
     * Then, based on the derived `dataIDType` and `Roles`, it proceeds to find out if the request should be forwarded to the KSSC chaincode.
     * Every `dataIDType` needs a specific role, e.g. `data_00` needs a `Doctor` role to be available in order to proceed.
     * If the required `Role` is found, then `policyEnf` will proceed by carrying out all the other crucial checks that are
     * needed in order to forward the request to the KSSC.
     *
     * For example, if the `dataIDType` is `data_00` and a `Doctor` role is found, ACSC will then try to get the temporal roles of the Client,
     * under the Organization that the `Doctor` role was found.
     * For this example, the `temporal roles` are needed in order to:
     * - find out if the `Doctor` is the treating doctor of the patient for whom the Client wants to access their records
     * - if the `Doctor` is `on duty`
     *
     * If at least one of the two aforementioned cases is `true`, then the ACSC will set a `shouldForwardToKSSC` variable as `true`
     *
     * Upon checking if the Client is able to access the records, KSSC constructs a `policyEnforcementDetails` JSON Object that will be
     * provided to the `accessLog` function, in order to log the request to the Domain BC.
     * The `policyEnforcementDetails` Object holds the information found below:
     * {
     *      GID,
     *      policyEnforcementDetails: {
     *         data_type: dataIDType,
     *         data_value: dataIDParameters,
     *         organization: dataIDOrganization,
     *         approved: shouldForwardToKSSC,
     *      },
     * }
     *
     * If the logging of the request was not successful or the Client was not approved access to the records, a `Policy Enforcement Declined` event is emitted
     * and ACSC returns to the Inter-Blockchain API (which started the operation) an empty response along with a `false` condition.
     *
     * If the logging of the request was successful and the Client was approved access to the records, a `Policy Enforcement Accepted` event is emitted
     * and the request is forwarded to the KSSC chaincode. Upon receiving the response from the KSSC, ACSC returns the response that it received from
     * the KSSC, along with a `true` condition, back to the Inter-Blockchain API.
     *
     * @param {*} ctx
     * @param {*} verified_attributes
     * @param {*} data_id
     */
    async policyEnf(ctx, verified_attributes, data_id) {
        const currentTimestamp = ctx.stub.getTxTimestamp();

        const [accessOptions, requestDetails] = [
            Object.assign({}, ACCESS_OPTIONS),
            Object.assign({}, REQUEST_DETAILS),
        ];

        const [verifiedAttributes, dataID] = [
            jsonParser(verified_attributes),
            jsonParser(data_id),
        ];

        // Check if the Client can actually access the information
        // It also updates the `accessOptions` and `requestDetails`
        policyEnforcer(
            ctx,
            currentTimestamp,
            dataID,
            verifiedAttributes,
            accessOptions,
            requestDetails
        );

        const { GID } = verifiedAttributes;

        const policyEnforcementDetails = {
            GID,
            policyEnforcementDetails: {
                data_type: requestDetails.data_type,
                data_value: requestDetails.data_value,
                organization: requestDetails.organization,
                approved: accessOptions.accessGranted,
            },
        };

        const loggedReq = await accessLog(ctx, policyEnforcementDetails);

        if (!loggedReq || !accessOptions.accessGranted) {
            new Event(
                ctx,
                "PolicyEnforcementDeclined",
                policyEnforcementDetails
            ).assignEvent();

            const failureResponse = constructResponseData(
                currentTimestamp,
                null
            );

            return Shim.success(bufferResponse(false, failureResponse));
        }

        if (accessOptions.accessGranted) {
            new Event(
                ctx,
                "PolicyEnforcementAccepted",
                policyEnforcementDetails
            ).assignEvent();

            const KSSCInstance = chaincodeInstances.KSSC.requestData(ctx);
            await KSSCInstance.makeContact([data_id, GID]);

            const [requestData, requestDataErr] = [
                KSSCInstance.response,
                KSSCInstance.error,
            ];

            if (requestDataErr) return Shim.error(requestDataErr);

            const successResponse = constructResponseData(
                currentTimestamp,
                requestData,
                accessOptions.onDutyUntil
            );

            return Shim.success(bufferResponse(true, successResponse));
        }

        return Shim.success(bufferResponse(false, null));
    }
}

module.exports = ACSC;
