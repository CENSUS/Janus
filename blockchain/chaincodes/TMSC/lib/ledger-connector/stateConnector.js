"use strict";
const StateManager = require("./stateManager.js");
const Queries = require("./utils/queryUtils.js");

class StateConnector {
    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = {};
    }

    async addState(state) {
        let key = this.ctx.stub.createCompositeKey(
            this.name,
            state.getSplitKey()
        );
        let data = StateManager.serialize(state);
        await this.ctx.stub.putState(key, data);
    }

    async getState(key) {
        let ledgerKey = this.ctx.stub.createCompositeKey(
            this.name,
            StateManager.splitKey(key)
        );
        let data = await this.ctx.stub.getState(ledgerKey);
        if (data && data.length > 0) {
            return StateManager.deserialize(data, this.supportedClasses);
        } else {
            return null;
        }
    }

    async getHistoryState(key) {
        key = StateConnector.prepareQueryKey(key);
        const query = new Queries(this.ctx, this.name);
        return await query.getAssetHistory(key);
    }

    async getStateByPartialCompositeKey(partialKey) {
        partialKey = StateConnector.prepareQueryKey(partialKey);
        let query = new Queries(this.ctx, this.name);
        return await query.queryKeyByPartial(partialKey);
    }

    async getQueryState(searchableQuery) {
        const query = new Queries(this.ctx, this.name);
        return await query.queryByAdhoc(searchableQuery);
    }

    async deleteState(key) {
        let ledgerKey = this.ctx.stub.createCompositeKey(
            this.name,
            StateManager.splitKey(key)
        );
        await this.ctx.stub.deleteState(ledgerKey);
    }

    async updateState(state) {
        let key = this.ctx.stub.createCompositeKey(
            this.name,
            state.getSplitKey()
        );
        let data = StateManager.serialize(state);
        await this.ctx.stub.putState(key, data);
    }

    use(stateClass) {
        this.supportedClasses[stateClass.getClass()] = stateClass;
    }

    // HELPER FUNCTIONS

    static prepareQueryKey(key) {
        return StateManager.splitKey(StateManager.makeKey(key));
    }
}

module.exports = StateConnector;
