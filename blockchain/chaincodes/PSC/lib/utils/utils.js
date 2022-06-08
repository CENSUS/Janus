"use strict";

const buildEntityRole = (roleName) => {
    return `ROLE_${roleName}`;
};

const jsonParser = (str) => {
    try {
        return JSON.parse(str);
    } catch (err) {
        return str;
    }
};

const promiseHandler = async (promise) => {
    return promise
        .then((data) => [data, undefined])
        .catch((error) => Promise.resolve([undefined, error]));
};

const timestampToMilliseconds = (timestamp) => {
    return (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000;
};

const timestampToDate = (timestamp) => {
    return new Date(
        (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000
    );
};

const matchStrings = (str, compStr, caseSensitive = false) => {
    return str.localeCompare(compStr, undefined, {
        sensitivity: caseSensitive ? "case" : "base",
    }) === 0
        ? true
        : false;
};

const response = (condition, message) => ({
    condition,
    message,
});

const bufferResponse = (condition, message) =>
    Buffer.from(JSON.stringify({ condition, message }));

const cryptoHasher = require("crypto").createHash;

const deriveIdCNFromCID = (cid) =>
    cid
        .getID()
        .split("::")[1] // [0]: X509, [1]: Subject, [2]: Issuer
        .split("/")
        .filter((item) => item)
        .map((item) => item.split("="))
        .filter((item) => item[0] === "CN")
        .flat()[1]; // [0]: shortName (e.g. OU, CN etc.), [1]: value

const checkIfBASE64Encoded = (str) =>
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(
        str
    );

module.exports = {
    buildEntityRole: buildEntityRole,
    jsonParser: jsonParser,
    promiseHandler: promiseHandler,
    timestampToMilliseconds: timestampToMilliseconds,
    timestampToDate: timestampToDate,
    matchStrings: matchStrings,
    response: response,
    bufferResponse: bufferResponse,
    cryptoHasher: cryptoHasher,
    deriveIdCNFromCID: deriveIdCNFromCID,
    checkIfBASE64Encoded: checkIfBASE64Encoded,
};
