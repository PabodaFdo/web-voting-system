import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicEventBundle } from "../api.js";
import "./PublicEvent.css";
import PublicCategoryCharts from "./PublicCategoryCharts";

/* Icons */
const IconArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);
const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"/>
  </svg>
);
const IconTrophy = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="currentColor" d="M17 3V1H7v2H3v4a5 5 0 0 0 4 4.9V14H8a4 4 0 0 0 3 3.87V20H8v2h8v-2h-3v-2.13A4 4 0 0 0 16 14h1v-2.1A5 5 0 0 0 21 7V3h-4zm-8 8.9A3 3 0 0 1 6 9V5h1v6.9zM18 9a3 3 0 0 1-3 2.9V5h3v4z"/>
  </svg>
);
const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);
const IconTarget = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
  </svg>
);
const IconUser = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
  </svg>
);

export default function PublicEvent() {
  const { eventId } = useParams();
  const [bundle, setBundle] = useState({ event: null, categories: [], nominees: [] });
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
    let ok = true;
    (async () => {
      try {
        const b = await getPublicEventBundle(eventId);
        if (ok) setBundle(b);
      } catch {
        if (ok) setErr("Failed to load event.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [eventId]);

  const { event, categories, nominees } = bundle;

  // Group nominees by category.
  const nomsByCat = useMemo(() => {
    const m = new Map();
    for (const n of nominees || []) {
      const k = n.categoryId ?? n.category?.id;
      if (!k) continue;
      (m.get(k) || m.set(k, []).get(k)).push(n);
    }
    return m;
  }, [nominees]);

  const totalNominees = useMemo(() => countAllNominees(nomsByCat), [nomsByCat]);
  const periodText = useMemo(
    () => dateRange(event?.startAt || event?.startDate, event?.endAt || event?.endDate),
    [event?.startAt, event?.startDate, event?.endAt, event?.endDate]
  );

  const status = useMemo(() => {
    const now = new Date();
    const s = event?.startAt || event?.startDate ? new Date(event.startAt || event.startDate) : null;
    const e = event?.endAt || event?.endDate ? new Date(event.endAt || event.endDate) : null;
    if (s && now < s) return { label: "Coming Soon", active: false, cssClass: "pe-status--soon" };
    if (e && now > e) return { label: "Completed", active: false, cssClass: "pe-status--done" };
    return { label: "Active", active: true, cssClass: "pe-status--active" };
  }, [event?.startAt, event?.startDate, event?.endAt, event?.endDate]);

  return (
    <div className="public-event">
      <header className={`vh__topbar ${navScrolled ? 'scrolled' : ''} ${navHidden ? 'hidden' : ''}`}>
        <div className="vh__topbar-inner">
          <Link to="/events" className="vh__brand" aria-label="Back to Events">
            <div className="vh__logo">🎓</div>
            <span className="vh__brand-text">Bright Future</span>
            <span className="vh__badge">Public Portal</span>
          </Link>
          <div className="vh__actions">
            <Link to="/events" className="vh__btn vh__btn-white">
              <span className="vh__btn-ico">🏛️</span> All Events
            </Link>
          </div>
        </div>
      </header>

      <main className="public-event__main">
        {loading ? (
          <div className="pe-empty">
            <h3>Loading event…</h3>
            <p>Please wait while we fetch the event details.</p>
          </div>
        ) : err ? (
          <div className="pe-empty" style={{ background: "rgba(254, 226, 226, 0.95)" }}>
            <h3 style={{ color: "#991b1b" }}>Error Loading Event</h3>
            <p style={{ color: "#991b1b" }}>{err}</p>
          </div>
        ) : !event ? (
          <div className="pe-empty">
            <h3>Event Not Found</h3>
            <p>The event you're looking for doesn't exist or has been removed.</p>
          </div>
        ) : (
          <>
            <section className="pe-header-card">
              <div className="pe-header-content">
                <h1 className="pe-title">{event.name}</h1>
                {event.description && (
                  <p className="pe-subtext">{event.description}</p>
                )}
                <div className="pe-status-container">
                  <span className={`pe-status ${status.cssClass}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Metric tiles */}
              <div className="pe-tiles">
                <div className="pe-tile">
                  <div className="pe-tile-ico pe-tile-ico--blue">
                    <IconCalendar />
                  </div>
                  <div className="pe-tile-content">
                    <div className="pe-tile-label">Duration</div>
                    <div className="pe-tile-value">{periodText}</div>
                  </div>
                </div>
                
                <div className="pe-tile">
                  <div className="pe-tile-ico pe-tile-ico--violet">
                    <IconTrophy />
                  </div>
                  <div className="pe-tile-content">
                    <div className="pe-tile-label">Categories</div>
                    <div className="pe-tile-value">{categories.length} Award Categories</div>
                  </div>
                </div>
                
                <div className="pe-tile">
                  <div className="pe-tile-ico pe-tile-ico--green">
                    <IconUsers />
                  </div>
                  <div className="pe-tile-content">
                    <div className="pe-tile-label">Nominees</div>
                    <div className="pe-tile-value">{totalNominees} Total Nominees</div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="pe-section-hero">
                <h2>
                  <IconTarget />
                  <span>Award Categories</span>
                </h2>
                <p>Browse the categories and their nominees below</p>
              </div>

              {categories.length === 0 ? (
                <div className="pe-empty">
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                  <h3>No Categories Yet</h3>
                  <p>Categories will be added to this event soon.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 24 }}>
                  {categories.map((cat) => {
                    const list = nomsByCat.get(cat.id) || [];
                    const totalVotes = sumVotes(list);
                    return (
                      <div key={cat.id} className="category-card">
                        <div className="category-card__header">
                          <div className="category-card__title-wrapper">
                            <h2 className="category-card__title">
                              <span style={{ fontSize: 22, lineHeight: 1 }}>🎯</span>
                              {cat.name}
                            </h2>

                            <div className="category-card__nominee-count">
                              <span className="category-card__count-badge">{list.length}</span>
                              <span className="category-card__count-text">
                                {list.length === 1 ? "Nominee" : "Nominees"}
                              </span>
                            </div>
                          </div>

                          {cat.description && (
                            <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>
                              {cat.description}
                            </p>
                          )}
                        </div>

                        {/* Nominees heading */}
                        <div className="pe-nom-block">
                          <div className="pe-nom-title">Nominees</div>
                          <div className="pe-nom-sub">Learn more about each nominee below</div>
                        </div>

                        {/* Nominees grid */}
                        {list.length === 0 ? (
                          <div style={{ paddingTop: 16, color: "#64748b", textAlign: "center" }}>
                            No nominees yet.
                          </div>
                        ) : (
                          <div className="pe-nominees-grid">
                            {list.map((n) => (
                              <NomineeCard key={n.id} nominee={n} totalVotes={totalVotes} />
                            ))}
                          </div>
                        )}

                        {/* Chart under nominees */}
                        <PublicCategoryCharts categoryId={cat.id} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* --- Nominee Card Component --- */
function NomineeCard({ nominee, totalVotes = 0 }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
  const raw = nominee.photo || nominee.photoUrl || nominee.image || nominee.imageUrl || nominee.fileName || "";
  let photoSrc = "";
  
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
      photoSrc = raw;
    } else if (raw.startsWith("/")) {
      photoSrc = `${API_BASE}${raw}`;
    } else {
      photoSrc = `${API_BASE}/uploads/${raw}`;
    }
  } else if (nominee.photoId || nominee.id) {
    const pid = nominee.photoId ?? nominee.id;
    photoSrc = `${API_BASE}/api/nominees/${pid}/photo`;
  }

  const hasPhoto = !!photoSrc;
  
  const votes = valueNum(
    nominee.voteCount ?? nominee.votes ?? nominee.count ?? nominee.totalVotes ?? nominee.vote
  ) ?? 0;

  const explicitPct =
    valueNum(nominee.votePercent) ??
    valueNum(nominee.percentage) ??
    valueNum(nominee.votePercentage);

  const percent =
    explicitPct != null ? explicitPct :
    totalVotes > 0 ? (votes / totalVotes) * 100 : null;

  const pctText = percent != null ? `${Math.round(percent)}%` : null;

  return (
    <div className="pe-nom-card">
      <div className="pe-nom-imgwrap">
        {hasPhoto ? (
          <>
            <img
              src={photoSrc}
              alt={nominee.name}
              className="pe-nom-img"
              onError={(e) => { 
                e.currentTarget.style.display = "none";
                // Show placeholder when image fails to load
                const placeholder = e.currentTarget.nextElementSibling;
                if (placeholder) {
                  placeholder.style.display = "flex";
                  placeholder.classList.add("pe-nom-fallback--visible");
                }
              }}
            />
            {/* Fallback placeholder - hidden by default, shown on error */}
            <div 
              className="pe-nom-fallback"
              style={{ display: "none" }}
            >
              <div style={{ 
                width: "48px", 
                height: "48px", 
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
                  <path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2v11Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="13"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span>No Photo</span>
            </div>
          </>
        ) : (
          /* No photo placeholder - shown when no photo source available */
          <div className="pe-nom-fallback pe-nom-fallback--visible">
            <div style={{ 
              width: "48px", 
              height: "48px", 
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
                <path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2v11Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span>No Photo</span>
          </div>
        )}

        {pctText && <div className="pe-nom-chip">{pctText}</div>}
      </div>

      <h3 className="pe-nom-name">{nominee.name}</h3>

      {nominee.description && (
        <p className="pe-nom-desc">{nominee.description}</p>
      )}

      {percent != null && (
        <div className="pe-nom-progress">
          <div
            className="pe-nom-progress__fill"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* --- Helper Functions --- */
function countAllNominees(map) {
  let total = 0;
  map.forEach((arr) => { total += arr.length; });
  return total;
}

function sumVotes(list) {
  let sum = 0;
  for (const n of list) {
    const v = valueNum(n.voteCount ?? n.votes ?? n.count ?? n.totalVotes ?? n.vote);
    if (v != null) sum += v;
  }
  return sum;
}

function valueNum(v) {
  return typeof v === "number" && isFinite(v) ? v : null;
}

function dateRange(sAt, eAt) {
  const s = sAt ? new Date(sAt) : null;
  const e = eAt ? new Date(eAt) : null;
  const fmt = (d) =>
    d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "TBD";
  if (!s && !e) return "Anytime";
  if (s && !e) return `Starts ${fmt(s)}`;
  if (!s && e) return `Ends ${fmt(e)}`;
  return `${fmt(s)} – ${fmt(e)}`;
}
