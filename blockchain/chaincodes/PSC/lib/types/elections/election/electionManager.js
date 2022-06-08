"use strict";

const StateConnector = require("../../../ledger-connector/stateConnector");
const ChaincodeCommunicator = require("../../../utils/helper/interChaincode/chaincodeCommunicator");
const Election = require("./election");

class ElectionManager extends StateConnector {
    constructor(ctx) {
        super(ctx, "ELECTION");
        this.ctx = ctx;
        this.use(Election);
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

    async startElection(cid, electionInstance) {
        const communicator = ChaincodeCommunicator.createInstance(
            this.ctx,
            "PSC",
            "majorityConsentInit"
        );

        await communicator.makeContact([electionInstance.electionInfo]);

        return [communicator.response, communicator.error, electionInstance];
    }
}

module.exports = ElectionManager;
