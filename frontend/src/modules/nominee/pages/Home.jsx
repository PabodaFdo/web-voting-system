import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import {
  getEvents,
  getCategories,
  getNominees,
  getPublicEvents,
  getPublicCategories,
  getPublicNominees,
} from "../api.js";

/* ---- Inline SVG icons (no extra libs) ---- */
const Icon = {
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V9h14v9z"/>
    </svg>
  ),
  Trophy: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M17 3h-2V2H9v1H7v3a4 4 0 004 4v3H8v2h8v-2h-3V10a4 4 0 004-4V3zM5 7H4a2 2 0 01-2-2V3h3v4zm15 0h1a2 2 0 002-2V3h-3v4z"/>
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-2.66-5.33-4-8-4zm8 0c-.29 0-.62.02-.97.05A5.96 5.96 0 0122 17v2h-8v-2c0-1.52-.59-2.86-1.53-3.95.35-.03.68-.05.97-.05 2.67 0 8 1.34 8 4z"/>
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Sparkles: (p) => (
    <svg viewBox="0 0 24 24" width="36" height="36" {...p}>
      <path fill="currentColor" d="M5 3l1.5 3L10 7.5 6.5 9 5 12 3.5 9 0 7.5 3.5 6 5 3zm11 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4zm-7 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  Award: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <circle cx="12" cy="8" r="6" fill="currentColor"/>
      <path fill="currentColor" d="M15.75 8l1.5 8-5.25-3-5.25 3 1.5-8"/>
    </svg>
  ),
  UserCircle: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/>
    </svg>
  ),
};

/* -------- Helpers -------- */
const toArray = (res) => (Array.isArray(res) ? res : (res?.data || []));
const statusOf = (startAt, endAt) => {
  const now = new Date();
  const s = startAt ? new Date(startAt) : null;
  const e = endAt ? new Date(endAt) : null;
  if (s && now < s) return "upcoming";
  if (e && now > e) return "completed";
  return "active";
};
const fmt = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all | active | upcoming | completed
  const [events, setEvents] = useState([]);
  const [totals, setTotals] = useState({ categories: 0, nominees: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const steps = [
    { n: 1, title: "Create Event", desc: "Configure dates, details, and voting periods", icon: Icon.Calendar, to: "/admin/nominees/events" },
    { n: 2, title: "Setup Categories", desc: "Define award categories and criteria", icon: Icon.Trophy, to: "/admin/nominees/categories" },
    { n: 3, title: "Add Nominees", desc: "Upload nominees with rich profiles", icon: Icon.Star, to: "/admin/nominees/nominees" },
  ];

  // Prefer admin endpoints; fall back to public if unauthorized
  const safeLoad = async (privCall, pubCall) => {
    try {
      return await privCall();
    } catch (e) {
      if (e?.response && (e.response.status === 401 || e.response.status === 403)) {
        return await pubCall();
      }
      throw e;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [evRes, catRes, nomRes] = await Promise.all([
          safeLoad(getEvents, getPublicEvents),
          safeLoad(getCategories, getPublicCategories),
          safeLoad(getNominees, getPublicNominees),
        ]);

        const evs = toArray(evRes).map((e) => {
          const name = e.name || e.title || e.eventName || `Event #${e.id ?? e.eventId ?? ""}`;
          const desc = e.description || e.desc || "";
          const start = e.startAt || e.startDate || e.start_time || e.start || null;
          const end = e.endAt || e.endDate || e.end_time || e.end || null;
          return {
            id: e.id ?? e.eventId ?? e.uuid ?? name,
            name,
            desc,
            start,
            end,
            status: statusOf(start, end),
          };
        });

        setEvents(evs);
        setTotals({ categories: toArray(catRes).length, nominees: toArray(nomRes).length });
      } catch (e) {
        console.error(e);
        setErr("Failed to load data from server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Back to Admin Dashboard
  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  const filtered = events.filter((ev) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || ev.name.toLowerCase().includes(q) || ev.desc.toLowerCase().includes(q);
    const matchesFilter = activeFilter === "all" || ev.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="home-modern">
      <div className="bg-gradient"></div>

      <div className="home-container">
        {/* Top Navigation */}
        <nav className="top-nav" role="navigation" aria-label="Admin Home Navigation">
          <div className="nav-content">
            <div className="nav-brand">
              <div className="nav-logo"><Icon.Star /></div>
              <span className="nav-title">Voting Admin</span>
            </div>

            <div className="nav-links">
              <Link className="nav-link" to="/admin/nominees"><Icon.Dashboard /><span className="nav-link-text">Home</span></Link>
              <Link className="nav-link" to="/admin/nominees/events"><Icon.Calendar /><span className="nav-link-text">Events</span></Link>
              <Link className="nav-link" to="/admin/nominees/categories"><Icon.Award /><span className="nav-link-text">Categories</span></Link>
              <Link className="nav-link" to="/admin/nominees/nominees"><Icon.UserCircle /><span className="nav-link-text">Nominees</span></Link>
            </div>

            <button type="button" className="nav-back-btn" onClick={backToDashboard}>
              <Icon.ArrowLeft /><span className="nav-back-text">Back to Dashboard</span>
            </button>
          </div>
        </nav>

        {/* Hero */}
        <header className="hero-modern">
          <div className="hero-icon"><Icon.Sparkles /></div>
          <h1 className="hero-title">Voting Admin System</h1>
          <p className="hero-subtitle">
            Manage <span className="hl-primary">Events</span> → <span className="hl-secondary">Categories</span> → <span className="hl-tertiary">Nominees</span>
          </p>
          <div className="hero-stats">
            <span className="stat-item"><Icon.Calendar /> {events.length} Events</span>
            <span className="stat-item"><Icon.Trophy /> {totals.categories} Categories</span>
            <span className="stat-item"><Icon.Users /> {totals.nominees} Nominees</span>
          </div>
        </header>

        {/* Getting Started */}
        <section className="section-modern">
          <div className="section-header">
            <h2 className="section-title">Getting Started</h2>
            <div className="section-divider"></div>
          </div>

          <div className="cards-grid">
            {steps.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-icons">
                  <div className="step-number">{s.n}</div>
                  <div className="step-icon-badge"><s.icon /></div>
                </div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                <Link className="step-btn" to={s.to}>
                  Get Started <Icon.ArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Active Events */}
        <section className="section-modern">
          <div className="section-header">
            <h2 className="section-title">Active Events</h2>
            <div className="section-divider purple"></div>
          </div>

          {/* Search & Filters */}
          <div className="search-panel">
            <div className="search-controls">
              <div className="search-box">
                <Icon.Search className="search-icon" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search events by name or description…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                {["all", "active", "upcoming", "completed"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFilter(f)}
                    className={`filter-pill ${activeFilter === f ? "active" : ""}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {err && <p style={{ color: "#b91c1c", marginTop: 10, fontWeight: 700 }}>{err}</p>}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="cards-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="event-card skeleton-card">
                  <div className="event-content">
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text short"></div>
                    <div className="skeleton skeleton-btn"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="cards-grid">
              {filtered.map((e) => (
                <div key={e.id} className="event-card">
                  <div className="event-content">
                    <div className="event-header">
                      <h3 className="event-title">{e.name}</h3>
                      <span className={`event-badge badge-${e.status}`}>{e.status}</span>
                    </div>

                    {e.desc && <p className="event-desc">{e.desc}</p>}

                    <div className="event-date">
                      <Icon.Calendar />
                      <span>{fmt(e.start)} — {fmt(e.end)}</span>
                    </div>

                    <div className="event-stats">
                      <div className="event-stat"><Icon.Trophy /><p>Categories</p></div>
                      <div className="event-stat"><Icon.Users /><p>Nominees</p></div>
                    </div>

                    <Link className="event-btn" to="/admin/nominees/events">
                      View Event <Icon.ArrowRight />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Icon.Sparkles /></div>
              <h3>No events found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
