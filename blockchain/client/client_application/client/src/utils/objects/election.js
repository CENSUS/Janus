import moment from "moment";
import {
  loadAvailableOrganizations,
  matchStrings,
  removeUnderscoreFromString,
} from "../processors/data_processors";
const organizationsData = loadAvailableOrganizations();

const deriveOrganizationData = (orgMSP) => {
  return Object.values(organizationsData)
    .flat()
    .filter((org) => matchStrings(orgMSP, org.msp));
};

class Election {
  constructor(payload) {
    if (
      !payload["electionID"] ||
      !payload["electionType"] ||
      !payload["audience"] ||
      // eslint-disable-next-line no-negated-in-lhs
      !"votersCount" in payload ||
      // eslint-disable-next-line no-negated-in-lhs
      !"audienceMajorityNr" in payload ||
      !payload["creator"] ||
      !payload["challengeData"] ||
      !payload["dataHash"] ||
      !payload["comment"] ||
      !payload["startDate"] ||
      !payload["validUntil"]
    )
      throw new Error(`Malformed Election data of new Election`);

    const organizationData =
      deriveOrganizationData(payload["creator"])[0] || null;

    this.electionID = payload["electionID"];
    this.electionType = removeUnderscoreFromString(
      payload["electionType"].toUpperCase()
    );
    this.audience = payload["audience"];
    this.votersCount = payload["votersCount"];
    this.audienceMajorityNr = payload["audienceMajorityNr"];
    this.organization = `${organizationData["name"]} (UUID: ${organizationData["uuid"]})`;
    this.challengeData = payload["challengeData"];
    this.dataHash = payload["dataHash"];
    this.comment = payload["comment"];
    this.startDate = moment(payload["startDate"]).format("YYYY-MM-DD HH:mm");
    this.validUntil = moment(payload["validUntil"]).format("YYYY-MM-DD HH:mm");

    return this;
  }
}

export default Election;
