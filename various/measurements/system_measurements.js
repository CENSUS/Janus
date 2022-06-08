import {
  deriveCertFromIdentity,
  derivePKFromIdentity,
  signData,
  constructSignedIdentities,
  constructBackendHeaders,
  constructBackendBCPayload,
  constructBackendServiceHeaders,
  combineBackendHeaders,
  promiseHandler,
  normalizeCCResponseFromBackend,
  decodeText,
  chaincodeResponseResolver,
  logMsg,
} from "./utilities/various.js";
import fs from "fs";
const REQUESTS = JSON.parse(fs.readFileSync("./requests.json", "utf-8"));
import FUNCTION_TYPES from "./functionTypes.js";
import clientGateway from "./blockchain/clientGateway.js";
import {
  acquireBackendToken,
  acquireBlockchainTicket,
  communicateWithBC,
} from "./api/apiAccessor.js";
import async from "async";
import chalk from "chalk";

class SystemMeasurements {
  constructor(
    username,
    organization,
    endpoints,
    userCreds,
    request_type,
    req_invocations
  ) {
    this.userInfo = {
      username,
      organization,
      userCreds,
      request_type,
      req_invocations,
      other: {},
    };
    this.ENDPOINTS = endpoints;
  }

  async init() {
    const backendToken = await this.getBackendToken();
    this.userInfo.other.backendToken = backendToken;

    const constructedArguments = this.constructPayload(
      REQUESTS[this.userInfo.request_type]
    );

    const query = async function (callback) {
      const response = await this.runQuery("COMMIT", constructedArguments);
      const { transactionID, requestID } = response.details;

      callback(null, transactionID, requestID);
    }.bind(this);

    async.times(
      this.userInfo.req_invocations,
      async function (n) {
        logMsg(
          chalk.bgGray.white(
            `[${this.userInfo.organization}, ${this.userInfo.username}] - Request Nr: ${n}`
          )
        );
        await query(
          function (err, txID, reqID) {
            logMsg(
              chalk.green(
                `[${this.userInfo.organization}, ${this.userInfo.username}] - Request Nr: ${n} was successfully received by the System - TXID: ${txID}, REQID: ${reqID}`
              )
            );
          }.bind(this)
        );
        return n;
      }.bind(this),
      function (error) {
        if (error) {
          logMsg(
            chalk.bgRed.white.bold(
              `[${this.userInfo.organization}, ${this.userInfo.username}] - Error: ${error}`
            )
          );
        }
      }.bind(this)
    );
  }

  async getBackendToken() {
    const identity = this.userInfo.userCreds;

    const certificate = deriveCertFromIdentity(identity);
    const privKey = derivePKFromIdentity(identity);

    // Create a signature from: the certificate, signed by: the private key
    const signature = signData(certificate, privKey).toString("base64");

    // Create the payload for the Backend API
    const payload = {
      certificate,
      signature,
    };

    return await acquireBackendToken(payload);
  }

  async acquireTicket() {
    const willAccessBC = true;
    const willCommit = true;

    const headers = constructBackendHeaders(this.userInfo.other.backendToken);
    const payload = constructBackendBCPayload(willAccessBC, willCommit);

    const serviceJWT = await acquireBlockchainTicket(headers, payload);
    return serviceJWT;
  }

  async constructServiceHeaders(ticket) {
    const backendHeaders = constructBackendHeaders(
      this.userInfo.other.backendToken
    );

    const serviceHeaders = constructBackendServiceHeaders(ticket);

    const combinedHeaders = combineBackendHeaders(
      backendHeaders,
      serviceHeaders
    );

    return combinedHeaders;
  }

  constructPayload(args) {
    const identity = this.userInfo.userCreds;
    const usedIdentities = constructSignedIdentities(identity, []);
    return [usedIdentities, args];
  }

  async runQuery(type, constructedArguments) {
    const ticket = await this.acquireTicket(this.userInfo);

    const serviceHeaders = await this.constructServiceHeaders(ticket);

    switch (type) {
      case "COMMIT": {
        return await this.doCommit(
          this.userInfo.userCreds,
          FUNCTION_TYPES.client.requestAccess,
          constructedArguments,
          serviceHeaders
        );
      }
    }
  }

  async doCommit(identity, functionParams, ccArguments, serviceAuthorization) {
    const gateway = new clientGateway(identity);

    // Create the proposal
    const proposal = gateway.createProposal(functionParams, ccArguments);

    // Sign the proposal's digest
    const signedProposal = await gateway.signProposal(proposal);

    // Construct the proposal payload - This payload will be forwarded to the Backend API
    const signedProposalPayload =
      gateway.constructEndorsementProposal(signedProposal);

    // Forward the proposal and await for endorsement
    const [endorsedProposal, endorsedProposalErr] = await promiseHandler(
      communicateWithBC(serviceAuthorization, signedProposalPayload)
    );

    if (endorsedProposalErr) throw new Error(endorsedProposalErr);

    // Parse the endorsed proposal to its original data (mainly, Array => Uint8Array)
    const parsedEndorsedProposal =
      gateway.parseBackendEndorsedProposalResponse(endorsedProposal);

    // Signed the (endorsed) transaction's digest
    const signedTransactionDigest = await gateway.signEndorsedTransaction(
      parsedEndorsedProposal
    );

    // Construct the transaction payload - This payload will be forwarded to the Backend API
    // Now we do not need to send the whole transaction info (i.e. TRANSACTION BYTES + DIGEST)
    // The `TRANSACTION BYTES` of the transaction are, temporarily, stored by the Backend API itself
    // Thus, we only need to send the signed digest of the transaction
    const transactionPayload = gateway.constructCommitTransaction(
      signedTransactionDigest
    );

    // Ask the Backend API to commit the transaction - The transaction payload includes only the (signed) transaction digest
    const [commitedTransaction, commitedTransactionErr] = await promiseHandler(
      communicateWithBC(serviceAuthorization, transactionPayload)
    );

    if (commitedTransactionErr) throw new GeneralError(commitedTransactionErr);

    const originalResponse =
      normalizeCCResponseFromBackend(commitedTransaction);
    const decodedResponse = decodeText(originalResponse);
    const commitResponse = chaincodeResponseResolver(decodedResponse);

    return commitResponse;
  }
}

export default SystemMeasurements;
