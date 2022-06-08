import api from "./api";

// BACKEND-API accepts: {
//     "newUserIdentities": [
//         {
//             "enrollmentID": "user",
//             "enrollmentSecret": "userpw",
//             "role": "client",
//             "attributes": [
//                 {
//                     "name": "role",
//                     "value": "Doctor",
//                     "ecert": true
//                 }
//             ]
//         }
//     ]
// }
export async function registerUser(payload) {
    let identities = [];

    Object.keys(payload).forEach(function (key) {
        identities.push(payload[key]);
    });

    const identitiesWrapper = { newUserIdentities: identities };
    const { data: response } = await api.registerUser(identitiesWrapper);
    return response;
}

// {
//   "authoritySign": {
//       "nonce": "nonce",
//       "approved": true,
//       "challengeData": `data`
//   }
// }
export async function vote(payload) {
    const { electionID, approved, challengeData } = payload;
    const apiPayload = {
        authoritySign: {
            nonce: electionID,
            approved: JSON.parse(approved),
            challengeData: challengeData,
        },
    };
    return await api.vote(apiPayload);
}

export async function updateTrustAnchors(payload) {
    return await api.updateTrustAnchors(payload);
}

export async function addCA(newCAData) {
    return await api.addCA({ newCAData });
}

export async function removeCA(caName) {
    return await api.removeCA({ caName });
}

export async function syncWithBCStakeholderElections() {
    const { data: response } = await api.syncWithBCStakeholderElections();
    return response;
}

export async function syncWithBCelectionsExtraInfo(electionID) {
    const { data: response } = await api.syncWithBCelectionsExtraInfo({
        electionID,
    });
    return response;
}
