"use strict";

const { ClientIdentity, Shim } = require("fabric-shim");
// const Ballot = require("./objects/ballot");
const Election = require("./types/elections/election/election");
const {
    promiseHandler,
    buildEntityRole,
    jsonParser,
    timestampToDate,
    matchStrings,
    response,
} = require("./utils/utils");
const chaincodeInstances = require("./utils/helper/interChaincode/preconfiguredInstances");
const constants = require("./utils/constants");
const Ballot = require("./types/elections/ballot/ballot");

/**
 * When an Entity wants to invoke a Function, accessAudit checks if the needed Attributes are available
accessAudit takes as input an array, `neededRoles`
neededRoles = [[Attribute1, Attribute2], [Attribute3]] => (Attribute1 AND Attribute2) OR (Attribute3)
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
            message: `You are not authorized for this action`,
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

const validateSignChallenge = async (
    ctx,
    certificate,
    challengeData,
    signature
) => {
    const dataToValidate = {
        certificate,
        challenge: {
            signature,
            raw: challengeData,
        },
    };

    const TMSCInstance = chaincodeInstances.TMSC.validateSignChallenge(ctx);
    await TMSCInstance.makeContact([dataToValidate]);

    const [signChallengeRes, signChallengeResErr] = [
        TMSCInstance.response,
        TMSCInstance.error,
    ];

    if (signChallengeResErr) throw new Error(signChallengeResErr.message);

    return signChallengeRes;
};

const getDomainStakeholders = async (
    ctx,
    invokerMSPID,
    audience,
    includeSelf = true,
    stakeholders = {},
    notRevoked = false
) => {
    let stakeholdersDomainLength = Object.keys(stakeholders).length;

    if (stakeholdersDomainLength === 0) {
        const TMSCInstance =
            chaincodeInstances.TMSC.returnDomainStakeholders(ctx);
        await TMSCInstance.makeContact([audience, notRevoked]);

        const [resStakeholders, resStakeholdersErr] = [
            TMSCInstance.response,
            TMSCInstance.error,
        ];

        if (resStakeholdersErr)
            throw new Error(
                `Error in stakeholder's category, ${resStakeholdersErr.message}`
            );

        stakeholders = resStakeholders.message;
        stakeholdersDomainLength = Object.keys(stakeholders).length;
    }

    stakeholdersDomainLength = includeSelf
        ? stakeholdersDomainLength
        : stakeholdersDomainLength - 1;

    !includeSelf &&
        Object.keys(stakeholders).forEach((stakeholder) => {
            stakeholders[stakeholder].msp === invokerMSPID &&
                delete stakeholders[stakeholder];
        });

    return [stakeholders, stakeholdersDomainLength];
};

// It removes the voting from the "ACTIVE ELECTIONS" archives and moves it into the "COMPLETED ELECTIONS" archives
const completedElection = async (ctx, nonce) => {
    const electionData = await fetchPartialCompositeKey(
        ctx,
        ELECTIONS,
        [nonce],
        true
    );

    if (Object.keys(electionData).length < 2 || !electionData)
        // Make sure that the Election with the given nonce exists
        throw new Error("An Election was not found");

    const completedVotingArchiveKey = ctx.stub.createCompositeKey(
        COMPLETED_ELECTION,
        [nonce]
    );
    try {
        await ctx.stub.putState(completedVotingArchiveKey, Buffer.from());
    } catch (err) {
        throw new Error(err);
    }
    return true;
};

const getActiveStakeholderElectionsAPI = async (
    ctx,
    invokerMSPID,
    includeBallots = false
) => {
    const elections = await fetchPartialCompositeKey(
        ctx,
        constants.ACTIVE_ELECTION,
        [invokerMSPID]
    );

    if (elections.length === 0) return {};

    let foundElections = {};
    let [currentVotes, currentApprovals] = [0, 0];
    await Promise.all(
        elections.map(async (election) => {
            try {
                const electionID = ctx.stub.splitCompositeKey(election["Key"])
                    .attributes[1]; // compositeKey.attributes[1] === electionID
                const electionInformation = await getElectionInformation(
                    ctx,
                    electionID
                );

                if (!electionInformation) foundElections[electionID] = false;

                const {
                    audience,
                    startDate,
                    validUntil,
                    audienceMajorityNr,
                    votersCount,
                } = electionInformation;

                if (includeBallots) {
                    const [domainStakeholders, domainStakeholdersErr] =
                        await promiseHandler(
                            getDomainStakeholders(ctx, invokerMSPID, audience)
                        );

                    if (domainStakeholdersErr)
                        throw new Error(domainStakeholdersErr["message"]);

                    const stakeholders = domainStakeholders[0];

                    const [stakeholderVotes, stakeholderVotesErr] =
                        await promiseHandler(
                            countBallotsOfElection(
                                ctx,
                                electionID,
                                stakeholders
                            )
                        );
                    if (stakeholderVotesErr)
                        throw new Error(stakeholderVotesErr["message"]);
                    currentVotes = stakeholderVotes[0];
                    currentApprovals = stakeholderVotes[1];
                }

                foundElections[electionID] = {
                    audience,
                    startDate,
                    validUntil,
                    audienceMajorityNr,
                    votersCount,
                    currentVotes: includeBallots ? currentVotes : false,
                    currentApprovals: includeBallots ? currentApprovals : false,
                };
            } catch (err) {
                throw new Error(
                    `Error while fetching the ACTIVE Elections, ${err}`
                );
            }
        })
    );

    return foundElections;
};

const getElectionInformation = async (
    ctx,
    electionID,
    shouldMakeKey = true
) => {
    const electionKey = shouldMakeKey
        ? Election.makeKey([electionID])
        : electionID;
    return await ctx.electionManager.get(electionKey);
};

const countBallotsOfElection = async (ctx, electionID, organizations) => {
    let [ballots, approvals] = [0, 0];

    await Promise.all(
        Object.values(organizations).map(async (org) => {
            const ballotKey = Ballot.makeKey([org["msp"], electionID]);
            const ballotInstance = await ctx.ballotManager.get(ballotKey);

            if (ballotInstance) {
                ballotInstance.signed && ballots++;
                ballotInstance.approved && approvals++;
            }
        })
    );
    return [ballots, approvals];
};

const getBallotsInfoOfElection = async (
    ctx,
    electionID,
    organizations = {}
) => {
    const ballots = {};
    await Promise.all(
        Object.values(organizations).map(async (org) => {
            const ballotKey = Ballot.makeKey([org["msp"], electionID]);
            const ballotInstance = await ctx.ballotManager.get(ballotKey);

            if (ballotInstance) {
                ballots[org["name"]] = {
                    signed: ballotInstance.signed,
                    approved: ballotInstance.approved,
                    timeOfVote: ballotInstance.timeOfVote,
                };
            }
        })
    );
    return ballots;
};

const getBallotsOfStakeholder = async (ctx, mspID) => {
    let [
        completedElections,
        pendingElections,
        expiredElections,
        unknownElections,
    ] = [[], [], [], []];

    const electionsByBallots = await ctx.ballotManager.getAll([mspID]);

    const currentTime = timestampToDate(ctx.stub.getTxTimestamp());
    if (electionsByBallots.length > 0) {
        await Promise.all(
            electionsByBallots.map(async (election) => {
                const electionID = ctx.stub.splitCompositeKey(election.Key)
                    .attributes[1];
                const electionRecord = jsonParser(election["Record"]);

                const electionInformation = await getElectionInformation(
                    ctx,
                    electionID,
                    false
                );

                let mergedElectionData = {
                    electionID,
                    approved: electionRecord["approved"],
                    signed: electionRecord["signed"],
                };

                if (!electionInformation) {
                    unknownElections.push(mergedElectionData);
                    return;
                }

                mergedElectionData = {
                    ...mergedElectionData,
                    creator: electionInformation["creator"],
                    audience: electionInformation["audience"],
                    validUntil: electionInformation["validUntil"],
                    electionType: electionInformation["electionType"],
                    challengeData: electionInformation["challengeData"],
                    comment: electionInformation["comment"],
                };

                if (
                    currentTime >=
                        new Date(electionInformation["validUntil"]) &&
                    !electionRecord.signed
                ) {
                    expiredElections.push(mergedElectionData);
                    return;
                }
                if (electionRecord.signed) {
                    completedElections.push(mergedElectionData);
                    return;
                }
                pendingElections.push(mergedElectionData);
            })
        );
    }
    return {
        completedElections,
        pendingElections,
        expiredElections,
        unknownElections,
    };
};

const majorityConsentCheck = async (ctx, electionID, invokerMSPID) => {
    const electionKey = Election.makeKey([electionID]);
    const electionInstance = await ctx.electionManager.get(electionKey);

    if (!electionInstance) throw new Error(`Unknown Election ID ${electionID}`);

    // const [domainStakeholders, domainStakeholdersErr] = await promiseHandler(
    //     getDomainStakeholders(ctx, invokerMSPID, electionInstance.audience)
    // );

    // if (domainStakeholdersErr)
    //     throw new Error(domainStakeholdersErr["message"]);

    // const stakeholders = domainStakeholders[0];

    const stakeholders = electionInstance.stakeholders;

    const [stakeholderVotes, stakeholderVotesErr] = await promiseHandler(
        countBallotsOfElection(ctx, electionID, stakeholders)
    );
    if (stakeholderVotesErr) throw new Error(stakeholderVotesErr["message"]);

    const [currentVotes, currentApprovals] = [
        stakeholderVotes[0],
        stakeholderVotes[1],
    ];

    const currentTime = timestampToDate(ctx.stub.getTxTimestamp());
    const isStillActive = currentTime < new Date(electionInstance.validUntil);

    let [isApproved, canStillReachConsensus] = [false, false];

    isApproved = electionInstance.audienceMajorityNr <= currentApprovals;
    if (isStillActive) {
        canStillReachConsensus = !isApproved
            ? electionInstance.votersCount -
                  (currentVotes - currentApprovals) >=
              electionInstance.audienceMajorityNr
            : false;
    }

    const consentResponse = {
        electionData: electionInstance,
        canStillReachConsensus,
        votedOutOf: `Voted ${currentVotes} out of ${electionInstance.votersCount}`,
    };

    return response(isApproved, consentResponse);
};

const verifyClientOrgMatchesPeerOrg = (ctx, clientOrgID = null) => {
    const chaincodeID = ctx.stub.getMspID();

    if (!clientOrgID) clientOrgID = new ClientIdentity(ctx.stub).getMSPID();

    return chaincodeID === clientOrgID;
};

const verifyElectionOwnership = (ctx, ownerOrgMSP, clientOrgID = null) => {
    if (!clientOrgID) clientOrgID = new ClientIdentity(ctx.stub).getMSPID();
    return matchStrings(ownerOrgMSP, clientOrgID);
};

const electionExtraInfo = async (ctx, electionID, invokerMSPID) => {
    const extraInfo = {};

    const electionInstance = await getElectionInformation(
        ctx,
        electionID,
        false
    );

    if (!electionInstance) throw new Error(`Unknown Election ID ${electionID}`);

    const [stakeholdersData, stakeholdersDataErr] = await promiseHandler(
        getDomainStakeholders(
            ctx,
            invokerMSPID,
            electionInstance.audience,
            false
        )
    );
    if (stakeholdersDataErr) throw new Error(stakeholdersDataErr["message"]);

    const [ballotsOfElection, ballotsOfElectionErr] = await promiseHandler(
        getBallotsInfoOfElection(ctx, electionID, stakeholdersData[0])
    );

    if (ballotsOfElectionErr) throw new Error(ballotsOfElectionErr["message"]);

    extraInfo[electionID] = {
        electionData: electionInstance,
        ballotData: ballotsOfElection,
    };

    return extraInfo;
};

const isActiveElection = async (ctx, electionID, stakeholders) => {
    const electionData = (
        await Promise.all(
            Object.keys(stakeholders).map(async (stakeholder) => {
                const { msp } = stakeholders[stakeholder];

                const electionCompKey = ctx.stub.createCompositeKey(
                    constants.ACTIVE_ELECTION,
                    [msp, electionID]
                );

                const electionDataFromState = await ctx.stub.getState(
                    electionCompKey
                );

                return electionDataFromState.length > 0
                    ? { ...stakeholders[stakeholder] }
                    : undefined;
            })
        ).then((data) =>
            Object.values(data).filter((stakeholder) => stakeholder)
        )
    )[0];
    return (electionData && electionData) || {};
};

const buildCollectionName = (ctx, clientOrgID = null) => {
    if (!clientOrgID) {
        clientOrgID = new ClientIdentity(ctx.stub).getMSPID();
    }

    return `${clientOrgID}PrivateCollection`;
};

const fetchPartialCompositeKey = async (ctx, indexType, attributes = []) => {
    const valueIterator = await ctx.stub.getStateByPartialCompositeKey(
        indexType,
        attributes
    );
    let results = [];
    while (true) {
        let res = await valueIterator.next();

        if (res.value && res.value.value.toString()) {
            let jsonRes = {};
            jsonRes.Key = res.value.key;
            try {
                jsonRes["Record"] = res.value.value.toString("utf8");
            } catch (err) {
                jsonRes["Record"] = res.value.value.toString("utf8"); //?
            }
            results.push(jsonRes);
        }
        if (res.done) {
            await valueIterator.close();
            //if (onlyLastElement) return results[results.length - 1];

            return results;
        }
    }
};

const removeSignaturesFromUserCerts = (userCerts) => [
    userCerts.master.certificate,
    ...userCerts.combined.map((identity) => identity.certificate),
];

module.exports = {
    completedElection: completedElection,
    getActiveStakeholderElectionsAPI: getActiveStakeholderElectionsAPI,
    getBallotsOfStakeholder: getBallotsOfStakeholder,
    majorityConsentCheck: majorityConsentCheck,
    fetchPartialCompositeKey: fetchPartialCompositeKey,
    verifyClientOrgMatchesPeerOrg: verifyClientOrgMatchesPeerOrg,
    buildCollectionName: buildCollectionName,
    getDomainStakeholders: getDomainStakeholders,
    validateSignChallenge: validateSignChallenge,
    verifyElectionOwnership: verifyElectionOwnership,
    isActiveElection: isActiveElection,
    accessAudit: accessAudit,
    electionExtraInfo: electionExtraInfo,
    isInvokerStakeholderRevoked: isInvokerStakeholderRevoked,
    removeSignaturesFromUserCerts: removeSignaturesFromUserCerts,
};
