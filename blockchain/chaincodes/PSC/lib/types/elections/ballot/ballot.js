"use strict";

const StateManager = require("../../../ledger-connector/stateManager");
const { timestampToDate } = require("../../../utils/utils");
const ballot = {
    voter: null,
    signed: false,
    approved: false,
    signedData: false,
    timeOfVote: null,
};

class Ballot extends StateManager {
    constructor(object) {
        super(Ballot.getClass(), [object.organizationMSP, object.electionID]);
        Object.assign(this, object);
    }

    /**
     * Basic getters
     */

    getBallot() {
        return this;
    }

    getSigned() {
        return this.signed;
    }

    getApproved() {
        return this.approved;
    }

    getSignedData() {
        return this.signedData ? fromBuffer(this.signedData) : null;
    }

    getTimeOfVote() {
        return this.timeOfVote;
    }

    /**
     * Basic setters
     */

    castVote(ctx, voter, approval, signedData) {
        if (!voter || typeof approval !== "boolean" || !signedData)
            throw new Error("Insufficient information");
        this.signed = true;
        this.voter = voter;
        this.approved = approval;
        this.signedData = signedData;
        this.timeOfVote = timestampToDate(ctx.stub.getTxTimestamp());
    }

    emptyBallot() {
        Object.assign(this, ballot);
    }

    setVoter(voter) {
        this.voter = voter;
    }

    setSigned(signed) {
        this.signed = signed;
    }

    setApproved(approval) {
        this.approved = approval;
    }

    setSignedData(signedData) {
        this.signedData = signedData;
    }

    setTimeOfVote(time) {
        this.timeOfVote = time;
    }

    /**
     * `createInstance` is a `factory` method that creates Ballot objects
     */
    static createInstance(organizationMSP, electionID) {
        return new Ballot({ organizationMSP, electionID, ...ballot });
    }

    static getClass() {
        return "ballotinfo";
    }
}
module.exports = Ballot;
