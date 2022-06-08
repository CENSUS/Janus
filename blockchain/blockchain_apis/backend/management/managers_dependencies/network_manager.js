const Ticket = require("./../../utils/static/objects/ticket.js");
const MessageBroker = require("./../queues/message_broker.js");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const {
  jsonParser,
  matchStrings,
  promiseHandler,
  prepareEndorsedProposalForClient,
  prepareCommitedTransactionForClient,
} = require("./../../utils/processors/various.js");
const blockchainManager = require("../blockchain_manager");
const getQueueInfo = require("./../../config/queues/queue_config.js");
const TicketManager = require("./ticket_manager");
const {
  deriveBasicAttributesFromCert,
  constructCertificate,
} = require("./../../utils/processors/client_processor.js");
const { GeneralError } = require("../../middlewares/utils/error_types.js");

class NetworkPlanner {
  constructor() {
    this.organizations = blockchainManager.availableOrganizations;
    this.networks = {};

    this.ticketCallbacks = {};

    this.#preloadNetworkInstances();
    this.queueConfig = getQueueInfo;

    MessageBroker.getInstance().then((broker) => {
      this.messageBroker = broker;
      this.#initializeBasePosts(broker);
    });
  }

  // Initializers
  #preloadNetworkInstances() {
    Object.keys(this.organizations).forEach((organization) => {
      if (!this.networks[organization]) this.networks[organization] = {};
      this.organizations[organization].forEach(
        (peer, peerIndex) =>
          (this.networks[organization][peer] =
            blockchainManager.getNetworkInstance(organization, peer))
      );
    });
  }

  async #initializeBasePosts(broker) {
    const TICKETS_QUEUE_EVAL_CONFIG = this.queueConfig(
      "TICKETS_QUEUE_EVALUATE"
    );
    const TICKETS_QUEUE_SUBMIT_CONFIG = this.queueConfig(
      "TICKETS_QUEUE_SUBMIT"
    );

    await broker.subscribeTicketsChannel(
      TICKETS_QUEUE_EVAL_CONFIG["QUEUE_NAME"],
      (msg, ack) => {
        // ack(); // Should be the last thing to do
        const ticket = jsonParser(msg.content.toString());
        // this.#prepareTicket(ticket, ack);
        this.#sendToManager(ticket, ack);
      },
      TICKETS_QUEUE_EVAL_CONFIG["MAX_CONCURRENT_CLIENTS"]
    );

    await broker.subscribeTicketsChannel(
      TICKETS_QUEUE_SUBMIT_CONFIG["QUEUE_NAME"],
      (msg, ack) => {
        // ack() // Should be the last thing to do
        const ticket = jsonParser(msg.content.toString());
        // this.#prepareTicket(ticket, ack);
        this.#sendToManager(ticket, ack);
      },
      TICKETS_QUEUE_SUBMIT_CONFIG["MAX_CONCURRENT_CLIENTS"]
    );
  }

  #sendToManager(ticket, queueAck) {
    TicketManager.appendFromQueue({ ticket, queueAck });

    this.ticketCallbacks[ticket["ticketID"]].ticketAcceptedCallback();
    delete this.ticketCallbacks[ticket["ticketID"]];
  }

  enterLobby(ticket, nextCallback) {
    if (!nextCallback)
      throw new GeneralError("Internal error, please try again");

    this.ticketCallbacks[ticket["ticketID"]] = {
      ticketAcceptedCallback: nextCallback,
    };

    // Sift the ticket
    // This will start the whole procedure of the client's request
    this.messageBroker.sendTicket(
      `TICKETS_QUEUE_${ticket.shouldCommit ? "SUBMIT" : "EVALUATE"}`,
      JSON.stringify(ticket)
    );
  }

  acquireServiceJwt(ticket) {
    try {
      return TicketManager.generateServiceJwt(ticket);
    } catch (err) {
      console.log(err);
    }
  }

  getTicketByID(ticketPool, ticketID) {
    try {
      return TicketManager.getTicketByID(ticketPool, ticketID);
    } catch (err) {
      throw new GeneralError(err);
    }
  }

  defineCurrentCallAction(ticket) {
    try {
      return TicketManager.defineCurrentCallAction(ticket);
    } catch (err) {
      throw new GeneralError(err);
    }
  }

  revokeTicket(ticket, actionToCall) {
    if (actionToCall === "EVALUATE" || actionToCall === "COMMIT")
      TicketManager.revokeTicket(ticket);
  }

  // Every Ticket should have a `shouldComit` provided. This way we can identify if a request is `expensive`
  // Submitting to BC is more expensive than just evaluating
  acquireTicket(organization, shouldCommit = false) {
    return new Ticket({
      ticketID: uuidv4(),
      organization,
      time: Date.now(),
      shouldCommit,
    });
  }

  validateUser(certificate) {
    const constructedCertificate = constructCertificate(certificate);
    const certificateBasicInfo = deriveBasicAttributesFromCert(
      constructedCertificate
    );

    const certificateOrg = _.first(
      Object.keys(this.organizations).filter((org) =>
        matchStrings(org, certificateBasicInfo.issuerOrganization)
      )
    );

    const randomPeer =
      this.organizations[certificateOrg][
        _.random(0, this.organizations[certificateOrg].length - 1)
      ];

    const orgInstance = this.networks[certificateOrg][randomPeer];

    return {
      isValidated: orgInstance.validateCertificate(constructedCertificate),
      basicInfo: certificateBasicInfo,
    };
  }

  async evaluateProposal(ticket, signedProposal) {
    const { organization } = ticket;

    const evaluationOrg = _.first(
      Object.keys(this.organizations).filter((org) =>
        matchStrings(org, organization)
      )
    );

    const randomPeer =
      this.organizations[evaluationOrg][
        _.random(0, this.organizations[evaluationOrg].length - 1)
      ];

    TicketManager.saveOrgDetailsToTicket(ticket, evaluationOrg, randomPeer);

    const orgInstance = this.networks[evaluationOrg][randomPeer];

    const [evaluationProposal, evaluationProposalErr] = await promiseHandler(
      orgInstance.evaluateProposal(signedProposal)
    );

    TicketManager.saveTransactionDataToTicket(ticket, evaluationProposal);

    if (evaluationProposalErr)
      throw new GeneralError(evaluationProposalErr.message);

    return evaluationProposal;
  }

  async endorseProposal(ticket, signedProposal) {
    const { organization } = ticket;

    const evaluationOrg = _.first(
      Object.keys(this.organizations).filter((org) =>
        matchStrings(org, organization)
      )
    );

    const randomPeer =
      this.organizations[evaluationOrg][
        _.random(0, this.organizations[evaluationOrg].length - 1)
      ];

    TicketManager.saveOrgDetailsToTicket(ticket, evaluationOrg, randomPeer);

    const orgInstance = this.networks[evaluationOrg][randomPeer];

    const [endorsedProposal, endorsedProposalErr] = await promiseHandler(
      orgInstance.endorseProposal(signedProposal)
    );

    TicketManager.saveTransactionDataToTicket(ticket, endorsedProposal);

    if (endorsedProposalErr)
      throw new GeneralError(endorsedProposalErr.message);

    const proposalForClient =
      prepareEndorsedProposalForClient(endorsedProposal);

    return proposalForClient;
  }

  async commitTransaction(ticket, clientSignedTransaction) {
    const { organization: evaluationOrg, peer: randomPeer } =
      TicketManager.getOrgDetailsFromTicket(ticket);

    const orgInstance = this.networks[evaluationOrg][randomPeer];

    // Get the saved `endorsed` proposal from the cache
    const transactionData = TicketManager.getBytesFromTicket(ticket, "ENDORSE");
    const { transactionBytes } = transactionData;

    // Get the signed digest (the digest that was sent to the client to sign it)
    const { signedDigest } = clientSignedTransaction;

    const [commitedTransaction, commitedTransactionErr] = await promiseHandler(
      orgInstance.commitTransaction(transactionBytes, signedDigest)
    );

    TicketManager.saveTransactionDataToTicket(ticket, commitedTransaction);

    if (commitedTransactionErr)
      throw new GeneralError(commitedTransactionErr.message);

    const commitedResponseForClient =
      prepareCommitedTransactionForClient(commitedTransaction);

    return commitedResponseForClient;
  }
}

module.exports = new NetworkPlanner();
