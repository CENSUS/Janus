import * as authConstants from "../../utils/constants/authConstants";
import { refreshJWTToken } from "../../apis/authAPI";

export const loginUserRequest = (payload, callback) => ({
    type: authConstants.LOGIN_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const logoutUserRequest = (payload, callback) => ({
    type: authConstants.USER_LOGOUT_REQUEST,
    payload,
    isAPI: false,
    callback,
});

export function refreshToken(dispatch) {
    const tokenPromise = refreshJWTToken()
        .then((response) => {
            dispatch({
                type: authConstants.REFRESHING_TOKEN_SUCCESS,
                payload: response.data.token,
            });

            return response.data.token
                ? Promise.resolve(response.data.token)
                : Promise.reject({
                      message: "Could not refresh the token",
                  });
        })
        .catch((error) => {
            dispatch({
                type: "REFRESHING_TOKEN_FAILURE",
            });
            return Promise.reject(error);
        });

    dispatch({
        type: authConstants.REFRESHING_TOKEN_REQUEST,
        payload: tokenPromise,
    });
    return tokenPromise;
}

export const loginWithVaultRequest = (payload, callback) => ({
    type: authConstants.LOGIN_WITH_VAULT_REQUEST,
    payload,
    isAPI: false,
    callback,
});
