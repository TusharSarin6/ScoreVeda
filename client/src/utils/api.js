import axios from "axios";

// Create an axios instance
const api = axios.create({
  // If we are in production (live), use the live link. 
  // If in development (your laptop), use localhost.
  // Note: Vite uses import.meta.env instead of process.env
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// Optional: Add an interceptor to automatically attach the token if available
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;