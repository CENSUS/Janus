"use strict";
const { Contract } = require("fabric-contract-api");
const { Shim } = require("fabric-shim");
const { forwardToDBCApi, decryptNestedJSON } = require("./helper.js");
const VaultManager = require("./types/vaultManager.js");
const { jsonParser, promiseHandler } = require("./utils/utils.js");

class KSSC extends Contract {
    constructor() {
        super();
        this.VaultManager = new VaultManager();
        this.VaultManager.init();
    }

    /**
     * `requestData` is triggered by the ACSC when roles and temporal roles are
     * verified for the client.
     *
     * It accepts a data_id, which is a JSON object that defines the request
     * e.g. data_00 {"SSN": "patient_SSN"}
     * and the GID of a Client.
     *
     * When triggered, it communicates with the DBC API and forwards the `data_id` to it.
     * Then, the DBC API sends the request to the DB API. The response that is received from it,
     * is returned back to the KSSC.
     * When the response from the DBC API is successfully received, KSSC authenticates itself with Vault.
     * Upon successful authentication, a token is returned. With this token, KSSC is able to perfom System Decryption over the
     * response that was received from the DBC API.
     *
     * In order to System Decrypt the DBC response, KSSC iterates over all the available keys of the response.
     * If a key has the name `wrapped_encryption_key`, KSSC sends its value, along with the acquired Vault token
     * and the (system) decryption policy (e.g. `SA`), to Vault.
     * Vault decrypts the data internally and returns the decrypted value to KSSC. Then KSSC replaces the initial (encrypted) value of
     * the key, with the system decrypted value that it acquired from Vault.
     *
     * When the iteration over the available keys of the DBC response and all the system decryptions are completed,
     * KSSC returns the modified (system decrypted) response back to the ACSC.
     *
     * @param {*} ctx
     * @param {*} data_id
     * @param {*} GID
     */
    async requestData(ctx, data_id, GID) {
        const [dbcResponse, dbcResponseErr] = await promiseHandler(
            forwardToDBCApi(data_id)
        );

        if (dbcResponseErr) return Shim.error(dbcResponseErr.message);

        let orgData = jsonParser(dbcResponse);

        if (orgData) {
            const vaultToken = this.VaultManager.getToken();
            if (Array.isArray(orgData)) {
                let index = 0;
                for (const elem of orgData) {
                    orgData[index] = await decryptNestedJSON(
                        elem,
                        vaultToken,
                        GID
                    );
                    index++;
                }
            } else {
                orgData = await decryptNestedJSON(orgData, vaultToken, GID);
            }
        }

        return Shim.success(Buffer.from(JSON.stringify(orgData)));
    }
}
module.exports = KSSC;
