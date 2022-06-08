"use strict";

const timeReg = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])?$/;

const hasher = require("crypto").createHash;

const timestampToMilliseconds = (timestamp) => {
    return (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000;
};

const timestampToDate = (timestamp) => {
    return new Date(
        (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000
    );
};

const promiseHandler = async (promise) => {
    return promise
        .then((data) => [data, undefined])
        .catch((error) => Promise.resolve([undefined, error]));
};

const response = (condition, message) => ({
    condition,
    message,
});

const bufferResponse = (condition, message) =>
    Buffer.from(JSON.stringify({ condition, message }));

const accessNestedJSON = (object, ...args) => {
    return args.reduce((object, level) => object && object[level], object);
};

const jsonParser = (str) => {
    try {
        const parsed = JSON.parse(str);
        return parsed;
    } catch (err) {
        return str;
    }
};

const deriveIdCNFromCID = (cid) =>
    cid
        .getID()
        .split("::")[1] // [0]: X509, [1]: Subject, [2]: Issuer
        .split("/")
        .filter((item) => item)
        .map((item) => item.split("="))
        .filter((item) => item[0] === "CN")
        .flat()[1]; // [0]: shortName (e.g. OU, CN etc.), [1]: value

module.exports = {
    timeReg,
    hasher: hasher,
    promiseHandler: promiseHandler,
    response: response,
    bufferResponse: bufferResponse,
    accessNestedJSON: accessNestedJSON,
    jsonParser: jsonParser,
    deriveIdCNFromCID: deriveIdCNFromCID,
    timestampToMilliseconds: timestampToMilliseconds,
    timestampToDate: timestampToDate,
};
