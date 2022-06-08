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
        const key = this.ctx.stub.createCompositeKey(
            this.name,
            state.getSplitKey()
        );
        const data = StateManager.serialize(state);
        await this.ctx.stub.putState(key, data);
    }

    async getState(key) {
        const ledgerKey = this.ctx.stub.createCompositeKey(
            this.name,
            StateManager.splitKey(key)
        );
        const data = await this.ctx.stub.getState(ledgerKey);
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
        const query = new Queries(this.ctx, this.name);
        return await query.queryKeyByPartial(partialKey);
    }

    async getPaginatedStateWithComposite(compKey, pageSize, bookmark) {
        const query = new Queries(this.ctx, this.name);
        return await query.queryStateWithPaginationAndComposite(
            compKey,
            pageSize,
            bookmark
        );
    }

    async getPaginatedStateWithQuery(queryString, pageSize, bookmark) {
        const query = new Queries(this.ctx, this.name);
        return await query.queryStateWithPaginationAndQuery(
            queryString,
            pageSize,
            bookmark
        );
    }

    async getQueryState(searchableQuery) {
        const query = new Queries(this.ctx, this.name);
        return await query.queryByAdhoc(searchableQuery);
    }

    async deleteState(key) {
        const ledgerKey = this.ctx.stub.createCompositeKey(
            this.name,
            StateManager.splitKey(key)
        );
        await this.ctx.stub.deleteState(ledgerKey);
    }

    async updateState(state) {
        const key = this.ctx.stub.createCompositeKey(
            this.name,
            state.getSplitKey()
        );
        const data = StateManager.serialize(state);
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
