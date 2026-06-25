import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMyVotes, getEventBundle, deleteMyVote } from "../api";
import "./MyVote.css";

/* Auth helpers */
const readAuth = () => { try { return JSON.parse(localStorage.getItem("auth") || "null"); } catch { return null; } };
const hasToken = (a) => !!(a?.token || a?.accessToken);
const getRole  = (a) =>
  (a?.role || a?.user?.role || (Array.isArray(a?.roles) ? a.roles[0] : null) || "")
    .toString()
    .toUpperCase() || null;

const isAuthed = () => hasToken(readAuth());
const currentRole = () => getRole(readAuth());

export default function MyVote() {
  const navigate = useNavigate();
  const location = useLocation();

  /* header/auth state */
  const [authed, setAuthed] = useState(isAuthed());
  const [role, setRole] = useState(currentRole());
  useEffect(() => {
    const onStorage = () => { setAuthed(isAuthed()); setRole(currentRole()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const goToMyVote = useCallback(() => navigate("/my-vote"), [navigate]);

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
    window.location.replace(dest.toString());
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
  const eventFilter = new URLSearchParams(location.search).get("event");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [bundles, setBundles] = useState(new Map());
  const [fetchingBundles, setFetchingBundles] = useState(false);
  const [resettingEvent, setResettingEvent] = useState(null);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = (message, kind = "info", timeout = 3000) => {
    setToast({ message, kind });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), timeout);
  };
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Check for toast from EventVote when component mounts
  useEffect(() => {
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

  // normalize /myVotes payload
  const normalizeVotes = useCallback((data) => {
    const arr =
      Array.isArray(data) ? data :
      Array.isArray(data?.data) ? data.data :
      Array.isArray(data?.items) ? data.items :
      Array.isArray(data?.content) ? data.content :
      Array.isArray(data?.results) ? data.results : [];
    return arr
      .map((v) => {
        const evId = Number(v.eventId ?? v.event?.id);
        const catId = Number(v.categoryId ?? v.category?.id);
        const nomId = v.nomineeId ?? v.nominee?.id ?? null;
        return { eventId: evId, categoryId: catId, nomineeId: nomId };
      })
      .filter((r) => r.eventId && r.categoryId);
  }, []);

  const refetchMyVotes = useCallback(async () => {
    try {
      const data = await getMyVotes();
      setRows(normalizeVotes(data));
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load your votes.");
    }
  }, [normalizeVotes]);

  // initial load
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const data = await getMyVotes();
        if (ok) setRows(normalizeVotes(data));
      } catch (e) {
        if (ok) setErr(e?.response?.data?.message || "Failed to load your votes.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [normalizeVotes]);

  // refresh when votes change or tab is focused
  useEffect(() => {
    const onStorage = (e) => { if (e.key === "votes_dirty") refetchMyVotes(); };
    const onFocus = () => {
      if (document.visibilityState === "visible" && localStorage.getItem("votes_dirty")) {
        refetchMyVotes();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetchMyVotes]);

  // fetch bundles for each event
  useEffect(() => {
    const idsAll = Array.from(new Set(rows.map((r) => r.eventId)));
    const ids = eventFilter ? idsAll.filter((id) => String(id) === String(eventFilter)) : idsAll;
    if (!ids.length) return;
    setFetchingBundles(true);
    let ok = true;
    (async () => {
      try {
        const list = await Promise.all(ids.map((id) => getEventBundle(id).then((b) => [id, b])));
        if (ok) setBundles(new Map(list));
      } catch { /* ignore */ }
      finally { if (ok) setFetchingBundles(false); }
    })();
    return () => { ok = false; };
  }, [rows, eventFilter]);

  // group votes by event
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      if (eventFilter && String(r.eventId) !== String(eventFilter)) continue;
      (m.get(r.eventId) || m.set(r.eventId, []).get(r.eventId)).push(r);
    }
    return m;
  }, [rows, eventFilter]);

  const eventStatus = (event) => {
    if (!event) return { active: false, label: "—", color: "#6b7280", type: "completed" };
    const now = new Date();
    const s = event.startAt || event.startDate ? new Date(event.startAt || event.startDate) : null;
    const e = event.endAt || event.endDate ? new Date(event.endAt || event.endDate) : null;
    if (s && now < s) return { active: false, label: "UPCOMING", color: "#f59e0b", type: "upcoming" };
    if (e && now > e) return { active: false, label: "COMPLETED", color: "#6b7280", type: "completed" };
    return { active: true, label: "ACTIVE", color: "#10b981", type: "active" };
  };

  // actions
  const handleEditEvent = (eventId) => {
    showToast("Opening editor…", "info", 1400);
    navigate(`/voting/events/${eventId}?edit=1`);
  };

  const handleResetEvent = async (eventId, rowsForUi) => {
    const votedCategoryIds = rowsForUi.filter((r) => !!r.nomineeId).map((r) => r.categoryId);
    if (!votedCategoryIds.length) {
      showToast("No selections to reset in this event.", "info");
      return;
    }
    if (!confirm(`Reset all your selections for this event (${votedCategoryIds.length} category${votedCategoryIds.length > 1 ? "ies" : "y"})?`)) return;
    try {
      setResettingEvent(eventId);
      await Promise.all(votedCategoryIds.map((cid) => deleteMyVote(cid)));
      localStorage.setItem("votes_dirty", String(Date.now()));
      await refetchMyVotes();
      showToast("Selections reset successfully", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to reset your selections.", "error", 3600);
    } finally {
      setResettingEvent(null);
    }
  };

  // nominee photo resolver
  const resolveNomineePhoto = (n) => {
    if (!n) return "";
    const raw = n.photo ?? n.photoUrl ?? n.image ?? n.imageUrl ?? n.fileName ?? n.photoFile ?? null;
    const fromString = (str) => {
      if (!str) return "";
      if (/^https?:\/\//.test(str) || str.startsWith("data:")) return str;
      if (str.startsWith("/")) return `${API_BASE}${str}`;
      return `${API_BASE}/uploads/${str}`;
    };
    if (typeof raw === "string") return fromString(raw);
    if (raw && typeof raw === "object") {
      const cand = raw.url || raw.path || raw.fileName || raw.filename || raw.location || "";
      if (cand) return fromString(cand);
    }
    const pid = n.photoId ?? n.id;
    return pid ? `${API_BASE}/api/nominees/${pid}/photo` : "";
  };

  // Calculate stats
  const totalEvents = grouped.size;
  const totalCategories = rows.length;
  const totalVoted = rows.filter(r => r.nomineeId).length;
  const completionRate = totalCategories > 0 ? Math.round((totalVoted / totalCategories) * 100) : 0;

  return (
    <div className="myvote">
      {/* ===== TOP BAR ===== */}
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
                <span className="vh__btn-ico">🔓</span> Admin Login
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

      <main className="myvote__main">
        {/* Hero Section */}
        <div className="myvote__hero">
          <h1 className="myvote__title">My Voting Dashboard</h1>
          <p className="myvote__subtitle">Track your participation and manage your selections</p>
        </div>

        {/* Loading State */}
        {(loading || fetchingBundles) && (
          <div className="myvote__loading">
            <div className="myvote__spinner"></div>
            <p className="myvote__loading-text">Loading your votes…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && err && (
          <div className="myvote__error">
            <p>{err}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !fetchingBundles && grouped.size === 0 && (
          <div className="myvote__empty">
            <div className="myvote__empty-icon">🗳️</div>
            <h3 className="myvote__empty-title">No votes yet</h3>
            <p className="myvote__empty-text">Start participating by casting your first vote!</p>
            <Link to="/voting" className="myvote__empty-link">
              <span>🚀</span> Browse Events
            </Link>
          </div>
        )}

        {/* Content - Stats + Events */}
        {!loading && !fetchingBundles && grouped.size > 0 && (
          <>
            {/* Stats Cards */}
            <div className="myvote__stats">
              <div className="myvote__stat-card">
                <div className="myvote__stat-header">
                  <div className="myvote__stat-icon">🎯</div>
                  <div className="myvote__stat-label">Events</div>
                </div>
                <div className="myvote__stat-value">{totalEvents}</div>
                <div className="myvote__stat-detail">
                  {totalEvents === 1 ? "Active event" : "Total events participated"}
                </div>
              </div>

              <div className="myvote__stat-card">
                <div className="myvote__stat-header">
                  <div className="myvote__stat-icon">📋</div>
                  <div className="myvote__stat-label">Categories</div>
                </div>
                <div className="myvote__stat-value">{totalCategories}</div>
                <div className="myvote__stat-detail">
                  {totalVoted} voted · {totalCategories - totalVoted} pending
                </div>
              </div>

              <div className="myvote__stat-card">
                <div className="myvote__stat-header">
                  <div className="myvote__stat-icon">✅</div>
                  <div className="myvote__stat-label">Completion</div>
                </div>
                <div className="myvote__stat-value">{completionRate}%</div>
                <div className="myvote__stat-detail">
                  Overall participation rate
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="myvote__events">
              {[...grouped.entries()].map(([eventId, list]) => {
                const bundle = bundles.get(Number(eventId));
                const event = bundle?.event;
                const categories = bundle?.categories || [];

                const nomineeMap = new Map();
                if (Array.isArray(bundle?.nominees)) {
                  for (const n of bundle.nominees) nomineeMap.set(n.id, n);
                }
                if (bundle?.nomineesByCategory) {
                  for (const arr of Object.values(bundle.nomineesByCategory)) {
                    for (const n of arr) nomineeMap.set(n.id, n);
                  }
                }

                const byCat = new Map(list.map((r) => [r.categoryId, r]));
                const st = eventStatus(event);

                const rowsForUi = categories.map((c) => {
                  const row = byCat.get(c.id);
                  const nomineeId = row?.nomineeId || null;
                  const nominee = nomineeId ? nomineeMap.get(nomineeId) : null;
                  return {
                    categoryId: c.id,
                    categoryName: c.name,
                    nomineeId,
                    nomineeName: nominee?.name || (nomineeId ? `#${nomineeId}` : ""),
                    nomineePhoto: resolveNomineePhoto(nominee),
                  };
                });

                const submittedCount = rowsForUi.filter((r) => !!r.nomineeId).length;
                const progressPercent = rowsForUi.length > 0 
                  ? Math.round((submittedCount / rowsForUi.length) * 100) 
                  : 0;

                return (
                  <div key={eventId} className="myvote__event-card">
                    <div className="myvote__event-header">
                      <div className="myvote__event-top">
                        <div className="myvote__event-title-section">
                          <h2 className="myvote__event-name">{event?.name || `Event #${eventId}`}</h2>
                          <span className={`myvote__status-badge myvote__status-badge--${st.type}`}>
                            {st.type === "active" && "● "}
                            {st.type === "upcoming" && "⏰ "}
                            {st.type === "completed" && "✓ "}
                            {st.label}
                          </span>
                        </div>

                        <div className="myvote__event-actions">
                          <button
                            className="myvote__action-btn myvote__action-btn--primary"
                            disabled={!st.active}
                            onClick={() => handleEditEvent(eventId)}
                            title={st.active ? "Edit selections" : "Event ended"}
                          >
                            <span>✏️</span> Edit Selections
                          </button>
                          {st.active && submittedCount > 0 && (
                            <button
                              className="myvote__action-btn myvote__action-btn--danger"
                              disabled={resettingEvent === eventId}
                              onClick={() => handleResetEvent(eventId, rowsForUi)}
                              title="Reset all votes"
                            >
                              <span>🔄</span> {resettingEvent === eventId ? "Resetting…" : "Reset All"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="myvote__event-meta">
                        <div className="myvote__event-stat">
                          <span className="myvote__event-stat-icon">📋</span>
                          <span>
                            <span className="myvote__event-stat-value">{rowsForUi.length}</span> Categories
                          </span>
                        </div>
                        <div className="myvote__event-stat">
                          <span className="myvote__event-stat-icon">✅</span>
                          <span>
                            <span className="myvote__event-stat-value">{submittedCount}</span> Voted
                          </span>
                        </div>
                        <div className="myvote__event-stat">
                          <span className="myvote__event-stat-icon">⏳</span>
                          <span>
                            <span className="myvote__event-stat-value">{rowsForUi.length - submittedCount}</span> Pending
                          </span>
                        </div>
                      </div>

                      <div className="myvote__progress-bar">
                        <div 
                          className="myvote__progress-fill" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="myvote__categories">
                      <div className="myvote__categories-header">
                        <h3 className="myvote__categories-title">Your Selections</h3>
                        <p className="myvote__categories-subtitle">
                          {st.active 
                            ? "You can edit or clear your selections using the buttons above" 
                            : "This event has ended - selections are final"}
                        </p>
                      </div>

                      <div className="myvote__categories-grid">
                        {rowsForUi.map((row) => (
                          <div 
                            key={row.categoryId} 
                            className={`myvote__category-item ${row.nomineeId ? 'myvote__category-item--selected' : ''}`}
                          >
                            <div className="myvote__category-header">
                              <h4 className="myvote__category-name">{row.categoryName}</h4>
                              <div className={`myvote__vote-indicator ${row.nomineeId ? 'myvote__vote-indicator--selected' : 'myvote__vote-indicator--empty'}`}>
                                {row.nomineeId ? "✓" : "○"}
                              </div>
                            </div>

                            {row.nomineeId ? (
                              <div className="myvote__selection">
                                {row.nomineePhoto && (
                                  <img
                                    src={row.nomineePhoto}
                                    alt={row.nomineeName}
                                    className="myvote__nominee-photo"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                )}
                                <div className="myvote__nominee-info">
                                  <div className="myvote__nominee-label">Selected Nominee</div>
                                  <div className="myvote__nominee-name">{row.nomineeName}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="myvote__no-selection">
                                <span className="myvote__no-selection-icon">⚪</span>
                                <span className="myvote__no-selection-text">Not selected yet</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Toast */}
      <Toast message={toast?.message} kind={toast?.kind} onClose={() => setToast(null)} />
    </div>
  );
}

/* Toast Component */
function Toast({ message, kind = "info", onClose }) {
  if (!message) return null;
  const cls = `ui-toast ui-toast--${kind}`;
  const icon = kind === "success" ? "✓" : kind === "error" ? "✕" : "ℹ";
  
  return (
    <div className={cls} role="status" aria-live="polite" onClick={onClose} title="Click to dismiss">
      <span className="ui-toast__icon">{icon}</span>
      <span className="ui-toast__text">{message}</span>
    </div>
  );
}
