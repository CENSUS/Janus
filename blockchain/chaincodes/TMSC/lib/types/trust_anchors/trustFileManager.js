"use strict";

const StateConnector = require("../../ledger-connector/stateConnector");
const StateManager = require("../../ledger-connector/stateManager");
const { cryptoHasher: hasher } = require("../../helper");
const { timestampToDate, deriveIdCNFromCID } = require("../../utils/utils");
const TrustFile = require("./trustFile");
const ChaincodeCommunicator = require("../../utils/helper/interChaincode/chaincodeCommunicator");
const Stakeholder = require("../stakeholders/stakeholder");
const constants = require("../../utils/constants");

class TrustFileManager extends StateConnector {
    constructor(ctx) {
        super(ctx, "TRUST_FILE");
        this.ctx = ctx;
        this.use(TrustFile);
    }

    async add(file) {
        return this.addState(file);
    }

    async get(fileKey) {
        return this.getState(fileKey);
    }

    async getHistory(fileKey) {
        return this.getHistoryState(fileKey);
    }

    async update(file) {
        return this.updateState(file);
    }

    async updateLogs(ctx, cid, file) {
        const serializedFile = StateManager.serialize(file);
        const dataHash = hasher("sha1").update(serializedFile).digest("hex");

        const proxyOrganizationsKey = Stakeholder.makeKey([
            constants.proxyStakeholders,
        ]);
        const proxyOrganizationsInstance = await ctx.stakeholderManager.get(
            proxyOrganizationsKey
        );

        const { domain, isRevoked } =
            proxyOrganizationsInstance.getStakeholderDetails(file.organization);

        if (isRevoked)
            throw new Error(
                `The Organizations is revoked [ORGANIZATION: ${file.organization}, DOMAIN: ${domain}]`
            );

        const updateLogDetails = {
            txID: this.ctx.stub.getTxID(),
            invoker: deriveIdCNFromCID(cid),
            invokerMSP: cid.getMSPID(),
            subject: file.organization,
            docType: file.fileType,
            dataHash: dataHash,
            invocationTime: timestampToDate(this.ctx.stub.getTxTimestamp()),
            domain,
        };

        const communicator = ChaincodeCommunicator.createInstance(
            this.ctx,
            "LSC",
            "updateLog"
        );

        await communicator.makeContact([updateLogDetails]);
        return [communicator.response, communicator.error, updateLogDetails];
    }
}

module.exports = TrustFileManager;
