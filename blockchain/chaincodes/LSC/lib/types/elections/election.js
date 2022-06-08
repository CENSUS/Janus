"use strict";

const StateManager = require("../../ledger-connector/stateManager");
const { hasher } = require("../../utils/utils");

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

    getData() {
        return this.data;
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
    }

    createStateKey(key = undefined) {
        this.createKey(key || [this.electionInfo.electionID]);
    }

    setElectionID(pscResponse) {
        this.electionInfo.electionID = Object.keys(pscResponse.message)[0];
    }

    /**
     * `createInstance` is a `factory` method that creates Election objects
     */
    static createInstance(electionType, audience, data, comment, stakeholders) {
        const dataHash = hasher("sha1")
            .update(Buffer.from(JSON.stringify(data)))
            .digest("hex");

        return new Election({
            electionInfo: {
                electionType,
                audience,
                dataHash,
                comment,
                stakeholders,
            },
            data,
        });
    }

    static getClass() {
        return "electioninfo";
    }
}
module.exports = Election;
