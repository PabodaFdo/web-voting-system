// src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  let t = localStorage.getItem("auth_token");
  if (!t) {
    try {
      t = JSON.parse(localStorage.getItem("admin_auth") || "null")?.token || null;
    } catch {
      t = null;
    }
  }
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;

/* ===== Auth ===== */
export const login = (username, password) =>
  api.post("/api/auth/login", { username, password });

/* ===== Events (admin CRUD) ===== */
export const getEvents = () => api.get("/api/events");
export const getEvent = (id) => api.get(`/api/events/${id}`);
export const createEvent = (payload) => api.post("/api/events", payload);
export const updateEvent = (id, payload) => api.put(`/api/events/${id}`, payload);
export const deleteEvent = (id) => api.delete(`/api/events/${id}`);

/* ===== Categories (admin CRUD) ===== */
export const getCategories = () => api.get("/api/categories");
export const getCategoriesByEvent = (eventId) =>
  api.get(`/api/categories/by-event/${eventId}`);
export const createCategory = (payload) => api.post("/api/categories", payload);
export const updateCategory = (id, payload) => api.put(`/api/categories/${id}`, payload);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

/* ===== Nominees (admin CRUD) ===== */
export const getNominees = () => api.get("/api/nominees");
export const getNomineesByCategory = (categoryId) =>
  api.get(`/api/nominees/by-category/${categoryId}`);
export const getNominee = (id) => api.get(`/api/nominees/${id}`);
export const deleteNominee = (id) => api.delete(`/api/nominees/${id}`);

export const createNominee = (dto, file) => {
  const fd = new FormData();
  fd.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
  if (file) fd.append("photo", file);
  return api.post("/api/nominees", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateNominee = (id, dto, file) => {
  const fd = new FormData();
  fd.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
  if (file) fd.append("photo", file);
  return api.put(`/api/nominees/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const nomineePhotoUrl = (id) =>
  `${api.defaults.baseURL}/api/nominees/${id}/photo`;

/* ===== Public (no-auth) fallbacks ===== */
export const getPublicEvents = () => api.get("/api/public/events");
export const getPublicCategories = () => api.get("/api/public/categories");
export const getPublicNominees = () => api.get("/api/public/nominees");

/* ===== Stats (optional) ===== */
export const getAdminDashboard = () => api.get("/api/dashboard");
export const getPublicStats = () => api.get("/api/public/stats");
