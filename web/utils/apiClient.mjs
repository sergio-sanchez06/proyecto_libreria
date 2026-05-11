import axios from "axios";

// Header secreto compartido entre web y API para identificar peticiones internas
// La API lo usa en filterIA para no bloquear al propio servidor web
// Empleados interceptores para cargar el token antes de cada petición para que la api deje pasar la petición.
// const INTERNAL_TOKEN =
// process.env.SESSION_SECRET ||
// process.env.INTERNAL_API_TOKEN ||
// "bookly-internal";

const apiClient = axios.create({
  baseURL: process.env.API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "BOOKLY-WebServer/1.0",
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers["X-Internal-Token"] =
    process.env.INTERNAL_API_TOKEN ||
    process.env.SESSION_SECRET ||
    "bookly-internal";
  return config;
});

export default apiClient;

export function getAuthenticatedClient(idToken) {
  const instance = axios.create({

    baseURL: process.env.API_URL || "http://localhost:3000",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "User-Agent": "BOOKLY-WebServer/1.0",
      "X-Internal-Token": process.env.SESSION_SECRET || "bookly-internal",
    },
  });

  instance.interceptors.request.use((config) => {
    config.headers["X-Internal-Token"] =
      process.env.INTERNAL_API_TOKEN ||
      process.env.SESSION_SECRET ||
      "bookly-internal";
    return config;
  });

  return instance;
}

// const apiClient = axios.create({
//   baseURL: "http://localhost:3000",
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default apiClient;

// export function getAuthenticatedClient(idToken) {
//   return axios.create({
//     baseURL: "http://localhost:3000",
//     headers: { Authorization: `Bearer ${idToken}` },
//   });
// }
