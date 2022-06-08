"use strict";

// When PSC is invoked by another CC in order to start a new Election, the data provided by the other CC should be passed to this Class in order to have an appropriate data Object

class ElectionInitData {
    constructor(payload) {
        if (
            !payload["electionID"] ||
            !payload["electionType"] ||
            !payload["audience"] ||
            !payload["dataHash"] ||
            !payload["comment"] ||
            !payload["stakeholders"]
        )
            throw new Error(`Malformed Election data`);

        this.electionID = payload["electionID"];
        this.electionType = payload["electionType"];
        this.audience = payload["audience"];
        this.dataHash = payload["dataHash"];
        this.comment = payload["comment"];
        this.stakeholders = payload["stakeholders"];
        this.stakeholdersLength = Object.keys(payload["stakeholders"]).length;

        return this;
    }

    setStakeholders(_stakeholders) {
        this.stakeholders = _stakeholders;
    }

    setStakeholdersLength(_stakeholdersLength) {
        this.stakeholdersLength = _stakeholdersLength;
    }
}
module.exports = ElectionInitData;
