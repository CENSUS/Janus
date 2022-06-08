"use strict";

const StateManager = require("../../../ledger-connector/stateManager");
const {
    cryptoHasher: hasher,
    timestampToMilliseconds,
} = require("../../../utils/utils");
const constants = require("../../../utils/constants");

class Election extends StateManager {
    constructor(object) {
        super(Election.getClass());
        Object.assign(this, object);
    }

    /**
     * Basic getters
     */
    getType() {
        return this.electionType;
    }

    getAudience() {
        return this.audience;
    }

    getDataHash() {
        return this.dataHash;
    }

    getComment() {
        return this.comment;
    }

    getStakeholders() {
        return this.stakeholders;
    }

    getElection() {
        return this;
    }

    /**
     * Basic setters
     */

    setDataNonce(nonce) {
        this.data.nonce = nonce;
    }

    setStakeholders(stakeholders) {
        this.stakeholders = stakeholders;
        this.stakeholdersLength = Object.keys(stakeholders).length;
    }

    createStateKey(key = undefined) {
        this.createKey(key || [this.electionID]);
    }

    prepareElection(ctx, stakeholders, invoker) {
        const currentTimestamp = timestampToMilliseconds(
            ctx.stub.getTxTimestamp()
        );

        const stakeholdersLength = Object.keys(stakeholders).length;

        this.electionID = hasher("sha1")
            .update(
                this.audience +
                    this.dataHash +
                    this.electionType +
                    ctx.stub.getTxID()
            )
            .digest("hex");

        this.audienceMajorityNr =
            stakeholdersLength >= 2 ? Math.round(stakeholdersLength / 2) : 0;

        this.stakeholders = stakeholders;
        this.votersCount = stakeholdersLength;

        this.startDate = this.startDate || new Date(currentTimestamp);

        this.validUntil =
            this.validUntil || new Date(currentTimestamp + 30 * 60 * 1000); // This is valid for 30 mins - While this: e.g. new Date(currentTimestamp + 5 * 24 * 60 * 60 * 1000) is valid for 5 days - `validUntil` is the available nr. of days for the stakeholders to cast their vote

        this.challengeData = Buffer.from(this.electionID, "hex").toString(
            "base64"
        );

        this.creator = invoker;
    }

    constuctElectionEvent(ctx) {
        return {
            [this.electionID]: {
                audience: this.audience,
                startDate: this.startDate,
                validUntil: this.validUntil,
                audienceMajorityNr: this.audienceMajorityNr,
                votersCount: this.votersCount,
                currentVotes: 0,
                currentApprovals: 0,
                electionParams: {
                    electionContract: "PSC",
                    electionChannel: ctx.stub.getChannelID(),
                },
            },
        };
    }

    /**
     * `createInstance` is a `factory` method that creates Election objects
     */
    static createInstance(electionData) {
        if (
            !electionData.electionType ||
            !electionData.audience ||
            !electionData.dataHash ||
            !electionData.comment ||
            !electionData.stakeholders
        )
            throw new Error("Malformed Election data of new Election");

        if (
            !constants.ACCEPTABLE_ELECTION_TYPES.includes(
                electionData.electionType
            )
        )
            throw new Error(
                `Unknown Election identifier ${electionData.electionType}`
            );

        return new Election(electionData);
    }

    static getClass() {
        return "electioninfo";
    }
}
module.exports = Election;
