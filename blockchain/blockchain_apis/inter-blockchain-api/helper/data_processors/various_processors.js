"use strict";

const events = require("../various/event_types");

module.exports = {
  chaincodeResponseResolver: function (data) {
    data = Buffer.from(data, "base64");
    data = module.exports.jsonParser(data.toString("utf8"));
    // The actual payload
    const buffer = Buffer.from(data.payload, "base64");
    const response = module.exports.jsonParser(buffer.toString("utf8"));
    return response;
  },

  defineRoutingKey(routingKeyString) {
    const routingKeyParts = routingKeyString.split(".");

    return {
      domain: routingKeyParts[0],
      organization: routingKeyParts[1],
      peer: routingKeyParts[2],
    };
  },

  jsonParser: function (str) {
    try {
      JSON.parse(str);
    } catch (err) {
      return str;
    }
    return JSON.parse(str);
  },

  promiseHandler: function (promise) {
    return promise
      .then((data) => [data, undefined])
      .catch((error) => Promise.resolve([undefined, error]));
  },

  matchStrings: function (str, compStr, caseSensitive = false) {
    return str.localeCompare(compStr, undefined, {
      sensitivity: caseSensitive ? "case" : "base",
    }) === 0
      ? true
      : false;
  },

  canStillReachConsensus: function (
    currentNr,
    totalNr,
    approvalsNr,
    majorityNr
  ) {
    return totalNr - (currentNr - approvalsNr) >= majorityNr;
  },

  accessNestedJSON: function (object, ...args) {
    return args.reduce((object, level) => object && object[level], object);
  },

  getSpecialTypeEvents: function () {
    return Object.keys(events).filter(
      (eventName) => events[eventName].isSpecialType
    );
  },

  peerNameNormalizer: function (peer) {
    return peer.replace(/-/g, "_");
  },

  getOrgConfig: function (peer) {
    return JSON.parse(
      Buffer.from(process.env[`${peer}_fabric_config`] || "{}")
    );
  },
};
