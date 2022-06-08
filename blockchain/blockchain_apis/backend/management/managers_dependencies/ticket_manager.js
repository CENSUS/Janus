"use strict";

const styles = require("./../../config/styles.js");

const { jwtSign } = require("./../../utils/crypto/jwt.js");
const {
  GeneralError,
  UnauthorizedRequest,
} = require("../../middlewares/utils/error_types.js");

const CHECK_EXPIRED_TICKETS_EVERY = 500;
const INFORM_ABOUT_DELETED_EVERY = 60000;
const INFORM_ABOUT_CHECKS_EVERY = 5000;

class TicketManager {
  constructor() {
    this.ticketsPool = {};
    this.ticketsPoolInfo = {};
  }

  // PUBLIC SECTION
  generateServiceJwt(ticket) {
    const type = this.#acquireType(ticket);
    if (!this.ticketsPool[type][ticket.ticketID])
      throw new GeneralError("Unknown Ticket ID");

    return jwtSign(
      { ticketID: ticket.ticketID, ticketType: ticket.pool },
      "100s"
    );
  }

  getTicketByID(ticketPool, ticketID) {
    if (!this.ticketsPool[ticketPool][ticketID])
      throw new GeneralError(
        "You are not authorized to access the services. The provided ticket is invalid. Please, try again."
      );

    return this.ticketsPool[ticketPool][ticketID];
  }

  appendFromQueue(msg) {
    this.#managerLogger(styles.RED, `Received a new request`);
    const { ticket } = msg;
    const type = this.#acquireType(ticket);

    msg["submittedAt"] = Date.now();

    this.#addTicketTypeToPool(type);
    this.#initializeTicketInfo(ticket);
    this.#initializeTicketAvailableActions(ticket);

    this.ticketsPool[type][ticket.ticketID] = msg;
  }

  defineCurrentCallAction(ticket) {
    const {
      pool,
      ticketInfo: { actionTypes },
    } = ticket;

    switch (pool) {
      case "EVALUATE": {
        if (!actionTypes.EVALUATE.state) {
          ticket.ticketInfo.actionTypes.EVALUATE.state = true;
          return "EVALUATE";
        } else {
          throw new GeneralError("Ticket error");
        }
      }
      case "SUBMIT": {
        if (!actionTypes.ENDORSE.state && !actionTypes.COMMIT.state) {
          ticket.ticketInfo.actionTypes.ENDORSE.state = true;
          return "ENDORSE";
        } else if (actionTypes.ENDORSE.state && !actionTypes.COMMIT.state) {
          ticket.ticketInfo.actionTypes.COMMIT.state = true;
          return "COMMIT";
        } else if (actionTypes.ENDORSE.state && actionTypes.COMMIT.state) {
          throw new UnauthorizedRequest(
            `You're not authorized for this action`
          );
        }
      }
    }
  }

  getOrgDetailsFromTicket(ticket) {
    return ticket.ticketInfo.organizationDetails;
  }

  saveOrgDetailsToTicket(ticket, organization, peer) {
    ticket.ticketInfo.organizationDetails = { organization, peer };
  }

  saveTransactionDataToTicket(ticket, transactionData) {
    const {
      pool,
      ticketInfo: { actionTypes },
    } = ticket;

    switch (pool) {
      case "EVALUATE": {
        if (actionTypes.EVALUATE.state) {
          ticket.ticketInfo.actionTypes.EVALUATE.transactionData =
            transactionData;
        } else {
          throw new UnauthorizedRequest(
            "You're not authorized for this action"
          );
        }
        break;
      }
      case "SUBMIT": {
        if (actionTypes.ENDORSE.state && !actionTypes.COMMIT.state) {
          ticket.ticketInfo.actionTypes.ENDORSE.transactionData =
            transactionData;
        } else if (actionTypes.ENDORSE.state && actionTypes.COMMIT.state) {
          ticket.ticketInfo.actionTypes.COMMIT.transactionData =
            transactionData;
        } else if (!actionTypes.ENDORSE.state && !actionTypes.COMMIT.state) {
          throw new UnauthorizedRequest(
            `You're not authorized for this action`
          );
        }
        break;
      }
      default:
        return;
    }
  }

  getBytesFromTicket(ticket, bytesType) {
    const {
      ticketInfo: { actionTypes },
    } = ticket;

    return actionTypes[bytesType].transactionData;
  }

  /**
   * When a ticket is used (i.e. no other action is available), it must be revoked
   * If a ticket does not get revoked, then Ticket Manager will automatically revoke/delete it
   * However, revoking the ticket when no other action is available, is STRONGLY recommended
   * i.e. When a client asks to Evaluate, then the ticket should be used only once (one call to service = one action)
   * When a clients asks to Commit, then the ticket should be used only twice (1st call => endorse, 2nd call => commit)
   * @param {*} ticket
   */
  revokeTicket(ticket) {
    this.#revokeTicket(ticket.pool, ticket.ticketID);
    this.#acknowledgeQueue(ticket.pool, ticket.ticketID);
  }

  // PRIVATE SECTION
  #acquireType(ticket) {
    if (ticket.shouldCommit) {
      ticket.pool = "SUBMIT";
    } else {
      ticket.pool = "EVALUATE";
    }

    return ticket.pool;
  }

  #addTicketTypeToPool(poolName) {
    if (!Object.keys(this.ticketsPool).includes(poolName)) {
      this.ticketsPool[poolName] = {};
      this.ticketsPoolInfo[poolName] = {
        totalDeleted: 0,
        deletedSinceLastCheck: 0,
        lastInformedAboutChecksAt: Date.now(),
      };
      this.#inspector(poolName);
    }
  }

  #initializeTicketInfo(ticket) {
    ticket.ticketInfo = {};
    ticket.ticketInfo.actionTypes = {};
    ticket.ticketInfo.organizationDetails = {};
  }

  #initializeTicketAvailableActions(ticket) {
    if (ticket.shouldCommit) {
      ticket.ticketInfo.actionTypes = {
        ENDORSE: { state: false, transactionData: null },
        COMMIT: { state: false, transactionData: null },
      };
    } else {
      ticket.ticketInfo.actionTypes = {
        EVALUATE: { state: false, transactionData: null },
      };
    }
  }

  #inspector(poolName) {
    const inspectorLog = (poolName) => {
      this.#managerLogger(
        styles.GREEN,
        `For pool: ${poolName} - In the last ${
          INFORM_ABOUT_DELETED_EVERY / 1000
        } seconds, ${
          this.ticketsPoolInfo[poolName].deletedSinceLastCheck
        } revoked/expired Ticket(s) were deleted. Total revoked/expired Tickets: ${
          this.ticketsPoolInfo[poolName].totalDeleted
        }`
      );

      reinitializeCurrentDeletedForPool(poolName);

      setTimeout(inspectorLog.bind(this, poolName), INFORM_ABOUT_DELETED_EVERY);
    };

    const inspector = (poolName) => {
      if (
        Date.now() - this.ticketsPoolInfo[poolName].lastInformedAboutChecksAt >
        INFORM_ABOUT_CHECKS_EVERY
      ) {
        this.#managerLogger(
          styles.MAGENTA,
          `Reminder: The Manager checks for expired/revoked tickets at pool: ${poolName} every ${
            CHECK_EXPIRED_TICKETS_EVERY / 1000
          } seconds...`
        );

        updateLastInformAboutChecks();
      }

      if (Object.keys(this.ticketsPool[poolName]).length > 0) {
        Object.values(this.ticketsPool[poolName]).forEach((submission) => {
          if (
            Date.now() - submission.submittedAt >= 180000 ||
            submission.ticket.isRevoked
          ) {
            const ticketID = submission.ticket.ticketID;
            this.#deleteTicket(poolName, ticketID);

            if (!submission.ticket.isRevoked) submission.queueAck();

            raiseCurrentDeletedForPool(poolName);
          }
        });
      }
      setTimeout(inspector.bind(this, poolName), CHECK_EXPIRED_TICKETS_EVERY);
    };

    const raiseCurrentDeletedForPool = (poolName) => {
      this.ticketsPoolInfo[poolName].deletedSinceLastCheck++;
    };

    const reinitializeCurrentDeletedForPool = (poolName) => {
      this.ticketsPoolInfo[poolName].totalDeleted +=
        this.ticketsPoolInfo[poolName].deletedSinceLastCheck;

      this.ticketsPoolInfo[poolName].deletedSinceLastCheck = 0;
    };

    const updateLastInformAboutChecks = () => {
      this.ticketsPoolInfo[poolName].lastInformedAboutChecksAt = Date.now();
    };

    setTimeout(inspector.bind(this, poolName), CHECK_EXPIRED_TICKETS_EVERY);
    setTimeout(inspectorLog.bind(this, poolName), CHECK_EXPIRED_TICKETS_EVERY);
  }

  #revokeTicket(poolName, ticketID) {
    this.ticketsPool[poolName][ticketID]["ticket"].isRevoked = true;
  }

  #acknowledgeQueue(poolName, ticketID) {
    this.ticketsPool[poolName][ticketID].queueAck();
  }

  #deleteTicket(poolName, ticketID) {
    delete this.ticketsPool[poolName][ticketID];
  }

  #managerLogger(style, msg) {
    console.log(style, `[TICKET MANAGER] ${msg}`);
  }
}

module.exports = new TicketManager();
