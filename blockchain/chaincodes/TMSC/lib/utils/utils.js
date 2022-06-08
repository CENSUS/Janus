"use strict";

const checkIfBASE64Encoded = (str) =>
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(
        str
    );

const promiseHandler = async (promise) => {
    return promise
        .then((data) => [data, undefined])
        .catch((error) => Promise.resolve([undefined, error]));
};

const buildEntityRole = (roleName) => {
    return `ROLE_${roleName}`;
};

const timestampToMilliseconds = (timestamp) => {
    return (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000;
};

const timestampToDate = (timestamp) => {
    return new Date(
        (timestamp.seconds.low + timestamp.nanos / 1000000 / 1000) * 1000
    );
};

const jsonParser = (str) => {
    try {
        return JSON.parse(str);
    } catch (err) {
        return str;
    }
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

// reducerStakeholders takes as input the name of a Stakeholder (string) and a list of stakeholders (e.g. {"ATTIKON_HOSPITAL :{}, ..."})
// and returns a new Object that does not carry the provided Stakeholder
const reducerStakeholders = (stakeholderName, stakeholderList) => {
    return Object.keys(stakeholderList)
        .filter(
            (stakeholder) =>
                !matchStrings(
                    stakeholderName,
                    stakeholderList[stakeholder].name
                )
        )
        .reduce((res, key) => ((res[key] = stakeholderList[key]), res), {});
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
    response: response,
    bufferResponse: bufferResponse,
    matchStrings: matchStrings,
    jsonParser: jsonParser,
    fetchPartialCompositeKey: fetchPartialCompositeKey,
    promiseHandler: promiseHandler,
    timestampToMilliseconds: timestampToMilliseconds,
    timestampToDate: timestampToDate,
    reducerStakeholders: reducerStakeholders,
    buildEntityRole: buildEntityRole,
    checkIfBASE64Encoded: checkIfBASE64Encoded,
    deriveIdCNFromCID: deriveIdCNFromCID,
};
