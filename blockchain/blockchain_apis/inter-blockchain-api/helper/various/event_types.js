module.exports = {
  RetrieveLogRequestDisapproved: {
    eventHumanReadable: "Retrieve Log Request Disapproved",
    shouldForward: false,
  },
  RetrieveLogRequestApproved: {
    eventHumanReadable: "Retrieve Log Request Approved",
    shouldForward: false,
  },
  RequestForwardPBCtoDBC: {
    eventHumanReadable: "Request Forward PBC to DBC",
    shouldForward: true,
    forwardParameters: {
      from: "BASE",
      to: "DOMAIN",
    },
  },
  RegistrationRequestApproved: {
    eventHumanReadable: "Registration Request Approved",
    shouldForward: false,
  },
  NewCAAppended: {
    eventHumanReadable: "New CA Appended",
    shouldForward: false,
  },
  RevokedCA: {
    eventHumanReadable: "Revoked CA",
    shouldForward: false,
  },
  PolicyEnforcementAccepted: {
    eventHumanReadable: "Policy Enforcement Accepted",
    shouldForward: false,
    shouldAvoid: true,
  },
  PolicyEnforcementDeclined: {
    eventHumanReadable: "Policy Enforcement Declined",
    shouldForward: false,
    shouldAvoid: true,
  },
  ElectionInitiated: {
    isSpecialType: true,
    eventHumanReadable: "Election Initiated",
    shouldForward: false,
    shouldAvoid: false,
    isElectionType: true,
    electionInitiated: true,
  },
  BallotUpdated: {
    isSpecialType: true,
    eventHumanReadable: "Ballot Update",
    shouldForward: false,
    isElectionType: true,
    electionBallotUpdate: true,
  },
  ElectionEnded: {
    isSpecialType: true,
    eventHumanReadable: "Election Ended",
    shouldForward: false,
    isElectionType: true,
    electionEndedUpdate: true,
  },
};
