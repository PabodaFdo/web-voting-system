// Axios client for Notification API (single file to keep things simple)
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8080",
});

// Read admin token (supports multiple common keys)
function getToken() {
  try {
    const adminAuth = JSON.parse(localStorage.getItem("admin_auth") || "null");
    if (adminAuth?.token) return adminAuth.token;
  } catch {}
  const s = localStorage.getItem("auth_token");
  if (s) return s;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.token) return auth.token;
  } catch {}
  return null;
}

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// helpers
const toList = (s = "") => s.split(/[,\s]+/).map(e=>e.trim()).filter(Boolean);

// endpoints
export async function sendNow({ recipients, subject, body }) {
  const { data } = await api.post("/api/notifications/send", { recipients: toList(recipients), subject, body });
  return data;
}

export async function scheduleSend({ recipients, subject, body, localDateTime }) {
  const sendAtUtc = new Date(localDateTime).toISOString();
  const { data } = await api.post("/api/notifications/schedule", { recipients: toList(recipients), subject, body, sendAtUtc });
  return data;
}

export async function listActive()     { return (await api.get("/api/notifications")).data; }
export async function listArchived()   { return (await api.get("/api/notifications/archived")).data; }
export async function archiveOne(id)   { return (await api.patch(`/api/notifications/${id}/archive`)).data; }
export async function restoreOne(id)   { return (await api.patch(`/api/notifications/${id}/restore`)).data; }
export async function restoreAllArchived(){ return (await api.patch(`/api/notifications/archived/restoreAll`)).data; }
export async function deleteOne(id)    { return (await api.delete(`/api/notifications/${id}`)).data; }
export async function deleteAllArchived(){ return (await api.delete(`/api/notifications/archived/deleteAll`)).data; }
export async function cancelOne(id)    { return (await api.post(`/api/notifications/${id}/cancel`)).data; }
export async function resend(id)       { return (await api.post(`/api/notifications/resend/${id}`)).data; }
export async function reschedule(id, localDateTime) {
  const sendAtUtc = new Date(localDateTime).toISOString();
  return (await api.patch(`/api/notifications/${id}/reschedule`, { sendAtUtc })).data;
}
export async function updateText(id, { recipient, subject, body }) {
  return (await api.patch(`/api/notifications/${id}`, { recipient, subject, body })).data;
}

// after the existing api.interceptors.request.use(...)
api.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      // drop bad token and hint a re-open via Admin
      localStorage.removeItem("auth_token");
      // If needed, redirect back to the unified admin area: /admin/notifications
    }
    return Promise.reject(err);
  }
);
