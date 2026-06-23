import axios from "axios";

// Clean up env URL to just be the host/origin (e.g. http://127.0.0.1:8000)
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      return envUrl.replace(/(?:\/api\/v1)+.*$/, "").replace(/\/$/, "");
    }
    return window.location.origin;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return envUrl.replace(/(?:\/api\/v1)+.*$/, "").replace(/\/$/, "");
};
const hostUrl = getBaseURL();

// Create a global axios instance
const api = axios.create({
  baseURL: hostUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: You can set up interceptors here to automatically attach auth tokens
api.interceptors.request.use(
  (config) => {
    // Automatically fix duplicated "/api/v1" from any API call
    if (config.url) {
      if (config.url.startsWith("http")) {
        // If it's an absolute URL, collapse multiple "/api/v1" into a single one
        config.url = config.url.replace(/(?:\/api\/v1)+/g, "/api/v1");
      } else {
        // If it's a relative URL, strip any prefix and cleanly prepend "/api/v1"
        let endpoint = config.url.replace(/^(?:\/?api\/v1)+/, "");
        if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
        config.url = `/api/v1${endpoint}`;
      }
    }

    // Ensure this runs only in the browser to prevent Next.js SSR errors
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;