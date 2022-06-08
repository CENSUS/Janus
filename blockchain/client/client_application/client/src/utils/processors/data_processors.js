import objectConstants from "../constants/objectConstants";
const crypto = require("crypto");
const sensitiveKeyPrincipals = loadSensitiveKeyPrincipals();

export function loadAvailableOrganizations() {
    return JSON.parse(process.env.REACT_APP_AVAILABLE_ORGANIZATIONS);
}

export function loadAvailableDataRequests() {
    return JSON.parse(process.env.REACT_APP_AVAILABLE_DATA_REQUESTS);
}

export function loadVaultOrgConfig() {
    return JSON.parse(process.env.REACT_APP_VAULT_ORGANIZATIONS_CONFIG);
}

export function loadAccessibleKeyPrincipals() {
    return JSON.parse(process.env.REACT_APP_ACCESSIBLE_KEY_PRINCIPALS);
}

export function loadSensitiveKeyPrincipals() {
    return JSON.parse(process.env.REACT_APP_SENSITIVE_KEY_PRINCIPALS);
}

export function loadABEEncryptionOptions() {
    return JSON.parse(process.env.REACT_APP_ABE_ENCRYPTION_OPTIONS);
}

export function decryptFromDB(ciphertext, key) {
    key = Buffer.from(key, "base64");

    const encrypted = Buffer.from(ciphertext, "base64").toString();
    const encrypted_message = Buffer.from(
        encrypted.substring(encrypted.indexOf(".") + 1),
        "base64"
    );
    const nonce = Buffer.from(
        encrypted.substring(0, encrypted.indexOf(".")),
        "base64"
    );

    let decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(encrypted_message.slice(-16));
    // decipher.setAAD(Buffer.from("Associated data"));

    let decryptedOutput = Buffer.concat([
        decipher.update(encrypted_message.slice(0, -16)),
        decipher.final(),
    ]);

    return decryptedOutput.toString();
}

export const humanReadableIdentifier = (identifier) =>
    objectConstants[identifier];

export function deriveDataID(dataID) {
    return dataID ? Object.keys(JSON.parse(dataID)).map((id) => id)[0] : "";
}

export const removeUnderscoreFromString = (string) => string.replace("_", " ");

export function matchStrings(str, compStr, caseSensitive = false) {
    return str.localeCompare(compStr, undefined, {
        sensitivity: caseSensitive ? "case" : "base",
    }) === 0
        ? true
        : false;
}

export function decryptData(data, decryptionKeys) {
    let dataFromDBResponse = jsonParser(JSON.stringify(data));

    function decryptDataFromObject(object, decryptionKeys) {
        for (const key in object) {
            if (sensitiveKeyPrincipals.includes(key)) {
                const identifier = object["id"] ? object["id"] : object["uuid"];
                object[key] = decryptFromDB(
                    object[key],
                    decryptionKeys[identifier]
                );
                continue;
            }

            if (object[key]) {
                if (Array.isArray(object[key])) {
                    let index = 0;
                    for (const elem of object[key]) {
                        object[key][index] = decryptDataFromObject(
                            elem,
                            decryptionKeys
                        );
                        index++;
                    }
                } else if (typeof object[key] === "object") {
                    object[key] = decryptDataFromObject(
                        object[key],
                        decryptionKeys
                    );
                }
            }
        }

        return object;
    }

    if (typeof dataFromDBResponse === "object") {
        if (!Array.isArray(dataFromDBResponse))
            dataFromDBResponse = [dataFromDBResponse];
        for (const [index, encData] of dataFromDBResponse.entries()) {
            dataFromDBResponse[index] = decryptDataFromObject(
                encData,
                decryptionKeys[index]
            );
        }
        return dataFromDBResponse;
    } else {
        return [{ RESULT: JSON.stringify(dataFromDBResponse) }];
    }
}

export function fetchDecryptionKeysFromData(data, deleteDecryptionKey = false) {
    function fetchEncryptionKeysFromObject(
        object,
        deleteDecryptionKey,
        objectIndex,
        masterEncryptionKeyType = null
    ) {
        for (const key in object) {
            if (key === "wrapped_encryption_key") {
                const identifier = object["id"] ? object["id"] : object["uuid"];
                if (!keys[[objectIndex]]) keys[[objectIndex]] = {};
                keys[objectIndex][identifier] = {
                    masterEncryptionKeyType,
                    encryptedData: object[key],
                };
                if (deleteDecryptionKey) delete object[key];
                continue;
            }

            if (object[key]) {
                if (Array.isArray(object[key])) {
                    let index = 0;
                    for (const elem of object[key]) {
                        object[key][index] = fetchEncryptionKeysFromObject(
                            elem,
                            deleteDecryptionKey,
                            objectIndex,
                            key
                        );
                        index++;
                    }
                } else if (typeof object[key] === "object") {
                    object[key] = fetchEncryptionKeysFromObject(
                        object[key],
                        deleteDecryptionKey,
                        objectIndex,
                        key
                    );
                }
            }
        }

        return object;
    }

    let { encryptedData } = JSON.parse(JSON.stringify(data));
    let keys = {};
    if (!Array.isArray(encryptedData)) encryptedData = [encryptedData];

    for (const objectIndex in encryptedData) {
        encryptedData[objectIndex] = fetchEncryptionKeysFromObject(
            encryptedData[objectIndex],
            deleteDecryptionKey,
            objectIndex
        );
    }

    return [encryptedData, keys];
}

// export function decryptFromDB(ciphertext, key) {
//   let encrypted = Buffer.from(ciphertext, "base64").toString("ascii");
//   key = Buffer.from("MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=", "base64");

//   let nonce = Buffer.from(
//     encrypted.substring(0, encrypted.indexOf(".")),
//     "base64"
//   ).toString("base64");
//   //nonce = Buffer.from("MDEyMzQ1Njc4OTAx", "base64");

//   let encrypted_message = Buffer.from(
//     encrypted.substring(encrypted.indexOf(".") + 1),
//     "base64"
//   ).toString("base64");

//   let decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
//   decipher.setAuthTag(encrypted_message.slice(-16));
//   decipher.setAAD(Buffer.from("some associated data"));

//   let output = Buffer.concat([
//     decipher.update(encrypted_message.slice(0, -16)),
//     decipher.final(),
//   ]);

// }

export function jsonParser(str) {
    try {
        const object = JSON.parse(str);
        return object;
    } catch (err) {
        return str;
    }
}

export function decodeJWT(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
        return null;
    }
}

export function getValuesFromJWT(jwt = null) {
    // The `jwt` should be a decoded Token
    if (!jwt) {
        jwt = localStorage.getItem("token");
        if (!jwt) {
            return {};
        }
    }
    jwt = decodeJWT(jwt);
    return jwt;
}

export function constructDataIDPayload(payload) {
    Object.keys(payload).forEach((elem) => {
        if (!payload[elem] || payload[elem].length === 0) delete payload[elem];
    });

    const { dataID, organization } = payload;

    [("dataID", "organization")].forEach(
        (elem) => payload[elem] && delete payload[elem]
    );

    const constructedPayload = {
        data: {
            [dataID]: {
                parameters: {
                    ...payload,
                },
            },
        },
    };

    if (organization)
        constructedPayload["data"][dataID]["organization"] = organization;
    return constructedPayload;
}

export const PrettyPrintJSON = ({ data }) => (
    <div
        style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            alignItems: "flex-start",
        }}
    >
        <pre>{JSON.stringify(data, null, "\t")}</pre>
    </div>
);

export const appendIdentityToPayload = (payload) =>
    (payload.identity = JSON.parse(localStorage.getItem("identity")) || {});

export const extractInfoFromDataIDRequest = (requestDataID) => {
    if (typeof requestDataID !== "object")
        requestDataID = jsonParser(requestDataID);

    const [organizations, storedDataIDs] = [
        loadAvailableOrganizations(),
        loadAvailableDataRequests(),
    ];

    let [parameters, organizationUUID] = [[], null];

    const utilizedDataIDs = Object.keys(requestDataID);
    const dataIDs = storedDataIDs.filter((id) =>
        utilizedDataIDs.includes(id.value)
    );

    dataIDs.forEach((id) => {
        parameters.push(requestDataID[id.value]["parameters"] || {});
        organizationUUID = requestDataID[id.value]["organization"] || null;
    });

    const organization = organizationUUID
        ? Object.values(organizations)
              .map((orgs) =>
                  orgs.filter((org) => org.uuid === organizationUUID)
              )
              .flat()[0] || "Unknown organization"
        : "Not defined";

    return {
        dataID: dataIDs,
        parameters: parameters,
        organization: organization,
    };
};
