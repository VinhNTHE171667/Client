import axios from "axios";

// Use VITE_PUBLIC_API as base if provided, otherwise default to localhost:3001 for dev.
const base = import.meta.env.VITE_PUBLIC_API || "http://localhost:3001";

const axiosPublic = axios.create({
  timeout: 120000,
  baseURL: base,
});

export { axiosPublic };
