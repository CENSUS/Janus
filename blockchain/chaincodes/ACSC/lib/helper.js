"use strict";

const Record = require("./types/records/record");
const constants = require("./utils/constants");
const { weekdays } = require("./utils/constants");
const {
    accessNestedJSON,
    timeReg,
    hasher,
    timestampToDate,
} = require("./utils/utils");

const getTemporalRolesOfOrgMSP = (verifiedAttributes, organizationMSP) =>
    verifiedAttributes.TEMPORALROLES[organizationMSP]
        ? verifiedAttributes.TEMPORALROLES[organizationMSP]
        : {};

const defineAccess = (isActive, type, accessUntil, accessOptions) => {
    if (isActive) {
        accessOptions.type = type;
        accessOptions.accessGranted = true;
        switch (type) {
            case "static":
                break;
            case "dynamic":
                accessOptions.onDutyUntil = accessUntil;
                break;
        }
    }

    return;
};

const constructResponseData = (
    currentTimestamp,
    requestData,
    addToCurrentTime = null,
    accessUntilTimestamp = null
) => {
    const currentDate = timestampToDate(currentTimestamp);
    // If the seconds/milliseconds aren't updated, then the access will be extended by the seconds/milliseconds of the `currentTimestamp`! - We do not want that!
    // Only if `addToCurrentTime` is not provided and in order to make it fair for the client that submitted the request,
    // then and only then take into account the actual "seconds" that refer to the time that the Request was received by the ACSC
    addToCurrentTime && currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);

    const clearedTimestamp = currentDate.getTime();

    const accessibleUntil =
        accessUntilTimestamp ||
        clearedTimestamp + (addToCurrentTime || 1800000); // If `addToCurrentTime` milliseconds is not provided, add +0.5 hour of access

    return { data: requestData, accessibleUntil };
};

const checkIfActiveEmployee = (currentTimestamp, TEMPORALROLES, TYPE) => {
    let isOnDuty = { state: false, until: null };

    const workingDaysAndHours = accessNestedJSON(
        TEMPORALROLES,
        `${TYPE}_WORK_SHIFT`,
        "DATA"
    );

    if (workingDaysAndHours) {
        let date = timestampToDate(currentTimestamp);
        let currentDay = weekdays[date.getDay()];
        let currentDayWorkingHours = workingDaysAndHours[currentDay];

        if (currentDayWorkingHours) {
            const currentTime = date.getHours() * 60 + date.getMinutes();

            for (let hours of currentDayWorkingHours) {
                let from = accessNestedJSON(hours, "FROM");
                let to = accessNestedJSON(hours, "TO");

                if (from.match(timeReg) && to.match(timeReg)) {
                    [from, to] = [from.split(":"), to.split(":")];
                } else {
                    break;
                }

                from = parseInt(from[0], 10) * 60 + parseInt(from[1], 10);
                to = parseInt(to[0], 10) * 60 + parseInt(to[1], 10);
                if (from >= to) {
                    break;
                } else if (from <= currentTime && currentTime <= to) {
                    isOnDuty.state = true;
                    isOnDuty.until = (to - currentTime) * 60000; // UntilTime - CurrentTime * 60.000 outputs the remaining time until the access is still valid
                    break;
                }
            }
            return isOnDuty;
        }
    }
    return isOnDuty;
};

// Triggered by the ACSC when policy enforcement
// over a request is made. Logs the transaction
// details on the Domain BC.
// Input: policy_enforcement_details
// Output: logs
const accessLog = async (ctx, policy_enfc_details) => {
    const nonce = ctx.stub.getTxID();

    const accessHash = hasher("sha1")
        .update(Buffer.from(JSON.stringify({ nonce, policy_enfc_details })))
        .digest("hex");

    const { policyEnforcementDetails, GID } = policy_enfc_details;

    const recordInstance = Record.createInstance(
        constants.ACSC_LOGS,
        policyEnforcementDetails.data_type,
        GID,
        accessHash,
        policyEnforcementDetails
    );

    try {
        await ctx.recordManager.add(recordInstance);
    } catch (err) {
        return false;
    }

    return recordInstance;
};

module.exports = {
    checkIfActiveEmployee,
    getTemporalRolesOfOrgMSP,
    accessLog: accessLog,
    constructResponseData: constructResponseData,
    defineAccess: defineAccess,
};
