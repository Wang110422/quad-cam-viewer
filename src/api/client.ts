import axios, { AxiosError, type AxiosInstance } from "axios";

/**
 * Axios instance dùng chung. Backend chỉ cần set VITE_API_BASE_URL trong .env
 * và toàn bộ request sẽ trỏ về đó.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Optional: gắn token nếu có
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    // eslint-disable-next-line no-console
    console.error("[API ERROR]", err.config?.url, err.response?.status, err.message);
    return Promise.reject(err);
  },
);

/** Bật/tắt mock mode khi backend chưa sẵn sàng. */
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") === "true";
