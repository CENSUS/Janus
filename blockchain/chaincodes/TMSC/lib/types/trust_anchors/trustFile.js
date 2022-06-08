"use strict";

const StateManager = require("../../ledger-connector/stateManager");
const { inspectTypeOfInput } = require("./helper/helper");
const { checkIfBASE64Encoded } = require("../../utils/utils");
const { KNOWN_FILE_TYPES } = require("../../utils/constants");

/**
 * `KNOWN_FILE_TYPES` is an Object that defines the various files' types
 * that the System handles, along with their State Key
 */

class TrustFile extends StateManager {
    constructor(object = undefined) {
        super(TrustFile.getClass());
        if (object) {
            Object.assign(this, object);
        } else {
            this.isValidFile = null;
            this.data = null;
            this.organization = null;
            this.fileType = null;
        }
    }

    async defineFile(ctx, file, isNewCA = false, isInit = false) {
        const extractedData = await inspectTypeOfInput(
            ctx,
            file,
            isNewCA,
            isInit
        );

        const [isAcceptedDoc, extractedType, extractedExtraData] = [
            extractedData.condition,
            extractedData.message.type,
            extractedData.message.extraData,
        ];

        this.isValidFile =
            isAcceptedDoc &&
            Object.keys(KNOWN_FILE_TYPES).includes(extractedType);

        if (this.isValidFile) {
            this.data = extractedExtraData.data;
            this.organization = extractedExtraData.stakeholder.toLowerCase();
            this.fileType = extractedType;
            this.createKey([
                KNOWN_FILE_TYPES[this.fileType],
                this.organization,
            ]);
        } else {
            this.error = extractedExtraData.errorMessage;
        }
    }

    /**
     * Basic getters
     */
    getFileOrganizationOwner() {
        return this.organization;
    }

    getIsValidFile() {
        return this.isValidFile;
    }

    getFileType() {
        return this.fileType;
    }

    getData() {
        return this.data;
    }

    getDataCleartext() {
        return this.data && checkIfBASE64Encoded(this.data)
            ? Buffer.from(this.data, "base64").toString("utf-8")
            : this.data;
    }

    /**
     *
     * Basic setters
     */

    setIsRevoked(revokeValue = true) {
        this.isRevoked = revokeValue;
    }

    /**
     * `createInstance` is a `factory` method that creates File objects
     */
    static createInstance(file) {
        return new TrustFile(file);
    }

    static getClass() {
        return "trustanchorsfile";
    }
}

module.exports = TrustFile;
