const jwt = require("jsonwebtoken");
const config = require("../../config/main_config.js");
const {
  getTicketByID,
  defineCurrentCallAction,
  revokeTicket,
} = require("../../management/managers_dependencies/network_manager.js");
const { UnauthorizedRequest } = require("./../utils/error_types.js");

const serviceAuthorization = function (req, res, next) {
  const authHeader = req.headers.serviceauthorization;

  try {
    if (authHeader) {
      const token = authHeader.split(" ")[1];

      jwt.verify(token, config.jwtPass, function (err, data) {
        if (err) throw new UnauthorizedRequest(err);
        const { ticketType, ticketID } = data;

        try {
          // Upon successful verification, get the ticket and add it into the res.locals
          const ticketInfo = getTicketByID(ticketType, ticketID);
          res.locals["ticket"] = ticketInfo.ticket;

          next();
        } catch (err) {
          next(err.message);
        }
      });
    } else {
      throw new UnauthorizedRequest("Provide a valid Service Token");
    }
  } catch (err) {
    next(err.message);
  }
};

const checkIfTicketIsNotRevoked = function (req, res, next) {
  const { ticket } = res.locals;

  if (ticket.isRevoked)
    throw new UnauthorizedRequest(
      "You are not authorized for this action. Please, try again."
    );

  next();
};

const getCallActionType = function (req, res, next) {
  const { ticket } = res.locals;

  try {
    const actionToCall = defineCurrentCallAction(ticket);

    res.locals.actionToCall = actionToCall;

    next();
  } catch (err) {
    next(err.message);
  }
};

const checkIfShouldRevokeTicket = function (req, res, next) {
  const { ticket, actionToCall } = res.locals;

  revokeTicket(ticket, actionToCall);

  next();
};

module.exports = {
  serviceAuthorization: serviceAuthorization,
  getCallActionType: getCallActionType,
  checkIfTicketIsNotRevoked: checkIfTicketIsNotRevoked,
  checkIfShouldRevokeTicket: checkIfShouldRevokeTicket,
};
