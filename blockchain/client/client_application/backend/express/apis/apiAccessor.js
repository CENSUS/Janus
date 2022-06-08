const api = require("./api");

async function acquireBackendToken(payload) {
  const { data } = await api.acquireBackendToken(payload);
  return data;
}

async function acquireBlockchainTicket(headers, payload) {
  const { data } = await api.acquireBlockchainTicket(headers, payload);
  return data;
}

async function communicateWithBC(headers, payload) {
  const { data } = await api.communicateWithBC(headers, payload);
  return data;
}

async function acquireCAConnectionProfiles(body) {
  const { data } = await api.acquireCAConnectionProfiles(body);
  return data;
}

module.exports = {
  acquireBackendToken: acquireBackendToken,
  acquireBlockchainTicket: acquireBlockchainTicket,
  communicateWithBC: communicateWithBC,
  acquireCAConnectionProfiles: acquireCAConnectionProfiles,
};
