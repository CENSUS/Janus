"use strict";
const got = require("got");
const fs = require("fs");
const {
    accessNestedJSON,
    jsonParser,
    promiseHandler,
    matchStrings,
    delay,
} = require("./utils/utils");

const values = require("./utils/values");

const service_token = fs.readFileSync(
    "/var/run/secrets/kubernetes.io/serviceaccount/token",
    "utf8"
);

const tls_ca_ministry = fs.readFileSync(
    process.env.TLS_CA_MINISTRY_CERT_FILE,
    "utf8"
);
const tls_cert_ministry = fs.readFileSync(
    process.env.TLS_MINISTRY_CERT_FILE,
    "utf8"
);
const tls_key_ministry = fs.readFileSync(
    process.env.TLS_CERT_MINISTRY_KEY_FILE,
    "utf8"
);

const forwardToDBCApi = async (data) => {
    const makeContact = () =>
        got(`https://${values.dbc_api_address}:${values.dbc_api_port}`, {
            method: "POST",
            https: {
                certificate: tls_cert_ministry,
                key: tls_key_ministry,
                certificateAuthority: tls_ca_ministry,
            },
            headers: {
                "content-type": "application/json",
            },
            body: data,
        });

    const [response, responseErr] = await promiseHandler(makeContact());

    if (responseErr) throw new Error("Could not communicate with the DBC API");

    return response.body || {};
};

const authenticateWithVault = async () => {
    let [token, availableToken] = [null, false];
    const refreshTime = Date.now();

    const [response, _] = await promiseHandler(
        got(
            `https://${values.vault_address}:${values.vault_port}/${values.vault_login_endpoint}`,
            {
                method: "POST",
                https: {
                    certificate: tls_cert_ministry,
                    key: tls_key_ministry,
                    certificateAuthority: tls_ca_ministry,
                },
                headers: {
                    "content-type": "application/json",
                },
                json: {
                    jwt: service_token,
                    role: values.vault_role,
                },
            }
        )
    );

    const vault_token_data = jsonParser(response.body) || {};

    if (vault_token_data && vault_token_data.auth) {
        // Vault Authentication achieved - Extract the token
        token = vault_token_data.auth.client_token;
        availableToken = true;
    }

    return {
        availableToken,
        refreshTime,
        token,
    };
};

const decryptWithVault = async (vault_token, data, GID) => {
    const vault_data_to_decrypt = {
        cryptogram: data,
        sub_policy: values.system_decryption_policy,
    };

    let [vaultResponse, vaultResponseErr] = [null, null];

    const doDecryption = async () => {
        [vaultResponse, vaultResponseErr] = await promiseHandler(
            got(
                `https://${values.vault_address}:${values.vault_port}/${values.vault_sys_decrypt_endpoint}/${GID}`,
                {
                    method: "POST",
                    https: {
                        certificate: tls_cert_ministry,
                        key: tls_key_ministry,
                        certificateAuthority: tls_ca_ministry,
                    },
                    headers: {
                        "X-Vault-Token": vault_token,
                        "content-type": "application/json",
                    },
                    json: vault_data_to_decrypt,
                }
            )
        );
    };

    do {
        if (vaultResponseErr) {
            console.log(
                "Vault Decryption Error - Will retry in a while...",
                vaultResponseErr
            );
            await delay(Math.floor(Math.random() * (6000 - 3000) + 3000));
        }
        await doDecryption();
    } while (vaultResponseErr || !vaultResponse);

    if (!vaultResponseErr) {
        const vault_sys_decryption_response = jsonParser(vaultResponse.body);
        const wrapped_sys_decrypted_key = accessNestedJSON(
            vault_sys_decryption_response,
            "data",
            "b64_enc_data_sysdec"
        );
        if (wrapped_sys_decrypted_key) {
            return wrapped_sys_decrypted_key;
        }
    }

    return;
};

const decryptNestedJSON = async (object, vaultToken, GID) => {
    for (const key in object) {
        if (matchStrings(key, "wrapped_encryption_key"))
            object[key] = await decryptWithVault(vaultToken, object[key], GID);

        if (object[key] !== null && Array.isArray(object[key])) {
            let index = 0;
            for (const elem of object[key]) {
                object[key][index] = await decryptNestedJSON(
                    elem,
                    vaultToken,
                    GID
                );
                index++;
            }
        }

        if (object[key] !== null && typeof object[key] === "object") {
            object[key] = await decryptNestedJSON(object[key], vaultToken, GID);
        }
    }

    return object;
};

module.exports = {
    decryptNestedJSON,
    forwardToDBCApi,
    authenticateWithVault,
    decryptWithVault,
};
