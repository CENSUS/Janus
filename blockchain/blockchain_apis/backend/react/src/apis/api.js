import axios from "axios";

axios.interceptors.request.use(
  (config) => config,
  (request) => request,
  (error) => Promise.reject(error.message)
);

axios.interceptors.response.use(
  (response) => response,
  function (error) {
    if (error.response && error.response.data)
      return Promise.reject({ response: error.response.data });
    return Promise.reject(error.message);
  }
);

const api = {
  // Common
  getClientExecutable: (platform, progressCallback) => {
    axios
      .get("/v1/executables/client-exec", {
        params: { platform },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          progressCallback(percentCompleted);
        },
      })
      .then((response) => {
        const fileURL = window.URL.createObjectURL(new Blob([response.data]));
        const fileLink = document.createElement("a");
        fileLink.href = fileURL;

        const fileName = response.headers["content-disposition"]
          .split("filename=")[1]
          .split(".")[0];
        const extension = response.headers["content-disposition"]
          .split(".")[1]
          .split(";")[0];

        const file = fileName + "." + extension;

        fileLink.setAttribute("download", file.replace(/['"]+/g, ''));
        document.body.appendChild(fileLink);
        fileLink.click();
        fileLink.remove();
      })
      .catch((err) =>
        console.log("Error while downloading the Client Application", err)
      );
  },
  // Benchmarks
  benchmarksAvailability: () => {
    return axios.get("/v1/benchmarks/availability");
  },
  getAvailableBenchmarks: () => {
    return axios.get("/v1/benchmarks/available-benchmarks");
  },
  getBenchmarkData: (timestamp) => {
    return axios.get("/v1/benchmarks/get-benchmark-data", {
      params: { timestamp },
    });
  },
  resetStats: () => {
    return axios.get("/v1/benchmarks/reset-stats");
  },
  getBenchmarksHistory: () => {
    return axios.get("/v1/benchmarks/benchmarks-history");
  },
};

export default api;
