import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents, getCategories, getNominees, api } from "../api.js";
import "./PublicHome.css";

/* Icons */
const Star = (p) => (
  <svg viewBox="0 0 24 24" width="32" height="32" {...p}>
    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const Cal = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"/>
  </svg>
);

const Users = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0 -.62 .02 -.97 .05 1.16 .84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const Trophy = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M6 3h12v6a6 6 0 0 1-12 0V3zm-3 3h2v3a8 8 0 0 0 2 5.3V17H5v2h14v-2h-2v-2.7A8 8 0 0 0 19 9V6h2V4h-2V3h-2v1H7V3H5v1H3v2z"/>
  </svg>
);

const SearchIcon = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const ArrowLeft = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);

const UserIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z"/>
  </svg>
);

const VoteIcon = (p) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
    <path fill="currentColor" d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19a2 2 0 002-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66a.996.996 0 000 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36a.996.996 0 000-1.41L14.16 2.3a.975.975 0 00-1.4-.01z"/>
  </svg>
);

const PLACEHOLDER_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23232c3d"/><stop offset="1" stop-color="%23161e2e"/></linearGradient></defs><rect width="320" height="200" fill="url(%23g)"/><circle cx="160" cy="90" r="28" fill="%23586e9e" opacity="0.6"/><rect x="100" y="130" width="120" height="40" rx="20" fill="%23586e9e" opacity="0.35"/></svg>';

export default function PublicHome() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Scroll header state
  const [navScrolled, setNavScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  /* Scroll header */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setNavScrolled(true);
      } else {
        setNavScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    (async () => {
      try {
        const [ev, cat, nom] = await Promise.all([
          getEvents(), getCategories(), getNominees()
        ]);
        setEvents(ev || []); setCategories(cat || []); setNominees(nom || []);
      } catch {
        setErr("Failed to load data from server.");
      } finally { setLoading(false); }
    })();
  }, []);

  // Add counts and schedule state to each event.
  const withStats = useMemo(() => {
    const now = new Date();
    const catsByEvent = new Map();
    categories.forEach((c) => {
      const arr = catsByEvent.get(c.eventId) || [];
      arr.push(c);
      catsByEvent.set(c.eventId, arr);
    });

    const nomsByCat = new Map();
    nominees.forEach((n) => {
      const arr = nomsByCat.get(n.categoryId) || [];
      arr.push(n);
      nomsByCat.set(n.categoryId, arr);
    });

    return (events || []).map((ev) => {
      const cats = catsByEvent.get(ev.id) || [];
      let nomCount = 0;
      cats.forEach((c) => (nomCount += (nomsByCat.get(c.id) || []).length));
      return {
        ...ev,
        _cats: cats.length,
        _noms: nomCount,
        _active: isActive(ev.startAt, ev.endAt, now),
        _upcoming: isUpcoming(ev.startAt, now),
      };
    });
  }, [events, categories, nominees]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const list = [...withStats].sort((a, b) => Number(b._active) - Number(a._active));
    if (!qq) return list;
    return list.filter(
      (e) =>
        (e.name || "").toLowerCase().includes(qq) ||
        (e.description || "").toLowerCase().includes(qq)
    );
  }, [withStats, q]);

  return (
    <div className="public-home">
      <nav className={`ph-nav ${navScrolled ? 'scrolled' : ''} ${navHidden ? 'hidden' : ''}`}>
        <div className="ph-nav-container">
          <div className="ph-nav-inner">
            <Link to="/" className="ph-brand">
              <div className="ph-brand-icon">
                <VoteIcon />
              </div>
              <span className="ph-brand-text">Bright Future</span>
            </Link>

            <div className="ph-nav-actions">
              <Link to="/" className="ph-back-btn">
                <ArrowLeft /> Back to Home
              </Link>
              <a href="/login" className="ph-nav-btn">
                <UserIcon /> Student Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="public-home__main">
        <section className="ph-hero">
          <div className="ph-hero-badge"><Star /></div>
          <h1 className="ph-hero-title">Student Awards Portal</h1>
          <p className="ph-hero-sub">
            Browse and participate in ongoing award events. Vote for your favorite nominees across multiple categories.
          </p>
        </section>

        <section className="ph-search-tray">
          <div className="ph-search-left">
            <SearchIcon className="ph-search-icon" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events by name or description..."
              className="ph-search-input"
            />
          </div>
          <div className="ph-search-count">
            <span className="ph-count-num">{filtered.length}</span>
            <span className="ph-count-label">{filtered.length === 1 ? "Event" : "Events"}</span>
          </div>
        </section>

        {loading && (
          <div className="public-home__loading">
            <div className="public-home__spinner" />
            <p className="public-home__loading-text">Loading events...</p>
          </div>
        )}
        
        {err && (
          <div className="public-home__error">
            <p className="public-home__error-text">{err}</p>
          </div>
        )}
        
        {!loading && filtered.length === 0 && (
          <div className="public-home__empty-state">
            <h3 className="public-home__empty-title">No events found</h3>
            <p className="public-home__empty-text">Try adjusting your search terms or check back later for new events.</p>
          </div>
        )}

        <section className="ph-grid">
          {filtered.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </section>
      </main>
    </div>
  );
}

function EventCard({ ev }) {
  const [winners, setWinners] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/public/results/events/${ev.id}`);
        if (mounted) setWinners(res.data);
      } catch {
        if (mounted) setWinners(null);
      }
    })();
    return () => { mounted = false; };
  }, [ev.id]);

  const abs = (u) => (u && !u.startsWith("http") ? `${api.defaults.baseURL}${u}` : u);

  const start = fmtDate(ev.startAt);
  const end = fmtDate(ev.endAt);

  return (
    <article className="ph-card">
      <div className="ph-card-head">
        <h3 className="ph-card-title">{ev.name}</h3>
        <span className={`ph-pill ${
          ev._active ? "ph-pill--on" : (ev._upcoming ? "ph-pill--up" : "ph-pill--off")
        }`}>
          {ev._active ? "Active" : (ev._upcoming ? "Upcoming" : "Closed")}
        </span>
      </div>

      {ev.description && <p className="ph-card-desc">{ev.description}</p>}

      <div className="ph-row">
        <Cal /> 
        <span className="ph-row-strong">
          {start} - {end}
        </span>
      </div>

      <div className="ph-divider" />

      <div className="ph-stats">
        <div className="ph-stat">
          <Trophy /> 
          <span>{ev._cats} Categories</span>
        </div>
        <div className="ph-stat">
          <Users /> 
          <span>{ev._noms} Nominees</span>
        </div>
      </div>

      {/* Winners Preview - Only show if there are winners */}
      {winners?.items?.length > 0 && (
        <>
          <div className="ph-divider" />
          <div className="ph-winners">
            {winners.items.slice(0, 3).map((it, index) => (
              <div key={it.id} className="ph-winner">
                <div className="ph-winner-thumb">
                  <img
                    alt={it.displayName || ""}
                    src={abs(it.photoUrl) || PLACEHOLDER_SVG}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_SVG; }}
                  />
                  <span className="ph-winner-pos">#{index + 1}</span>
                </div>
                <div className="ph-winner-meta">
                  <div className="ph-winner-cat">{it.categoryName}</div>
                  <div className="ph-winner-name">{it.displayName}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Always show "View Details" for public view */}
      <Link to={`/e/${ev.id}`} className="ph-btn">
        View Details
      </Link>
    </article>
  );
}

/* Helper Functions */
function isActive(sAt, eAt, now) {
  const s = sAt ? new Date(sAt) : null;
  const e = eAt ? new Date(eAt) : null;
  if (s && now < s) return false;
  if (e && now > e) return false;
  return true;
}

function isUpcoming(sAt, now) {
  const s = sAt ? new Date(sAt) : null;
  return !!(s && now < s);
}

function fmtDate(d) {
  if (!d) return "—";
  try { 
    return new Date(d).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }); 
  } catch { return String(d); }
}
