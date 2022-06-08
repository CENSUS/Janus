"use strict";

const {
  promiseHandler,
} = require("../helper/data_processors/various_processors");
const styles = require("../helper/various/indicators");
const {
  decodeText,
  chaincodeResponseResolver,
} = require("./gateway_utilities/utils");

class BlockchainInterconnector {
  constructor() {}

  async appendToBaseQueue(msg) {
    try {
      await this.sendToBaseQueue(msg);
      return true;
    } catch (err) {
      console.log(`Queue failure, ${err}`);
      return false;
    }
  }

  async appendToDomainQueue(msg) {
    try {
      await this.sendToDomainQueue(msg);
      return true;
    } catch (err) {
      console.log(`Queue failure, ${err}`);
      return false;
    }
  }

  async forwardRequest(transactionData) {
    const {
      requestData: {
        txid: TRANSACTION_ID,
        from: REQUEST_BASE,
        to: REQUEST_DESTINATION,
      },
    } = transactionData;

    console.log(
      styles.YELLOW,
      `Forwarding ${TRANSACTION_ID} [FROM: ${REQUEST_BASE} - TO: ${REQUEST_DESTINATION}]`
    );

    switch (REQUEST_DESTINATION) {
      case "BASE": {
        return await this.#forwardRequestToBaseDomain(transactionData);
      }
      case "DOMAIN": {
        return await this.#forwardRequestToOrgDomain(transactionData);
      }
      default:
        return;
    }
  }

  async #forwardRequestToOrgDomain(transactionData) {
    const {
      // requestData: { txid, org, orgMSP, from, to },
      requestData: { orgMSP },
      dataToPush: { invoker, userRole, data_id, TXID: txID, REQID: reqID },
    } = transactionData;

    const CHANNEL = this.getFromOrgConfig("channel");

    const proposal = this.peerDomainGateway
      .getNetwork(CHANNEL)
      .getContract("ACSC")
      .newProposal("policyEnf", {
        arguments: [JSON.stringify(userRole), data_id],
        endorsingOrganizations: [orgMSP],
      });

    let proposalBytes, proposalDigest;
    try {
      proposalBytes = proposal.getBytes();
      proposalDigest = proposal.getDigest();
    } catch (err) {
      console.error("Proposal error", err);
      return;
    }

    const signedDigest = await this.peerSigner(proposalDigest);

    const signedOrgProposal = this.peerDomainGateway.newSignedProposal(
      proposalBytes,
      signedDigest
    );

    const [endorsementRes, endorsementResErr] = await promiseHandler(
      signedOrgProposal.endorse()
    );

    if (endorsementResErr) {
      // Endorsement Error Code 10 means that the Endorsement was aborted:
      // `failed to collect enough transaction endorsements`
      // Repeat the procedure and add the request back to the BaseQueue (Proxy Queue)
      // in order to retry and collect the mandatory endorsements
      if (endorsementResErr.code === 10)
        await this.appendToDomainQueue(transactionData);

      return;
    }

    let endorsedProposalBytes, endorsedProposalDigest;
    try {
      endorsedProposalBytes = endorsementRes.getBytes();
      endorsedProposalDigest = endorsementRes.getDigest();
    } catch (err) {
      console.error("Endorsed proposal error", err);
      return;
    }

    const signedEndorsedProposalDigest = await this.peerSigner(
      endorsedProposalDigest
    );

    const signedTransaction = this.peerDomainGateway.newSignedTransaction(
      endorsedProposalBytes,
      signedEndorsedProposalDigest
    );

    const [_, commitResErr] = await promiseHandler(signedTransaction.submit());

    if (commitResErr) console.error("Commit error", commitResErr);

    const endorsementResult = signedTransaction.getResult();

    let DBResponse = decodeText(endorsementResult);

    try {
      DBResponse = chaincodeResponseResolver(DBResponse);
    } catch (_) {
      // Call Chaincode again by appending the transaction data back to the Domain Queue
      // The Chaincode raised an error, so the transaction
      // was not included in a Block. Thus, there is no issue with "redoing" the process.
      await this.appendToDomainQueue(transactionData);
      return;
    }

    const responseMessage = {
      data: {
        invoker,
        txID,
        reqID,
        approved: DBResponse["condition"],
      },
      transientData: DBResponse["message"],
    };

    const newTransactionData = this.#updateRequestDataDetails(
      transactionData,
      responseMessage
    );

    return newTransactionData;
  }

  async #forwardRequestToBaseDomain(transactionData) {
    const {
      // requestData: { txid, org, orgMSP, from, to },
      dataToPush: { data, transientData: transient },
    } = transactionData;

    const transientData = {
      database_response: Buffer.from(JSON.stringify(transient) || ""),
    };

    const CHANNEL = this.getFromOrgConfig("channel");
    const AVAILABLE_MSPs = this.availableMSPs["proxy"];

    const proposal = this.peerBaseGateway
      .getNetwork(CHANNEL)
      .getContract("PSC")
      .newProposal("updateFromDBC", {
        arguments: [JSON.stringify(data)],
        transientData,
        endorsingOrganizations: AVAILABLE_MSPs,
      });

    let proposalBytes, proposalDigest;
    try {
      proposalBytes = proposal.getBytes();
      proposalDigest = proposal.getDigest();
    } catch (err) {
      console.error("Proposal error", err);
      return;
    }

    const signedDigest = await this.peerSigner(proposalDigest);

    const signedOrgProposal = this.peerBaseGateway.newSignedProposal(
      proposalBytes,
      signedDigest
    );

    const [endorsementRes, endorsementResErr] = await promiseHandler(
      signedOrgProposal.endorse()
    );

    if (endorsementResErr) {
      // Endorsement Error Code 10 means that the Endorsement was aborted:
      // `failed to collect enough transaction endorsements`
      // Repeat the procedure and add the request back to the BaseQueue (Proxy Queue)
      // in order to retry and collect the mandatory endorsements
      if (endorsementResErr.code === 10)
        await this.appendToBaseQueue(transactionData);

      return;
    }

    let endorsedProposalBytes, endorsedProposalDigest;
    try {
      endorsedProposalBytes = endorsementRes.getBytes();
      endorsedProposalDigest = endorsementRes.getDigest();
    } catch (err) {
      console.error("Endorsement error", err);
    }

    const signedEndorsedProposalDigest = await this.peerSigner(
      endorsedProposalDigest
    );

    const signedTransaction = this.peerBaseGateway.newSignedTransaction(
      endorsedProposalBytes,
      signedEndorsedProposalDigest
    );

    const [commitRes, commitResErr] = await promiseHandler(
      signedTransaction.submit()
    );

    if (commitResErr) {
      console.errror("Commit error", commitResErr);
    }

    const transactionResult = signedTransaction.getResult();

    return transactionResult;
  }

  // Helpers

  #updateRequestDataDetails(currentTransactionData, newDataToPush) {
    const currentFrom = currentTransactionData.requestData["from"];
    const currentTo = currentTransactionData.requestData["to"];

    const newTransactionData = {};

    Object.assign(newTransactionData, currentTransactionData);

    newTransactionData["requestData"]["from"] = currentTo;
    newTransactionData["requestData"]["to"] = currentFrom;

    newTransactionData.dataToPush = newDataToPush;

    return newTransactionData;
  }
}

module.exports = BlockchainInterconnector;
