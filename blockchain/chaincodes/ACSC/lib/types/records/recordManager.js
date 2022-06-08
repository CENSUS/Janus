"use strict";

const StateConnector = require("../../ledger-connector/stateConnector");

const Record = require("./record");

class RecordManager extends StateConnector {
    constructor(ctx) {
        super(ctx, "RECORDS");
        this.ctx = ctx;
        this.use(Record);
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

module.exports = RecordManager;
