// In dev: http://127.0.0.1:8000 (Django on port 8000)
// In prod: https://your-app.railway.app (Railway backend URL)
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // Browser: use NEXT_PUBLIC_API_URL or fallback to same origin in dev
    const configured = process.env.NEXT_PUBLIC_API_URL;
    if (configured) return `${configured}/api/v1`;
    // Dev fallback: Django on port 8000
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000/api/v1";
    }
    // Production: same origin (proxy via nginx/railway)
    return `${window.location.protocol}//${window.location.hostname}/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : "http://127.0.0.1:8000/api/v1";
};

export const API_URL = getApiUrl();

export const WS_URL = API_URL.replace("/api/v1", "").replace("http", "ws").replace("https", "wss");

export const APP_NAME = "WRT";
export const APP_TAGLINE = "Work, Relax, Talk";
