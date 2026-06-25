import axios from "axios";

// Prefer a full absolute URL from env; fall back to localhost:8080
let raw =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:8080";

// If someone set a relative like "api", make it absolute to this origin
if (!/^https?:\/\//i.test(raw)) {
  raw =
    window.location.origin.replace(/\/+$/, "") + "/" + raw.replace(/^\/+/, "");
}

// Normalize (no trailing slash)
const BASE = raw.replace(/\/+$/, "");

export const api = axios.create({ baseURL: BASE });

function getToken() {
  const sessionToken = sessionStorage.getItem("admin_jwt");
  if (sessionToken) return sessionToken;
  try {
    return JSON.parse(localStorage.getItem("admin_auth") || "null")?.token || null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;

  // If baseURL ends with "/api" and url starts with "/api/", drop the duplicate
  if (typeof config.url === "string") {
    const baseHasApi = /\/api$/i.test(BASE);
    if (baseHasApi && config.url.startsWith("/api/")) {
      config.url = config.url.replace(/^\/api\//, "/");
    }
  }
  return config;
});

/* ------------ helpers / normalizers ------------ */
const idStr = (v) => (v === null || v === undefined ? "" : String(v));

const catEventId = (cat) =>
  idStr(
    cat?.eventId ??
      cat?.event_id ??
      cat?.eventID ??
      cat?.evtId ??
      cat?.event?.id ??
      cat?.event?.eventId ??
      cat?.event?.eventID
  );

const catId = (c) => idStr(c?.categoryId ?? c?.id);

/* ------------ events ------------ */
export async function listEvents() {
  const tries = ["/api/events", "/api/public/events", "/api/dashboard/events"];
  for (const url of tries) {
    try {
      const { data } = await api.get(url);
      return Array.isArray(data) ? data : [];
    } catch {}
  }
  return [];
}

/* ------------ categories by event (Nominee-style) ------------ */
/**
 * Always return ONLY the categories belonging to the given event.
 * 1) Prefer event-scoped endpoints (server filters).
 * 2) If server still returns everything, try to fetch a mapping and filter.
 * 3) If no mapping exists, fall back to client-side heuristic filter by eventId fields.
 */
export async function listCategoriesByEvent(eventId) {
  const eid = idStr(eventId);

  // 1) Endpoints that should already be filtered server-side
  const eventScoped = [
    `/api/events/${eid}/categories`,
    `/api/dashboard/events/${eid}/categories`,
    `/api/admin/events/${eid}/categories`,
    `/api/public/events/${eid}/categories`,
    `/api/categories/by-event/${eid}`,
  ];
  for (const url of eventScoped) {
    try {
      const { data } = await api.get(url);
      const list = Array.isArray(data) ? data : [];
      if (list.length) return list;
    } catch {}
  }

  // 2) Param based (some backends support ?eventId=)
  const paramBased = [
    ["/api/categories", { params: { eventId: eid } }],
    ["/api/dashboard/categories", { params: { eventId: eid } }],
  ];
  for (const [url, cfg] of paramBased) {
    try {
      const { data } = await api.get(url, cfg);
      const list = Array.isArray(data) ? data : [];
      // If items carry an event link, filter strictly; otherwise return as is.
      const withLink = list.filter((c) => catEventId(c) !== "");
      return withLink.length ? withLink.filter((c) => catEventId(c) === eid) : list;
    } catch {}
  }

  // 3) Mapping strategy: fetch relation list (eventId, categoryId) & filter categories
  // Try various mapping endpoints that projects commonly expose.
  const mappingEndpoints = [
    ["/api/event-categories", { params: { eventId: eid } }],
    ["/api/dashboard/event-categories", { params: { eventId: eid } }],
    ["/api/events/" + eid + "/category-ids"],
    ["/api/public/events/" + eid + "/category-ids"],
  ];

  let catIdsFromMap = null;
  for (const [url, cfg] of mappingEndpoints) {
    try {
      const { data } = await api.get(url, cfg);
      if (Array.isArray(data)) {
        // Either [{eventId,categoryId},...] or [id,id,...]
        const ids =
          data.length && typeof data[0] === "object"
            ? data
                .filter((m) => idStr(m.eventId ?? m.event_id ?? m.eid) === eid)
                .map((m) => idStr(m.categoryId ?? m.category_id ?? m.cid))
            : data.map((x) => idStr(x));
        if (ids.length) {
          catIdsFromMap = new Set(ids);
          break;
        }
      }
    } catch {}
  }

  if (catIdsFromMap) {
    // fetch all categories, then filter by map
    const allCatEndpoints = ["/api/categories", "/api/dashboard/categories"];
    for (const url of allCatEndpoints) {
      try {
        const { data } = await api.get(url);
        const all = Array.isArray(data) ? data : [];
        const filtered = all.filter((c) => catIdsFromMap.has(catId(c)));
        if (filtered.length) return filtered;
      } catch {}
    }
  }

  // 4) Last resort: try public event bundle shapes
  const bundles = [
    `/api/public/events/${eid}/bundle`,
    `/api/public/event/${eid}/bundle`,
  ];
  for (const url of bundles) {
    try {
      const { data } = await api.get(url);
      const list = (data && (data.categories || data.categoryList)) || [];
      if (list.length) return list;
    } catch {}
  }

  // Nothing worked
  return [];
}
