const NetworkManager = require("../../../management/managers_dependencies/network_manager.js");
const _ = require("lodash");

const ticketManager = function (req, res, next) {
  const { willAccessBC, willCommit } = req.body;

  if (willAccessBC) {
    const { issuerOrganization: organization } =
      res.locals.authenticated_identity;

    // Clients ask for a Ticket to contact the BC, based on their Organization
    const ticket = NetworkManager.acquireTicket(organization, willCommit);

    res.locals.ticket = ticket;

    next();
  } else {
    next();
  }
};

const lobby = function (req, res, next) {
  req.on("aborted", () => console.log("Disconnected user!"));
  const { willAccessBC } = req.body;

  if (willAccessBC) {
    const ticket = res.locals.ticket;
    NetworkManager.enterLobby(ticket, function () {
      next();
    });
  } else {
    next();
  }
};

module.exports = { ticketManager: ticketManager, lobby: lobby };
