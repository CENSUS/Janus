import api from "./api";
import { constructDataIDPayload } from "../utils/processors/data_processors";
import apiVault from "./apiVault";

export async function requestAccess(payload) {
    payload = constructDataIDPayload(payload);
    const { data: response } = await api.requestAccess(payload);
    return response;
}

export async function getCombinedIdentities() {
    const { data: response } = await api.combinedIdentities();
    return response;
}

export async function combineIdentities(payload) {
    const { data: response } = await api.combineIdentities(payload);
    return response;
}

export async function removeCombinedIdentity(payload) {
    const clientToDelete = { data: payload };
    const { data: response } = await api.deleteCombinedIdentity(clientToDelete);
    return response;
}

export async function toggleCombinedIdentity(payload) {
    const { data: response } = await api.toggleCombinedIdentity(payload);
    return response;
}

export async function userValidation() {
    const { data: response } = await api.userValidation();
    return response;
}

export async function getData({ requestID, dataID }) {
    const payload = { reqID: requestID };
    const { data: encryptedData } = await api.getData(payload);
    const modifiedResponse = { encryptedData, dataID };
    return modifiedResponse;
}

export async function syncWithBCClientsRequests(payload) {
    const { data: response } = await api.syncWithBCClientsRequests(payload);
    return response;
}

export async function fullDecryptWithVault({
    data_id,
    encryptionKeys,
    organization,
}) {
    for (const objectID in encryptionKeys) {
        for (const keyID in encryptionKeys[objectID]) {
            const encryptionKey = encryptionKeys[objectID][keyID];
            const payload = {
                encryptionKey: encryptionKey,
                organization: organization,
            };
            const {
                data: {
                    data: { decrypted_data: response },
                },
            } = await apiVault.fullDecryptWithVault(payload, data_id);
            encryptionKeys[objectID][keyID] = response;
        }
    }
    return encryptionKeys;
}
