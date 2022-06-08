import * as types from "../../utils/constants/authConstants";
import { getValuesFromJWT } from "../../utils/processors/data_processors";

const INITIAL_STATE = {
    token: localStorage.getItem("token") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    backendToken: localStorage.getItem("backendToken") || null,
    identity: JSON.parse(localStorage.getItem("identity")) || null,
    isAuthenticated: localStorage.getItem("token") ? true : false,
    user: getValuesFromJWT() || {},
    hasErrorMessage: false,
    errorMessage: "",
    freshTokenPromise: false,
    lastUpdated: null,
    isAuthenticatedVault: localStorage.getItem("vaultToken") ? true : false,
    vaultUsername: localStorage.getItem("vaultUsername") || null,
    vaultToken: localStorage.getItem("vaultToken") || null,
};

const logoutLocalStorageKeys = [
    "backendToken",
    "identity",
    "vaultUsername",
    "vaultToken",
];

const LOGGED_OUT_STATE = {
    token: null,
    refreshToken: null,
    backendToken: null,
    identity: null,
    isAuthenticated: false,
    user: {},
    hasErrorMessage: false,
    errorMessage: "",
    freshTokenPromise: false,
    isAuthenticatedVault: false,
    vaultUsername: null,
    vaultToken: null,
};

export default function authReducer(state = INITIAL_STATE, { type, payload }) {
    switch (type) {
        case types.LOGIN_SUCCESS:
            if (
                payload.token &&
                payload.refreshToken &&
                payload.backendToken &&
                payload.identity
            ) {
                return {
                    token: payload.token,
                    refreshToken: payload.refreshToken,
                    backendToken: payload.backendToken,
                    identity: payload.identity,
                    isAuthenticated: true,
                    user: getValuesFromJWT(),
                    lastUpdated: new Date().getTime(),
                };
            } else if (payload.message) {
                return {
                    hasErrorMessage: true,
                    errorMessage: payload.message,
                };
            }
            return { ...state };
        case types.USER_LOGOUT_SUCCESS:
            logoutLocalStorageKeys.forEach((key) =>
                localStorage.removeItem(key)
            );
            return { ...LOGGED_OUT_STATE, lastUpdated: new Date().getTime() };
        case types.REFRESHING_TOKEN_REQUEST:
            return { ...state, freshTokenPromise: payload };
        case types.REFRESHING_TOKEN_SUCCESS:
            localStorage.setItem("token", payload);
            return {
                ...state,
                token: payload,
                user: getValuesFromJWT(),
                freshTokenPromise: false,
                lastUpdated: new Date().getTime(),
            };
        case types.LOGIN_WITH_VAULT_SUCCESS:
            return {
                ...state,
                isAuthenticatedVault: true,
                vaultUsername: payload.username,
                vaultToken: payload.token,
            };
        default:
            return state;
    }
}
