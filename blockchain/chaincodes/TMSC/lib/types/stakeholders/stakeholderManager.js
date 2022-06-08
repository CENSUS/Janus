"use strict";

const StateConnector = require("../../ledger-connector/stateConnector");
const Stakeholder = require("./stakeholder");

class StakeholderManager extends StateConnector {
    constructor(ctx) {
        super(ctx, "STAKEHOLDER");
        this.ctx = ctx;
        this.use(Stakeholder);
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

    async getInstanceByPartial(instanceKey) {
        return await this.getStateByPartialCompositeKey(instanceKey);
    }

    async removeInstance(instanceKey) {
        return this.deleteState(instanceKey);
    }

    async queryInstanceWithSelector(query) {
        return this.getQueryState(query);
    }
}

module.exports = StakeholderManager;
