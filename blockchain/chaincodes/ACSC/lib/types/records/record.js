"use strict";

const StateManager = require("../../ledger-connector/stateManager");

class Record extends StateManager {
    constructor(object) {
        super(Record.getClass(), [
            object.type,
            object.dataType,
            object.GID,
            object.requestHash,
        ]);
        Object.assign(this, object);
    }

    /**
     * Basic getters
     */

    /**
     * Basic setters
     */

    /**
     * `createInstance` is a `factory` method that creates Record objects
     */

    static createInstance(
        type,
        dataType,
        GID,
        requestHash,
        policyEnforcementDetails
    ) {
        return new Record({
            type,
            dataType,
            GID,
            requestHash,
            policyEnforcementDetails,
        });
    }

    static getClass() {
        return "records";
    }
}
module.exports = Record;
