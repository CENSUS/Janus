import axios from "axios";
import * as apiBackendEndpoints from "../utils/constants/apiBackendConstants";
import {
    loadABEEncryptionOptions,
    loadVaultOrgConfig,
} from "../utils/processors/data_processors";
const VAULT_ADDR = `https://${apiBackendEndpoints.VAULT_ADDR_SUBDOMAIN}.${apiBackendEndpoints.INFRASTRUCTURE_ENDPOINT}`;

const vaultOrgsConfig = loadVaultOrgConfig();
const ABEEncryptionOptions = loadABEEncryptionOptions();

const vaultAxios = axios.create({
    baseURL: VAULT_ADDR,
});

vaultAxios.interceptors.request.use(
    (config) => {
        const vaultToken = localStorage.getItem("vaultToken");
        const auth = vaultToken ? `${vaultToken}` : "";
        config.headers.common["X-Vault-Token"] = auth;
        config.headers.common["Content-Type"] = "application/json";
        return config;
    },
    (request) => request,
    (error) => Promise.reject(error.message)
);

vaultAxios.interceptors.response.use(
    (response) => response,
    function (error) {
        if (error.response && error.response.data) {
            return Promise.reject({ response: error.response.data });
        }
        return Promise.reject(error.message);
    }
);

const apiVault = {
    loginWithVault: (body, urlParameter, userOrganization) => {
        return vaultAxios.post(
            `${apiBackendEndpoints.VAULT_LOGIN_ENDPOINT.replace(
                "organization_input",
                userOrganization
            )}/${urlParameter}`,
            body
        );
    },
    fullDecryptWithVault: (body) => {
        const vaultUsername = localStorage.getItem("vaultUsername");
        const {
            encryptionKey: { masterEncryptionKeyType, encryptedData },
            organization,
        } = body;
        const selectedOrg = vaultOrgsConfig[organization];
        const policy = ABEEncryptionOptions[masterEncryptionKeyType];

        const payload = {
            cryptogram: encryptedData,
            sub_policy: policy,
        };

        return vaultAxios.post(
            `${apiBackendEndpoints.VAULT_DOMAIN[selectedOrg.domain]}/${
                apiBackendEndpoints.VAULT_FULL_DECRYPT_ENDPOINT
            }/${vaultUsername}`,
            payload
        );
    },
};

export default apiVault;
