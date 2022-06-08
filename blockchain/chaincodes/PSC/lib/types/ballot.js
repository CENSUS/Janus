"use strict";

class Ballot {
    constructor(payload = {}) {
        this.signed = payload["signed"] || false;
        this.approved = payload["approved"] || null;
        this.signedData = payload["signedData"] || null;
        this.timeOfVote = payload["timeOfVote"] || null;
        return this;
    }
}
module.exports = Ballot;
