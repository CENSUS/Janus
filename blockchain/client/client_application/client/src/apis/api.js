import axios from "axios";
import config from "../config";
import * as apiBackendEndpoints from "../utils/constants/apiBackendConstants";

if (process.env.NODE_ENV !== "development") {
    axios.defaults.baseURL = config.baseUrl;
}

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const auth = token ? `Bearer ${token}` : "";

        const backendToken = localStorage.getItem("backendToken");
        const backendAuth = backendToken ? `Bearer ${backendToken}` : "";

        const identity = localStorage.getItem("identity") || null;

        config.headers.common["Authorization"] = auth;
        config.headers.common["Content-Type"] = "application/json";
        config.headers.common["BackendAuthorization"] = backendAuth;
        config.headers.common["Identity"] = identity;
        return config;
    },
    (request) => request,
    (error) => Promise.reject(error.message)
);

axios.interceptors.response.use(
    (response) => response,
    function (error) {
        if (error.response && error.response.data)
            return Promise.reject({ response: error.response.data });
        return Promise.reject(error.message);
    }
);

const api = {
    // Common Routes
    login: (body) => {
        return axios.post(apiBackendEndpoints.LOGIN_ENDPOINT, body);
    },
    refreshToken: (body) => {
        return axios.post(apiBackendEndpoints.REFRESH_TOKEN_ENDPOINT, body);
    },
    logout: (body) => {
        return axios.delete(apiBackendEndpoints.LOGOUT_ENDPOINT, body);
    },
    syncWithBC: (body) => {
        return axios.post(apiBackendEndpoints.SYNC_WITH_BC_ENDPOINT, body);
    },
    // Admin Routes
    registerUser: (body) => {
        return axios.post(apiBackendEndpoints.REGISTER_USER_ENDPOINT, body);
    },
    vote: (body) => {
        return axios.post(apiBackendEndpoints.VOTE_ENDPOINT, body);
    },
    updateTrustAnchors: (body) => {
        return axios.post(
            apiBackendEndpoints.UPDATE_TRUST_ANCHORS_ENDPOINT,
            body
        );
    },
    addCA: (body) => {
        return axios.post(apiBackendEndpoints.ADD_CA_ENDPOINT, body);
    },
    removeCA: (body) => {
        return axios.post(apiBackendEndpoints.REMOVE_CA_ENDPOINT, body);
    },
    syncWithBCStakeholderElections: (body) => {
        return axios.get(
            apiBackendEndpoints.SYNC_WITH_BC_STAKEHOLDER_ELECTIONS_ENDPOINT,
            body
        );
    },
    syncWithBCelectionsExtraInfo: (body) => {
        return axios.get(
            apiBackendEndpoints.SYNC_WITH_BC_ELECTION_EXTRA_INFO_ENDPOINT,
            { params: { ...body } }
        );
    },
    // Auditor Routes
    retrieveLogsInit: (body) => {
        return axios.post(apiBackendEndpoints.RETRIEVE_LOG_INIT_ENDPOINT, body);
    },
    retrieveLogs: (body) => {
        return axios.post(apiBackendEndpoints.RETRIEVE_LOGS_ENDPOINT, body);
    },
    syncAudits: (body) => {
        return axios.post(apiBackendEndpoints.SYNC_AUDITS_ENDPOINT, body);
    },
    // Client Routes
    requestAccess: (body) => {
        return axios.post(apiBackendEndpoints.REQUEST_ACCESS_ENDPOINT, body);
    },
    syncWithBCClientsRequests: (body) => {
        return axios.post(apiBackendEndpoints.SYNC_WITH_BC_ENDPOINT, body);
    },
    getData: (body) => {
        return axios.post(apiBackendEndpoints.GET_DATA_FROM_BC_ENDPOINT, body);
    },
    combinedIdentities: (body) => {
        return axios.get(
            apiBackendEndpoints.GET_COMBINED_IDENTITIES_ENDPOINT,
            body
        );
    },
    combineIdentities: (body) => {
        return axios.post(
            apiBackendEndpoints.COMBINE_IDENTITIES_ENDPOINT,
            body
        );
    },
    deleteCombinedIdentity: (body) => {
        return axios.delete(
            apiBackendEndpoints.DELETE_COMBINED_IDENTITY_ENDPOINT,
            body
        );
    },
    toggleCombinedIdentity: (body) => {
        return axios.post(
            apiBackendEndpoints.TOGGLE_COMBINED_IDENTITY_ENDPOINT,
            body
        );
    },
    userValidation: () => {
        return axios.get(apiBackendEndpoints.USER_VALIDATION_ENDPOINT);
    },
};

export default api;
