import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;

export function getAuthenticatedClient(idToken) {
  return axios.create({
    baseURL: "http://localhost:3000",
    headers: { Authorization: `Bearer ${idToken}` },
  });
}
