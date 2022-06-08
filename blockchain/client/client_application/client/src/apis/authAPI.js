import api from "./api";
import apiVault from "./apiVault";

export async function loginUser(payload) {
    const response = await api.login(payload);

    const {
        data: { token, refreshToken, identity, backendToken },
    } = response;

    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("identity", JSON.stringify(identity));
    localStorage.setItem("backendToken", backendToken);

    return response.data;
}

export async function logoutUser() {
    const token = { data: { token: localStorage.getItem("token") } };
    const response = await api.logout(token);

    if (response.status === 200) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        return true;
    }
    return false;
}

export function refreshJWTToken() {
    const token = { refreshToken: localStorage.getItem("refreshToken") };
    // Returns a promise
    const response = api.refreshToken(token);
    return response;
}

export async function loginWithVault(payload) {
    const {
        values: { username, password },
        userOrganization,
    } = payload;

    const body = { password: password };
    const organization = userOrganization.toLowerCase();

    const {
        data: { auth: response },
    } = await apiVault.loginWithVault(body, username, organization);

    const {
        client_token: vaultToken,
        metadata: { username: loginUsername },
    } = response;

    localStorage.setItem("vaultUsername", loginUsername);
    localStorage.setItem("vaultToken", vaultToken);

    return { username: loginUsername, token: vaultToken };
}
