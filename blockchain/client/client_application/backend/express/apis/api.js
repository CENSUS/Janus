const axios = require("axios");
const https = require("https");
const { ENDPOINTS, baseUrl, backendTLSOptions } = require("../config");
const fs = require("fs");

const httpsAgent = new https.Agent({
  ca: fs.readFileSync(backendTLSOptions.ca, "utf-8"),
  cert: fs.readFileSync(backendTLSOptions.cert, "utf-8"),
});

if (process.env.NODE_ENV !== "development") {
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  axios.default.baseURL = baseUrl;
}

axios.interceptors.request.use(
  (config) => config,
  (request) => request,
  (error) => Promise.reject(error.message)
);

axios.interceptors.response.use(
  (response) => response,
  function (error) {
    if (error.response && error.response.data)
      return Promise.reject(error.response.data.message);
    return Promise.reject(error.message);
  }
);

const api = {
  // Common Routes
  acquireBackendToken: (body) => {
    return axios.post(ENDPOINTS.ACQUIRE_TOKEN_ENDPOINT, body, {
      httpsAgent,
    });
  },
  acquireBlockchainTicket: (headers, body) => {
    return axios.post(ENDPOINTS.ACQUIRE_BLOCKCHAIN_TICKET_ENDPOINT, body, {
      headers,
      httpsAgent,
    });
  },
  communicateWithBC: (headers, body) => {
    return axios.post(ENDPOINTS.COMMUNICATE_WITH_BC_ENDPOINT, body, {
      headers,
      httpsAgent,
    });
  },
  acquireCAConnectionProfiles: (body) => {
    return axios.post(ENDPOINTS.ACQUIRE_CA_CONNECTION_PROFILES, body, {
      httpsAgent,
    });
  },
};

module.exports = api;
