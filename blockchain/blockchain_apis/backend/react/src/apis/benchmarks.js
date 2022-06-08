import api from "./api";

export async function getBenchmarksAvailability() {
  const { data: response } = await api.benchmarksAvailability();
  return response;
}

export async function getAvailableBenchmarks() {
  const { data: response } = await api.getAvailableBenchmarks();
  return response;
}

export async function getBenchmarkData(payload = null) {
  const { data: response } = await api.getBenchmarkData(payload);
  return response;
}

export async function resetStats() {
  const { data: response } = await api.resetStats();
  return response;
}

export async function getBenchmarksHistory() {
  const { data: response } = await api.getBenchmarksHistory();
  return response;
}
