import api from "./api";

export async function retrieveLogsInit(payload) {
    const { data: response } = await api.retrieveLogsInit(payload);
    return response;
}

export async function retrieveLogs(payload) {
    const { data: response } = await api.retrieveLogs(payload);
    return response;
}

export async function syncAudits(payload) {
    const { data: response } = await api.syncAudits(payload);
    return response;
}
