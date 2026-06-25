import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEvents, getCategories, getNominees } from "../api";
import "./VotingHome.css";

/* ===== auth helpers ===== */
const readAuth = () => { try { return JSON.parse(localStorage.getItem("auth") || "null"); } catch { return null; } };
const hasToken = (a) => !!(a?.token || a?.accessToken);
const getRole  = (a) =>
  (a?.role || a?.user?.role || (Array.isArray(a?.roles) ? a.roles[0] : null) || "")
    .toString()
    .toUpperCase() || null;

const isAuthed = () => hasToken(readAuth());
const currentRole = () => getRole(readAuth());

/* tiny inline icons */
const Star = (p) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const Cal = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"/>
  </svg>
);
const Users = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);
const Trophy = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <path fill="currentColor" d="M6 3h12v6a6 6 0 0 1-12 0V3zm-3 3h2v3a8 8 0 0 0 2 5.3V17H5v2h14v-2h-2v-2.7A8 8 0 0 0 19 9V6h2V4h-2V3h-2v1H7V3H5v1H3v2z"/>
  </svg>
);

export default function VotingHome() {
  /* header/auth state */
  const nav = useNavigate();
  const [authed, setAuthed] = useState(isAuthed());
  const [role, setRole] = useState(currentRole());
  useEffect(() => {
    const onStorage = () => { setAuthed(isAuthed()); setRole(currentRole()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const goToMyVote = useCallback(() => nav("/my-vote"), [nav]);

  /* ===== Toasts ===== */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, kind = "info", timeout = 3000) => {
    setToast({ message, kind, timeout });
  }, []);

  // auto-dismiss any toast (also covers setToast used below)
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.timeout ?? 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Prefer toast passed via URL (?toast=login|logout&msg=...), else fall back to sessionStorage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("toast");
    const msg = params.get("msg");
    if (t) {
      const defaults = { login: "Logged in successfully.", logout: "Logged out successfully." };
      setToast({ message: msg || defaults[t] || "Done.", kind: "success" });
      // clean URL and clear any stale same-origin storage
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
      try { sessionStorage.removeItem("nav_toast"); } catch {}
      return;
    }

    // Fallback: same-origin one-shot toast
    try {
      const raw = sessionStorage.getItem("nav_toast");
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.message && Date.now() - (s.ts || 0) < 15000) {
          setToast({ message: s.message, kind: s.kind || "success" });
        }
      }
    } catch {}
    sessionStorage.removeItem("nav_toast");
  }, []);

  /* ===== logout (redirect with toast via URL so cross-origin works) ===== */
  const logoutHere = useCallback(() => {
    ["auth","student_auth","admin_auth","token","accessToken","refreshToken","nominee_auth","user","role"]
      .forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });

    setAuthed(false); setRole(null);

    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME ||
      "/";

    let dest;
    try { dest = new URL(PUBLIC_HOME); }
    catch { dest = new URL(PUBLIC_HOME, window.location.origin); }
    dest.searchParams.set("toast", "logout");

    window.location.replace(dest.toString()); // no back-stack
  }, []);

  /* page data */
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => { if (err) showToast(err, "error", 3600); }, [err, showToast]);

  useEffect(() => {
    (async () => {
      try {
        const [ev, cat, nom] = await Promise.all([getEvents(), getCategories(), getNominees()]);
        setEvents(ev || []); setCategories(cat || []); setNominees(nom || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load data from server.");
      } finally { setLoading(false); }
    })();
  }, []);

  const withStats = useMemo(() => {
    const catsByEvent = new Map();
    for (const c of categories) {
      const evId = c.eventId ?? c.event?.id;
      if (!evId) continue;
      (catsByEvent.get(evId) || catsByEvent.set(evId, []).get(evId)).push(c);
    }
    const nomsByCat = new Map();
    for (const n of nominees) {
      const catId = n.categoryId ?? n.category?.id;
      if (!catId) continue;
      (nomsByCat.get(catId) || nomsByCat.set(catId, []).get(catId)).push(n);
    }
    const now = new Date();
    return (events || []).map((ev) => {
      const cats = catsByEvent.get(ev.id) || [];
      let nomCount = 0; for (const c of cats) nomCount += (nomsByCat.get(c.id) || []).length;
      const start = ev.startAt ?? ev.startDate ?? null;
      const end   = ev.endAt   ?? ev.endDate   ?? null;
      const active = isActive(start, end, now);
      const upcoming = isUpcoming(start, now);
      return { ...ev, _cats: cats.length, _noms: nomCount, _active: active, _upcoming: upcoming, _start: start, _end: end };
    });
  }, [events, categories, nominees]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const base = [...withStats].sort((a, b) => Number(b._active) - Number(a._active));
    return qq ? base.filter(e =>
      (e.name || "").toLowerCase().includes(qq) ||
      (e.description || "").toLowerCase().includes(qq)
    ) : base;
  }, [withStats, q]);

  return (
    <div className="vote-home">
      {/* TOP BAR */}
      <div className="vh__topbar">
        <div className="vh__glow" />
        <div className="vh__topbar-inner">
          <Link to="/" className="vh__brand">
            <div className="vh__logo">🗳️</div>
            <span className="vh__brand-text">University Voting</span>
            <span className="vh__badge">Voting Portal</span>
          </Link>

          <div className="vh__actions">
            {!authed ? (
              <Link to="/bridge" className="vh__btn vh__btn-blue">
                <span className="vh__btn-ico">🔐</span> Admin Login
              </Link>
            ) : (
              <>
                {role === "STUDENT" && (
                  <button type="button" onClick={goToMyVote} className="vh__btn vh__btn-green">
                    <span className="vh__btn-ico">📊</span> My Vote
                  </button>
                )}
                <button type="button" onClick={logoutHere} className="vh__btn vh__btn-red">
                  <span className="vh__btn-ico">🚪</span> Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="vote-home__main">
        {/* HERO */}
        <section className="vote-home__hero">
          <div className="vote-home__hero-badge"><Star /></div>
          <h1 className="vote-home__title">Award Events</h1>
          <p className="vote-home__subtitle">
            Browse events and jump into voting when they’re active.
          </p>
        </section>

        {/* SEARCH */}
        <section className="vote-home__search-container">
          <div className="vote-home__search-wrapper">
            <div className="vote-home__search-input-wrapper">
              <span className="vote-home__search-icon">🔎</span>
              <input
                className="vote-home__search-input"
                placeholder="Search events..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <div className="vote-home__results-count">
              <span className="vote-home__results-number">{filtered.length}</span>
              <span className="vote-home__results-label">
                {filtered.length === 1 ? "Event" : "Events"}
              </span>
            </div>
          </div>
        </section>

        {/* LIST */}
        {loading && (
          <div className="vote-home__loading">
            <div className="vote-home__spinner"></div>
            <p className="vote-home__loading-text">Loading events...</p>
          </div>
        )}

        {err && (
          <div className="vote-home__error">
            <p className="vote-home__error-text">{err}</p>
          </div>
        )}

        {!loading && filtered.length === 0 && <EmptyState />}

        <section className="vote-home__events-grid">
          {filtered.map(e => (<EventCard key={e.id} event={e} />))}
        </section>
      </main>

      {/* Toast */}
      <Toast message={toast?.message} kind={toast?.kind} onClose={() => setToast(null)} />
    </div>
  );
}

function EventCard({ event }) {
  const start = fmtDate(event._start);
  const end   = fmtDate(event._end);
  return (
    <article className="vote-home__event-card">
      <div className="vote-home__event-header">
        <h3 className="vote-home__event-title">{event.name}</h3>
        <span className={`vote-home__pill ${
          event._active ? "vote-home__pill--on" : (event._upcoming ? "vote-home__pill--up" : "vote-home__pill--off")
        }`}>
          {event._active ? "Active" : (event._upcoming ? "UPCOMING" : "Closed")}
        </span>
      </div>

      {event.description && (
        <p className="vote-home__event-description">{event.description}</p>
      )}

      <div className="vote-home__row">
        <Cal /> <span className="vote-home__row-strong">{start} - {end}</span>
      </div>

      <div className="vote-home__divider" />

      <div className="vote-home__event-stats">
        <div className="vote-home__stat"><Trophy /> <span>{event._cats} Categories</span></div>
        <div className="vote-home__stat"><Users /> <span>{event._noms} Nominees</span></div>
      </div>

      <Link to={`/voting/events/${event.id}`} className="vote-home__btn">
        {event._active ? "Go to Voting" : "View Details"}
      </Link>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="vote-home__empty-state">
      <h3 className="vote-home__empty-title">No events found</h3>
      <p className="vote-home__empty-text">Try a different search.</p>
    </div>
  );
}

/* helpers */
function isActive(sAt, eAt, now = new Date()) {
  const s = sAt ? new Date(sAt) : null;
  const e = eAt ? new Date(eAt) : null;
  if (s && now < s) return false;
  if (e && now > e) return false;
  return true;
}
function isUpcoming(sAt, now = new Date()) {
  const s = sAt ? new Date(sAt) : null;
  return !!(s && now < s);
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toISOString().slice(0,10); } catch { return String(d); }
}

/* ---- Toast component ---- */
function Toast({ message, kind = "info", onClose }) {
  if (!message) return null;
  const cls =
    kind === "success" ? "ui-toast ui-toast--success" :
    kind === "error"   ? "ui-toast ui-toast--error"   :
                         "ui-toast ui-toast--info";
  return (
    <div className={cls} role="status" aria-live="polite" onClick={onClose} title="Close">
      <span className="ui-toast__dot">•</span>
      <span className="ui-toast__text">{message}</span>
    </div>
  );
}
