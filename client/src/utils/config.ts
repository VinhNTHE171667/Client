import axios from "axios";

export const DOMAIN = import.meta.env.VITE_PUBLIC_API || "";

export const http = axios.create({
  baseURL: DOMAIN,
  headers: {
    "content-type": "application/json",
  },
  timeout: 10000,
});

http.interceptors.request.use(
  async (config) => {
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 400 || error.response?.status === 404) {
      return Promise.resolve(error.response);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized or forbidden responses if needed
      // For now, just return the response
      return Promise.resolve(error.response);
    }

    return Promise.reject(error);
  }
);
