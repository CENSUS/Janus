const router = require("express").Router();
const NetworkManager = require("../../management/managers_dependencies/network_manager.js");
const StatsManager = require("../../management/statistics/stats_manager.js");
const {
  ticketManager,
  lobby,
} = require("./../../middlewares/services/queues/queueManager.js");
const { promiseHandler } = require("./../../utils/processors/various.js");
const {
  normalizeCCResponse,
  decodeText,
  chaincodeResponseResolver,
} = require("./../../utils/processors/client_processor.js");
const {
  metrics: { metricsOn },
} = require("../../config/main_config.js");
const {
  serviceAuthorization,
  getCallActionType,
  checkIfShouldRevokeTicket,
  checkIfTicketIsNotRevoked,
} = require("./../../middlewares/services/serviceAuthorization.js");

router.post(
  "/acquire-ticket",
  StatsManager.ticketTimers().startTimer,
  ticketManager,
  lobby,
  StatsManager.ticketTimers().endTimer,
  async function (req, res, next) {
    const { ticket } = res.locals;

    try {
      const serviceJwt = NetworkManager.acquireServiceJwt(ticket);
      res.send(serviceJwt);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/communicate-with-bc",
  StatsManager.bcCommunicationTimers().startTimer,
  serviceAuthorization,
  checkIfTicketIsNotRevoked,
  getCallActionType,
  checkIfShouldRevokeTicket,
  async function (req, res, next) {
    const { ticket } = res.locals;
    const { actionToCall } = res.locals;

    switch (actionToCall) {
      case "EVALUATE": {
        const { signedProposal } = req.body;

        const [proposalResponse, proposalResponseErr] = await promiseHandler(
          NetworkManager.evaluateProposal(ticket, signedProposal)
        );

        if (proposalResponseErr) {
          next(proposalResponseErr.message);
          return;
        }

        const response = Array.from(proposalResponse);

        res.send(response);
        break;
      }
      case "ENDORSE": {
        const { signedProposal } = req.body;

        const [endorsedProposalResponse, endorsedProposalResponseErr] =
          await promiseHandler(
            NetworkManager.endorseProposal(ticket, signedProposal)
          );

        !endorsedProposalResponseErr
          ? res.send(endorsedProposalResponse)
          : next(endorsedProposalResponseErr.message);
        break;
      }
      case "COMMIT": {
        const { signedEndorsedTransaction } = req.body;

        const [transactionResponse, transactionResponseErr] =
          await promiseHandler(
            NetworkManager.commitTransaction(ticket, signedEndorsedTransaction)
          );

        if (transactionResponseErr) {
          next(transactionResponseErr.message);
          return;
        }

        const originalResponse = normalizeCCResponse(transactionResponse);
        const decodedResponse = decodeText(originalResponse);

        let commitResponse = null;
        try {
          commitResponse = chaincodeResponseResolver(decodedResponse);
        } catch (err) {
          next(err);
          return;
        }

        if (
          metricsOn &&
          commitResponse.details &&
          commitResponse.details.requestID
        ) {
          StatsManager.combineRequestIDWithTicketID(
            commitResponse.details.requestID,
            ticket.ticketID
          );
        }

        res.send(transactionResponse);

        break;
      }
      default:
        throw new GeneralError("Internal error");
    }

    next();
  },
  StatsManager.bcCommunicationTimers().endTimer
);

module.exports = router;
