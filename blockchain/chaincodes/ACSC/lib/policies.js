"use strict";

const {
    getTemporalRolesOfOrgMSP,
    checkIfActiveEmployee,
    defineAccess,
} = require("./helper");

const { accessNestedJSON } = require("./utils/utils");

const policyEnforcer = (
    ctx,
    currentTimestamp,
    dataID,
    verifiedAttributes,
    accessOptions,
    requestDetails
) => {
    const ROLES = verifiedAttributes.ROLES || {};

    requestDetails.data_type = Object.keys(dataID)[0];
    requestDetails.data_value = dataID[requestDetails.data_type].parameters;
    requestDetails.organization =
        dataID[requestDetails.data_type].organization ||
        "No organization defined";

    switch (requestDetails.data_type) {
        case "data_00": {
            //POSTER: Doctor - TARGET: Hospitals
            const patientUUID = requestDetails.data_value.uuid;
            Object.keys(ROLES).some((ORGANIZATION_MSP) => {
                const TEMPORALROLES = getTemporalRolesOfOrgMSP(
                    verifiedAttributes,
                    ORGANIZATION_MSP
                );

                let isOnDuty = false;
                const patients =
                    accessNestedJSON(TEMPORALROLES, "DOCTOR_OF", "DATA") || [];

                const hasPatient = patients.includes(patientUUID);

                if (!hasPatient)
                    isOnDuty = checkIfActiveEmployee(
                        currentTimestamp,
                        TEMPORALROLES,
                        "DOCTOR"
                    );

                defineAccess(
                    hasPatient || isOnDuty.state ? true : false,
                    hasPatient ? "static" : "dynamic",
                    hasPatient ? null : isOnDuty.until,
                    accessOptions
                );

                return accessOptions.accessGranted;
            });

            break;
        }
        case "data_01": //POSTER: Technician - TARGET: Manufacturer
            if (!requestDetails.organization) break;
            Object.keys(ROLES).some((ORGANIZATION_MSP) => {
                if (ROLES[ORGANIZATION_MSP].TECHNICIAN) {
                    const TEMPORALROLES = getTemporalRolesOfOrgMSP(
                        verifiedAttributes,
                        ORGANIZATION_MSP
                    );
                    const isOnDuty = checkIfActiveEmployee(
                        currentTimestamp,
                        TEMPORALROLES,
                        "TECHNICIAN"
                    );

                    defineAccess(
                        isOnDuty.state,
                        "dynamic",
                        isOnDuty.until,
                        accessOptions
                    );

                    return accessOptions.accessGranted;
                }
                return false;
            });
            break;
        case "data_02": //POSTER: Researcher - TARGET: Manufacturer
            if (!requestDetails.organization) break;
            Object.keys(ROLES).some((ORGANIZATION_MSP) => {
                if (ROLES[ORGANIZATION_MSP].RESEARCHER) {
                    const TEMPORALROLES = getTemporalRolesOfOrgMSP(
                        verifiedAttributes,
                        ORGANIZATION_MSP
                    );

                    const isOnDuty = checkIfActiveEmployee(
                        currentTimestamp,
                        TEMPORALROLES,
                        "RESEARCHER"
                    );

                    defineAccess(
                        isOnDuty.state,
                        "dynamic",
                        isOnDuty.until,
                        accessOptions
                    );

                    return accessOptions.accessGranted;
                }
                return false;
            });
            break;
        case "data_03": //POSTER: Researcher - TARGET: Hospitals
            Object.keys(ROLES).some((ORGANIZATION_MSP) => {
                if (ROLES[ORGANIZATION_MSP].RESEARCHER) {
                    const TEMPORALROLES = getTemporalRolesOfOrgMSP(
                        verifiedAttributes,
                        ORGANIZATION_MSP
                    );

                    const isOnDuty = checkIfActiveEmployee(
                        currentTimestamp,
                        TEMPORALROLES,
                        "RESEARCHER"
                    );

                    defineAccess(
                        isOnDuty.state,
                        "dynamic",
                        isOnDuty.until,
                        accessOptions
                    );

                    return accessOptions.accessGranted;
                }
                return false;
            });
            break;
        case "data_04": //POSTER: Manufacturing_Staff - TARGET: Hospitals
            Object.keys(ROLES).some((ORGANIZATION_MSP) => {
                if (ROLES[ORGANIZATION_MSP].MANUFACTURING_STAFF) {
                    defineAccess(true, "static", null, accessOptions);
                    return accessOptions.accessGranted;
                }
                return false;
            });

            break;
        default:
            ctx.stub.setEvent(
                "PolicyEnforcementDeclined",
                Buffer.from(JSON.stringify(false))
            );
    }
};

module.exports = {
    policyEnforcer: policyEnforcer,
};
