"use strict";

class Election {
    constructor(payload, currentTimestamp = null) {
        if (
            !payload["electionID"] ||
            !payload["electionType"] ||
            !payload["audience"] ||
            !"votersCount" in payload ||
            !"audienceMajorityNr" in payload ||
            !payload["creator"] ||
            !payload["challengeData"] ||
            !payload["dataHash"] ||
            !payload["comment"] ||
            (!currentTimestamp &&
                !payload["startDate"] &&
                !payload["validUntil"])
        )
            throw new Error(`Malformed Election data of new Election`);

        this.electionID = payload["electionID"];
        this.electionType = payload["electionType"];
        this.audience = payload["audience"];
        this.votersCount = payload["votersCount"];
        this.audienceMajorityNr = payload["audienceMajorityNr"];
        this.creator = payload["creator"];
        this.challengeData = payload["challengeData"];
        this.dataHash = payload["dataHash"];
        this.comment = payload["comment"];
        this.startDate = payload["startDate"] || new Date(currentTimestamp);
        // this.validUntil = new Date(currentTimestamp + 5 * 24 * 60 * 60 * 1000); // This is valid for 5 days - e.g. for 3 days: 3 * 24 * 60 * 60 * 1000 = 3 days - `validUntil` is the available nr. of days for the stakeholders to cast their vote
        this.validUntil =
            payload["validUntil"] || new Date(currentTimestamp + 1 * 60 * 1000);

        return this;
    }
}
module.exports = Election;
