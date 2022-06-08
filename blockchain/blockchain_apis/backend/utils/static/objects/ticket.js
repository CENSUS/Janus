const _ = require("lodash");

class Ticket {
  constructor(payload) {
    if (
      !payload["ticketID"] ||
      !payload["organization"] ||
      !payload["time"] ||
      !_.isBoolean(payload["shouldCommit"])
    )
      throw new Error(`Malformed Ticket`);

    this.ticketID = payload["ticketID"];
    this.organization = payload["organization"];
    this.time = payload["time"];
    this.shouldCommit = payload["shouldCommit"];
    this.isRevoked = false;
    return this;
  }
}

module.exports = Ticket;
