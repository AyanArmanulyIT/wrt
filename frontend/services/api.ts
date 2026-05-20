import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "@/lib/constants";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("wrt_access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/refresh")
    ) {
      const refresh = localStorage.getItem("wrt_refresh");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh,
          });
          localStorage.setItem("wrt_access", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("wrt_access");
          localStorage.removeItem("wrt_refresh");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (data && typeof data === "object") {
      const first = Object.values(data)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
      if (typeof first === "string") return first;
    }
    return error.message;
  }
  return "Произошла ошибка";
}
