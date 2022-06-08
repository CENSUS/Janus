"use strict";

const StateManager = require("../../ledger-connector/stateManager");
const constants = require("../../utils/constants");
const { hasher, jsonParser } = require("../../utils/utils");
const requestIDCreator = (data) =>
    hasher("sha1")
        .update(typeof data !== "string" ? JSON.stringify(data) : data)
        .digest("hex");

class Record extends StateManager {
    constructor(object) {
        switch (object.recordInfo.type) {
            case constants.REQUEST_LOG: {
                super(Record.getClass(), [
                    object.recordInfo.type,
                    object.recordInfo.parameters.domain,
                    object.recordInfo.parameters.organization,
                    object.recordInfo.parameters.invoker,
                    object.recordInfo.requestID,
                ]);
                break;
            }
            case constants.UPDATE_LOG: {
                super(Record.getClass(), [
                    object.recordInfo.type,
                    object.recordInfo.parameters.domain,
                    object.recordInfo.parameters.subject,
                    object.recordInfo.parameters.docType,
                ]);
                break;
            }
            default:
                super(Record.getClass());
                break;
        }
        Object.assign(this, object);
    }

    /**
     * Basic getters
     */

    // UPDATE LOGS
    getRecordUpdateNr() {
        if (this.recordInfo.type !== constants.UPDATE_LOG) return;
        return this.recordInfo.updateNr;
    }

    /**
     * Basic setters
     */

    // REQUEST LOGS
    setFulfilled() {
        if (this.recordInfo.type !== constants.REQUEST_LOG) return;
        if (!this.recordData.info.fulfilled)
            this.recordData.info.fulfilled = !this.recordData.info.fulfilled;
    }

    setApproval(approval) {
        if (this.recordInfo.type !== constants.REQUEST_LOG) return;
        if (
            typeof this.recordData.info.approved !== "boolean" &&
            !this.recordData.info.approved
        )
            this.recordData.info.approved = approval;
    }

    setAccessibleUntil(accessibleUntil) {
        if (this.recordInfo.type !== constants.REQUEST_LOG) return;
        if (!this.recordData.info.accessibleUntil)
            this.recordData.info.accessibleUntil = accessibleUntil;
    }

    // UPDATE LOGS
    raiseUpdateNr() {
        if (this.recordInfo.type !== constants.UPDATE_LOG) return;
        this.recordInfo.updateNr++;
    }

    // COMMON
    prepareNewRecord() {
        switch (this.recordInfo.type) {
            case constants.REQUEST_LOG:
                if (!this.recordData.info) {
                    this.recordData.info = {};
                    this.recordData.info.fulfilled = false;
                    this.recordData.info.approved = null;
                }
                break;
            case constants.UPDATE_LOG:
                this.recordInfo.updateNr = 1;
                break;
            default:
                break;
        }
    }

    /**
     * `createInstance` is a `factory` method that creates Record objects
     */
    static createInstance(
        created_at,
        type,
        parameters,
        data = undefined,
        requestID = undefined
    ) {
        switch (type) {
            case constants.REQUEST_LOG: {
                // It, first, recreates the requestID identifier from the request details (:= data) that it received from the PSC
                const parsedData = jsonParser(data);
                if (!requestID && !parsedData.requestID)
                    requestID = requestIDCreator(data);

                if (parsedData.requestID) requestID = parsedData.requestID;

                return new Record({
                    recordInfo: { type, parameters, requestID },
                    recordData: {
                        data,
                    },
                    created_at,
                });
            }
            case constants.UPDATE_LOG: {
                return new Record({
                    recordInfo: { type, parameters },
                    recordData: { data },
                    created_at,
                });
            }
            default:
                break;
        }
    }

    static getClass() {
        return "records";
    }
}
module.exports = Record;
