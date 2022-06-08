import api from "./api.js";

export async function acquireBackendToken(payload) {
  const { data } = await api.acquireBackendToken(payload);
  return data;
}

export async function acquireBlockchainTicket(headers, payload) {
  const { data } = await api.acquireBlockchainTicket(headers, payload);
  return data;
}

export async function communicateWithBC(headers, payload) {
  const { data } = await api.communicateWithBC(headers, payload);
  return data;
}

export async function acquireCAConnectionProfiles(body) {
  const { data } = await api.acquireCAConnectionProfiles(body);
  return data;
}
