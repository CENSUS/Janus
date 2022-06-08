"use strict";

const StateConnector = require("../../../ledger-connector/stateConnector");
const Ballot = require("./ballot");

class BallotManager extends StateConnector {
    constructor(ctx) {
        super(ctx, "BALLOT");
        this.ctx = ctx;
        this.use(Ballot);
    }

    async add(instance) {
        return this.addState(instance);
    }

    async get(instanceKey) {
        return this.getState(instanceKey);
    }

    async getAll(instanceKey) {
        return this.getStateByPartialCompositeKey(instanceKey);
    }

    async updateInstance(instance) {
        return this.updateState(instance);
    }

    async remove(instanceKey) {
        return this.deleteState(instanceKey);
    }
}

module.exports = BallotManager;
