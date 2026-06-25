// src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
  } catch {}
  return config;
});

// ---- Auth
export const loginApi = async (username, password) =>
  (await api.post("/api/auth/login", { username, password })).data;

// ---- Public reads
export const getEvents = async () => (await api.get("/api/public/events")).data;
export const getEventBundle = async (id) =>
  (await api.get(`/api/public/events/${id}/bundle`)).data;
export const getCategories = async () =>
  (await api.get("/api/public/categories")).data;
export const getNominees = async () =>
  (await api.get("/api/public/nominees")).data;

// ---- Voting (existing singular endpoints)
export const postVote = async ({ eventId, categoryId, nomineeId }) =>
  (await api.post("/api/vote", { eventId, categoryId, nomineeId })).data;

export const getMyVotes = async () => (await api.get("/api/vote/my")).data;
export const getCategoryResults = async (categoryId) =>
  (await api.get(`/api/vote/category/${categoryId}/results`)).data;

// ---- Student castVote (align to singular by default; keep env override)
export const castVote = async ({ eventId, categoryId, nomineeId }) => {
  // Set VITE_VOTES_PATH=/api/votes if the backend exposes the plural endpoint.
  const path = import.meta.env.VITE_VOTES_PATH || "/api/vote";
  return (await api.post(path, { eventId, categoryId, nomineeId })).data;
};

// Optional: reset per-category if your backend supports it
export const deleteMyVote = async (categoryId) =>
  (await api.delete(`/api/vote/category/${categoryId}`)).data;
