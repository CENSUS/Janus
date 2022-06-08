"use strict";

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

const jsonParser = (str) => {
    try {
        const parsed = JSON.parse(str);
        return parsed;
    } catch (err) {
        return str;
    }
};

const accessNestedJSON = (object, ...args) => {
    return args.reduce((object, level) => object && object[level], object);
};

const promiseHandler = async (promise) => {
    return promise
        .then((data) => [data, undefined])
        .catch((error) => Promise.resolve([undefined, error]));
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
    delay: delay,
    jsonParser: jsonParser,
    accessNestedJSON: accessNestedJSON,
    promiseHandler: promiseHandler,
    matchStrings: matchStrings,
    response: response,
    bufferResponse: bufferResponse,
    deriveIdCNFromCID: deriveIdCNFromCID,
};
