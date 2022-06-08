import api from "./api";
import { loadAvailableOrganizations } from "../utils/processors/data_processors";

export function fetchOrganizationsList() {
    return loadAvailableOrganizations();
}

export async function syncWithBC(payload) {
    const { data: response } = await api.syncWithBC(payload);
    return response;
}
