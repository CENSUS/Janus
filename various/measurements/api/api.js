import axios from "axios";
import MainClass from "./../run.js";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
// import config from "../config.js";

// if (process.env.NODE_ENV !== "development") {
//   process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//   // axios.defaults.baseURL = config.baseUrl;
// }

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
    return axios.post(MainClass.ENDPOINTS.ACQUIRE_TOKEN_ENDPOINT, body);
  },
  acquireBlockchainTicket: (headers, body) => {
    return axios.post(
      MainClass.ENDPOINTS.ACQUIRE_BLOCKCHAIN_TICKET_ENDPOINT,
      body,
      {
        headers,
      }
    );
  },
  communicateWithBC: (headers, body) => {
    return axios.post(MainClass.ENDPOINTS.COMMUNICATE_WITH_BC_ENDPOINT, body, {
      headers,
    });
  },
  acquireCAConnectionProfiles: (body) => {
    return axios.post(MainClass.ENDPOINTS.ACQUIRE_CA_CONNECTION_PROFILES, body);
  },
};

export default api;
