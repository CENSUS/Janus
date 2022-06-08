"use strict";
const chaincodeInstances = require("./utils/helper/interChaincode/preconfiguredInstances");
const { buildEntityRole } = require("./utils/utils");

// When an Entity wants to invoke a Function, accessAudit checks if the needed Attributes are available
// accessAudit takes as input an array, `neededRoles`
// neededRoles = [[Attribute1, Attribute2], [Attribute3]] => (Attribute1 AND Attribute2) OR (Attribute3)
const accessAudit = (cid, neededRoles) => {
    const canAccess = neededRoles.some((role) =>
        role.every((role) => {
            return cid.assertAttributeValue(buildEntityRole(role), role);
        })
    );

    if (!canAccess)
        return {
            hasAccess: false,
            message: "You are not authorized for this action",
        };

    return {
        hasAccess: true,
    };
};

const isInvokerStakeholderRevoked = async (ctx) => {
    const TMSCInstance =
        chaincodeInstances.TMSC.isInvokerStakeholderRevoked(ctx);
    await TMSCInstance.makeContact();

    const [isRevoked, isRevokedErr] = [
        TMSCInstance.response,
        TMSCInstance.error,
    ];

    if (isRevokedErr) throw new Error(isRevokedErr.message);

    return isRevoked;
};

const getClientMSP = async (ctx) => {
    const TMSCInstance = chaincodeInstances.TMSC.domainOfClient(ctx);
    await TMSCInstance.makeContact();

    const [TMSCRes, TMSCResErr] = [TMSCInstance.response, TMSCInstance.error];

    if ((TMSCRes && !TMSCRes.condition) || TMSCResErr)
        throw new Error(TMSCRes ? TMSCRes.message : TMSCResErr.message);

    return TMSCRes.message;
};

module.exports = {
    getClientMSP: getClientMSP,
    accessAudit: accessAudit,
    isInvokerStakeholderRevoked: isInvokerStakeholderRevoked,
};
