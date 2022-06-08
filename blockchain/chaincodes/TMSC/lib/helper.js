"use strict";
const ClientIdentity = require("fabric-shim").ClientIdentity;

const cryptoHasher = require("crypto").createHash;
const { matchStrings, buildEntityRole, response } = require("./utils/utils");
const { checkCARevoked, constructCert } = require("./utils/helper");
const constants = require("./utils/constants");
const Stakeholder = require("./types/stakeholders/stakeholder");
const TrustFile = require("./types/trust_anchors/trustFile");

/**
 * When an Entity wants to invoke a Function, accessAudit checks if the needed Attributes are available
 * accessAudit takes as input an array, `neededRoles`
 * neededRoles = [[Attribute1, Attribute2], [Attribute3]] => (Attribute1 AND Attribute2) OR (Attribute3)
 * @param cid
 * @param neededRoles
 */
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
        message: "Authorized",
    };
};

const checkIfStakeholderIsRevoked = async (ctx, mspId) => {
    const stakeholderKey = Stakeholder.makeKey([constants.proxyStakeholders]);

    const stakeholdersInstance = await ctx.stakeholderManager.get(
        stakeholderKey
    );

    const isRevoked = stakeholdersInstance.checkIfRevokedStakeholder(mspId);

    return {
        status: isRevoked,
        message: isRevoked
            ? `Your Organization is revoked`
            : "Your Organization is not revoked",
    };
};

const getExtraCertAttrs = (constructedCert) => {
    const extension = constructedCert.extensions.find(
        (ext) => ext.oid === "1.2.3.4.5.6.7.8.1"
    );
    // const subject = constructedCert.subject;
    let attrs = {};
    if (extension) {
        const str = extension.value.toString();
        const obj = JSON.parse(str);
        [attrs.ROLES, attrs.EXTRA] = [{}, {}];

        for (let attr in obj.attrs) {
            let attribute = attr.toUpperCase();
            if (attribute.startsWith("ROLE")) {
                attrs.ROLES[attribute] = obj.attrs[attr].toUpperCase();
            } else if (attribute.match("GID")) {
                attrs.GID = obj.attrs[attr];
            } else {
                attrs.EXTRA[attribute] = obj.attrs[attr].toUpperCase();
            }
        }
    }

    return attrs;
};

const combineAttributes = (ctx, certAttrs, tempAttrs) => {
    const cid = new ClientIdentity(ctx.stub);

    let combinedAttrs = {};

    for (const authority in certAttrs) {
        for (const combinedAttrType of ["ROLES", "EXTRA", "TEMPORALROLES"]) {
            combinedAttrs[combinedAttrType] =
                combinedAttrs[combinedAttrType] || {};
            combinedAttrs[combinedAttrType][authority] =
                combinedAttrs[combinedAttrType][authority] || {};
        }

        for (const certAttr in certAttrs[authority].ROLES) {
            combinedAttrs.ROLES[authority][
                certAttrs[authority].ROLES[certAttr]
            ] = {
                ROLE: certAttrs[authority].ROLES[certAttr],
                TEMPORAL_ROLE: false,
            };
        }

        for (const certAttr in certAttrs[authority].EXTRA) {
            combinedAttrs.EXTRA[authority][certAttr] = {
                extraAttribute: certAttrs[authority].EXTRA[certAttr],
            };
        }

        if (combinedAttrs.GID) {
            if (combinedAttrs.GID !== certAttrs[authority].GID)
                return response(false, "Certificates' GIDS do not match");
            break;
        }

        if (!certAttrs[authority].GID)
            return response(
                false,
                "The Certificate(s) does not have a GID attribute"
            );

        if (!cid.assertAttributeValue("GID", certAttrs[authority]["GID"])) {
            return response(
                false,
                `You loaded a Certificate that you do not own`
            );
        }

        combinedAttrs.GID = certAttrs[authority].GID;
    }

    for (const authority in tempAttrs) {
        for (const attribute in tempAttrs[authority]) {
            combinedAttrs.TEMPORALROLES[authority][attribute] = {
                ROLE: attribute,
                AUTHORITY: authority,
                TEMPORAL_ROLE: true,
                DATA: tempAttrs[authority][attribute],
            };
        }
    }

    return response(true, combinedAttrs);
};

const getTempACLAttrs = async (ctx, GID, stakeholder) => {
    const attributes = {};

    const tempACLKey = TrustFile.makeKey([
        constants.indexACL,
        stakeholder.name,
    ]);

    const tempACLInstance = await ctx.trustFileManager.get(tempACLKey);

    if (!tempACLInstance) return {};

    const tempACL = tempACLInstance.getData();

    if (tempACL[GID]) {
        const isCARevoked = await checkCARevoked(ctx, stakeholder.name);
        if (isCARevoked.condition) return {};

        const accessValues = tempACL[GID];

        for (const attr in accessValues) {
            const attributeName = attr.toUpperCase();
            attributes[attributeName] = accessValues[attr];
        }
    }
    return attributes;
};

const invokerDomain = async (ctx, cid) => {
    const stakeholdersKey = Stakeholder.makeKey([constants.proxyStakeholders]);
    const stakeholdersInstance = await ctx.stakeholderManager.get(
        stakeholdersKey
    );

    return await stakeholdersInstance.getMSPDomain(ctx, cid.getMSPID());
};

const returnProxyStakeholders = async (ctx) => {
    const stakeholdersKey = Stakeholder.makeKey([constants.proxyStakeholders]);
    const stakeholdersInstance = await ctx.stakeholderManager.get(
        stakeholdersKey
    );

    return stakeholdersInstance.getStakeholdersWithDetails();
};

const returnDomainStakeholdersInstance = async (ctx) => {
    const cid = new ClientIdentity(ctx.stub);

    const stakeholdersProxyKey = Stakeholder.makeKey([
        constants.proxyStakeholders,
    ]);
    const stakeholdersProxyInstance = await ctx.stakeholderManager.get(
        stakeholdersProxyKey
    );

    const domain = await stakeholdersProxyInstance.getMSPDomain(
        ctx,
        cid.getMSPID()
    );

    const stakeholdersInstanceKey = Stakeholder.makeKey([domain]);
    const stakeholdersInstance = await ctx.stakeholderManager.get(
        stakeholdersInstanceKey
    );

    return stakeholdersInstance;
};

const addCAMajorityReached = async (ctx, election) => {
    const {
        electionInfo: { audience },
        data,
    } = election;

    const [orgMSP, caCert, caCRL, tempACL] = JSON.parse(
        Buffer.from(data, "base64").toString("utf-8")
    );

    for (const document of [caCert, caCRL, tempACL]) {
        const file = TrustFile.createInstance();
        await file.defineFile(ctx, document, false, true);

        if (!file.isValidFile)
            throw new Error(`The file is invalid. ${file.error}`);

        await ctx.trustFileManager.add(file);
    }

    const constructedCert = constructCert(caCert);
    const organization = constructedCert.issuer.organizationName;

    // Get the PROXY Stakeholders and modify the record
    const stakeholdersProxyKey = Stakeholder.makeKey([
        constants.proxyStakeholders,
    ]);
    const stakeholdersProxyInstance = await ctx.stakeholderManager.get(
        stakeholdersProxyKey
    );

    stakeholdersProxyInstance.addStakeholderToStakeholders(organization, {
        name: organization.toLowerCase(),
        domain: audience,
        msp: orgMSP,
    });

    // Get the DOMAIN Stakeholders and modify the record
    const stakeholdersDomainKey = Stakeholder.makeKey([audience]);
    const stakeholdersDomainInstance = await ctx.stakeholderManager.get(
        stakeholdersDomainKey
    );

    stakeholdersDomainInstance.addStakeholderToStakeholders(organization, {
        name: organization.toLowerCase(),
        msp: orgMSP,
    });

    // Update the modified records
    try {
        await ctx.stakeholderManager.updateInstance(stakeholdersProxyInstance);
        await ctx.stakeholderManager.updateInstance(stakeholdersDomainInstance);
    } catch (err) {
        throw new Error(
            `Could not append the new CA to the existing Stakeholders' list, ${err}`
        );
    }

    return response(
        true,
        `Successfully appended a new CA [MSP: ${orgMSP}, ORGANIZATION: ${organization}, DOMAIN: ${audience}]`
    );
};

const removeCAMajorityReached = async (ctx, election) => {
    const caName = JSON.parse(
        Buffer.from(election.data, "base64").toString("utf-8")
    )[0];

    const proxyStakeholdersKey = Stakeholder.makeKey([
        constants.proxyStakeholders,
    ]);
    const proxyStakeholdersInstance = await ctx.stakeholderManager.get(
        proxyStakeholdersKey
    );

    const stakeholderForDeletion =
        await proxyStakeholdersInstance.getStakeholderByName(ctx, caName);

    const { domain, name } = stakeholderForDeletion;

    const caCertKey = TrustFile.makeKey([constants.indexCert, name]);
    const caCertInstance = await ctx.trustFileManager.get(caCertKey);
    caCertInstance.setIsRevoked();

    const caCRLKey = TrustFile.makeKey([constants.indexCRL, name]);
    const caCRLInstance = await ctx.trustFileManager.get(caCRLKey);
    caCRLInstance.setIsRevoked();

    const caACLKey = TrustFile.makeKey([constants.indexACL, name]);
    const caACLInstance = await ctx.trustFileManager.get(caACLKey);
    caACLInstance.setIsRevoked();

    try {
        await Promise.all(
            [caCertInstance, caCRLInstance, caACLInstance].map(
                async (instance) => await ctx.trustFileManager.update(instance)
            )
        );
    } catch (err) {
        throw new Error(`Could not revoke the records of ${caName}`);
    }

    const domainStakeholdersKey = Stakeholder.makeKey([domain]);
    const domainStakeholdersInstance = await ctx.stakeholderManager.get(
        domainStakeholdersKey
    );

    // Set the stakeholder as revoked
    proxyStakeholdersInstance.setRevoked(caName, true);
    domainStakeholdersInstance.setRevoked(caName, true);

    try {
        await ctx.stakeholderManager.updateInstance(proxyStakeholdersInstance);
        await ctx.stakeholderManager.updateInstance(domainStakeholdersInstance);
    } catch (err) {
        throw new Error("Could not update the Stakeholders' list");
    }

    return response(
        true,
        `Successfully revoked ${caName}'s latest certificate, CRL and temporal ACL [DOMAIN: ${domain}]`
    );
};

const removeOrgFromStakeholders = (organization, stakeholders) => {
    return Object.keys(stakeholders)
        .filter(
            (stakeholder) =>
                !matchStrings(organization, stakeholders[stakeholder].name)
        )
        .reduce((res, key) => ((res[key] = stakeholders[key]), res), {});
};

const validateUserCerts = (ctx, userCerts) => {
    const cid = new ClientIdentity(ctx.stub);
    const invokerCert = cid.getIDBytes().toString("utf-8");

    let {
        master: { certificate: masterCert, signature: masterSignature },
        combined: combinedIdentities = [],
    } = userCerts;

    // Validate that the master cert is invoker's cert
    const masterCertIsInvokersCert = matchStrings(
        masterCert,
        invokerCert,
        true
    );

    if (!masterCertIsInvokersCert)
        throw new Error("Invalid Master Identity certificate");

    // Validate the master signature against the master Cert
    masterSignature = arrayToUINT8Array(masterSignature);

    const constructedMasterCert = constructCert(
        Buffer.from(masterCert, "utf-8").toString("base64")
    );

    const userCertsData = [
        masterCert,
        ...combinedIdentities.map((identity) => identity.certificate),
    ];

    const invokerHoldsPK = constructedMasterCert.publicKey.verify(
        Buffer.from(userCertsData, "binary"),
        Buffer.from(masterSignature, "binary"),
        "sha256"
    );

    if (!invokerHoldsPK) throw new Error("You do not own the master identity");

    // Validate that the user is the owner of the combined identities
    const invokerOwnsCombinedIdent = combinedIdentities.every((identity) => {
        const combinedIdentCert = identity.certificate;
        const combinedIdentSignature = arrayToUINT8Array(identity.signature);

        const constructedIdentityCert = constructCert(
            Buffer.from(combinedIdentCert, "utf-8").toString("base64")
        );

        return constructedIdentityCert.publicKey.verify(
            Buffer.from(masterSignature, "binary"),
            Buffer.from(combinedIdentSignature, "binary"),
            "sha256"
        );
    });

    if (!invokerOwnsCombinedIdent)
        throw new Error("Error with your combined identities");

    return;
};

const removeSignaturesFromUserCerts = (userCerts) => [
    userCerts.master.certificate,
    ...userCerts.combined.map((identity) => identity.certificate),
];

const arrayToUINT8Array = (_array) => {
    if (!(_array instanceof Object.getPrototypeOf(Uint8Array))) {
        return new Uint8Array(_array);
    }
    return _array;
};

module.exports = {
    cryptoHasher: cryptoHasher,
    addCAMajorityReached: addCAMajorityReached,
    removeCAMajorityReached: removeCAMajorityReached,
    returnDomainStakeholdersInstance: returnDomainStakeholdersInstance,
    getExtraCertAttrs: getExtraCertAttrs,
    getTempACLAttrs: getTempACLAttrs,
    combineAttributes: combineAttributes,
    invokerDomain: invokerDomain,
    returnProxyStakeholders: returnProxyStakeholders,
    removeOrgFromStakeholders: removeOrgFromStakeholders,
    accessAudit: accessAudit,
    checkIfStakeholderIsRevoked: checkIfStakeholderIsRevoked,
    validateUserCerts: validateUserCerts,
    removeSignaturesFromUserCerts: removeSignaturesFromUserCerts,
};
