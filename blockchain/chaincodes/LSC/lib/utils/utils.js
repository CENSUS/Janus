"use strict";

const hasher = require("crypto").createHash;

const buildEntityRole = (roleName) => {
    return `ROLE_${roleName}`;
};

const jsonParser = (str) => {
    try {
        const parsed = JSON.parse(str);
        return parsed;
    } catch (err) {
        return str;
    }
};

const response = (condition, message) => ({
    condition,
    message,
});

const bufferResponse = (condition, message) =>
    Buffer.from(JSON.stringify({ condition, message }));

const timestampToMilliseconds = (timestamp) => {
    return (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000;
};

const timestampToDate = (timestamp) => {
    return new Date(
        (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000
    );
};

const fetchPartialCompositeKey = async (
    ctx,
    indexType,
    attributes,
    onlyLastElement = false
) => {
    const valueIterator = await ctx.stub.getStateByPartialCompositeKey(
        indexType,
        attributes
    );
    let results = [];
    while (true) {
        let res = await valueIterator.next();

        if (res.value && res.value.value.toString()) {
            let jsonRes = {};
            jsonRes.Key = res.value.key;
            try {
                jsonRes.Record = res.value.value.toString("utf8");
            } catch (err) {
                jsonRes.Record = res.value.value.toString("utf8"); //?
            }
            results.push(jsonRes);
        }
        if (res.done) {
            await valueIterator.close();
            if (onlyLastElement) return results[results.length - 1];

            return results;
        }
    }
};

const matchStrings = (str, compStr, caseSensitive = false) => {
    return str.localeCompare(compStr, undefined, {
        sensitivity: caseSensitive ? "case" : "base",
    }) === 0
        ? true
        : false;
};

const promiseHandler = async (promise) => {
    return promise
        .then((data) => [data, undefined])
        .catch((error) => Promise.resolve([undefined, error]));
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

const constructMetadataResponse = (
    extraRecordsProbability,
    RecordsCount,
    Bookmark
) => ({ extraRecordsProbability, RecordsCount, Bookmark });

module.exports = {
    buildEntityRole: buildEntityRole,
    jsonParser: jsonParser,
    response: response,
    bufferResponse: bufferResponse,
    timestampToMilliseconds: timestampToMilliseconds,
    timestampToDate: timestampToDate,
    promiseHandler: promiseHandler,
    fetchPartialCompositeKey: fetchPartialCompositeKey,
    hasher: hasher,
    matchStrings: matchStrings,
    deriveIdCNFromCID: deriveIdCNFromCID,
    constructMetadataResponse: constructMetadataResponse,
};
