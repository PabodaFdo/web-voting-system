import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8080",
  withCredentials: false, // keep tokens in header, not cookies
});

export const publicRegisterStudent = async (payload) =>
  (await api.post("/api/public/students/register", payload)).data;

export const requestResetOtp = async (identifier) =>
  (await api.post("/api/auth/forgot", { identifier })).data;

export const confirmPasswordReset = async ({ identifier, otp, newPassword }) =>
  (await api.post("/api/auth/reset", { identifier, otp, newPassword })).data;

// --- tiny helper to read token safely ---
function getToken() {
  try {
    const raw = localStorage.getItem("admin_auth");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.token || null;
  } catch {
    return null;
  }
}

// --- attach token if present (never throws) ---
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// --- handle 401/403 without crashing the app ---
// ONLY redirect if: (a) not a /api/public/* call AND (b) user is on /admin pages.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = String(err?.config?.url || "");
    const isPublicApi = url.includes("/api/public/");
    const path = typeof location !== "undefined" ? location.pathname : "";
    const onAdminArea = path.startsWith("/admin");

    if ((status === 401 || status === 403) && !isPublicApi && onAdminArea) {
      try { localStorage.removeItem("admin_auth"); } catch {}
      const next = encodeURIComponent(path + location.search);
      if (!path.startsWith("/login")) {
        window.location.replace(`/login?next=${next}`);
      }
    }
    return Promise.reject(err);
  }
);

// ---- Public reads (no login required) ----
export const getEvents     = async () => (await api.get("/api/public/events")).data;
export const getCategories = async () => (await api.get("/api/public/categories")).data;
export const getNominees   = async () => (await api.get("/api/public/nominees")).data;

// ---- Students (admin only) ----
export const getStudents = async () =>
  (await api.get("/api/students")).data;

export const createStudent = async (form) => {
  const payload = {
    indexNo: form.indexNo,
    fullName: form.fullName,
    email: form.email,
    rawPassword: form.rawPassword,
    active: !!form.active,
    gender: form.gender,
  };
  return (await api.post("/api/students", payload)).data;
};

export const updateStudent = async (id, patch) => {
  const payload = {
    fullName: patch.fullName,
    email: patch.email,
    rawPassword: patch.rawPassword || null,
    active: !!patch.active,
    gender: patch.gender,
  };
  return (await api.put(`/api/students/${id}`, payload)).data;
};

export const deleteStudent = async (id) =>
  (await api.delete(`/api/students/${id}`)).data;

// ---- Detail bundle ----
export const getPublicEventBundle = async (id) =>
  (await api.get(`/api/public/events/${id}/bundle`)).data;

// ---- Auth ----
export async function login(username, password) {
  const { data } = await api.post("/api/auth/login", { username, password });
  return data;
}

// --- Admin dashboard stats ---
export async function getAdminStats() {
  let token = "";
  try {
    const saved = JSON.parse(localStorage.getItem("admin_auth") || "null");
    token = saved?.token || "";
  } catch {}
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.get("/api/dashboard/stats", { headers });
  return data;
}

// ---- Public: event vote count ----
export const getEventVoteCount = async (eventId) => {
  const { data } = await api.get(`/api/public/events/${eventId}/votes/count`);
  return typeof data === "number" ? data : (data?.count ?? data?.total ?? data?.votes ?? 0);
};
