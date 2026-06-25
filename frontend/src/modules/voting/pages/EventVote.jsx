import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getEventBundle, castVote, getMyVotes } from "../api";
import "./EventVote.css";

/* --- Inline SVG icons --- */
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
    <path fill="currentColor" d="M6 3h12v6a6 6 0 0 1-12 0V3zm-3 3h2v3a8 8 0 0 0 2 5.3V17H5v2h14v-2h-2v-2.7A8 8 0 0 0 19 9V6h2V4h-2V3h-2v1H7V3H5v1H3v2z"/>
  </svg>
);
const IconUser = (props) => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...props}>
    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);
const IconStar = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IconTarget = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
  </svg>
);
const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
const IconClose = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

/* --- photo resolver (non-breaking) --- */
function resolveNomineePhoto(n) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
  const fromString = (s) => {
    if (!s) return "";
    if (/^https?:\/\//.test(s) || s.startsWith("data:")) return s;
    if (s.startsWith("/")) return `${API_BASE}${s}`;
    return `${API_BASE}/uploads/${s}`;
  };
  const pick = (v) => (typeof v === "string" ? v : "");

  const raw =
    n.photoUrl ??
    n.photo ??
    n.imageUrl ??
    n.image ??
    n.avatar ??
    n.pic ??
    (n.media && (n.media.url || n.media[0]?.url)) ??
    n.fileName ??
    null;

  if (typeof raw === "string") return fromString(raw);

  if (raw && typeof raw === "object") {
    const cand =
      pick(raw.url) || pick(raw.path) || pick(raw.fileName) || pick(raw.filename) || pick(raw.location);
    if (cand) return fromString(cand);
  }

  const pid = n.photoId ?? n.id;
  return pid ? `${API_BASE}/api/nominees/${pid}/photo` : "";
}

export default function EventVote() {
  const params = useParams();
  const eventId = params.eventId || params.id;
  const loc = useLocation();
  const navigate = useNavigate();

  // Feature toggles
  const REVIEW_MODE = import.meta.env.VITE_REVIEW_BEFORE_SUBMIT === "1";
  const ALLOW_EDIT = new URLSearchParams(loc.search).get("edit") === "1";

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [voted, setVoted] = useState({});
  const [busy, setBusy] = useState({});
  const [draft, setDraft] = useState({});
  const [showReview, setShowReview] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Toast state
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

  // Logout function
  const logoutHere = useCallback(() => {
    ["auth","student_auth","admin_auth","token","accessToken","refreshToken","nominee_auth","user","role"]
      .forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });

    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME ||
      "/";

    let dest;
    try { dest = new URL(PUBLIC_HOME); }
    catch { dest = new URL(PUBLIC_HOME, window.location.origin); }
    dest.searchParams.set("toast", "logout");

    window.location.replace(dest.toString());
  }, []);

  // Cancel edit mode and go back with toast
  const cancelEdit = useCallback(() => {
    try {
      sessionStorage.setItem(
        "nav_toast",
        JSON.stringify({ 
          ts: Date.now(), 
          kind: "info", 
          message: "Canceled edit" 
        })
      );
    } catch { /* empty */ }
    navigate(-1); // Go back to previous page
  }, [navigate]);

  // Navigate back to MyVote with success toast
  const navigateToMyVoteWithToast = useCallback((message) => {
    try {
      sessionStorage.setItem(
        "nav_toast",
        JSON.stringify({ 
          ts: Date.now(), 
          kind: "success", 
          message: message
        })
      );
    } catch { /* empty */ }
    navigate("/my-vote");
  }, [navigate]);

  // Load event bundle
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await getEventBundle(eventId);
        if (ok) setBundle(res);
      } catch (e) {
        if (ok) setErr(e?.response?.data?.message || "Failed to load event.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [eventId]);

  // Load my votes for this event
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const data = await getMyVotes();
        const arr =
          Array.isArray(data) ? data :
          Array.isArray(data?.data) ? data.data :
          Array.isArray(data?.items) ? data.items :
          Array.isArray(data?.content) ? data.content :
          Array.isArray(data?.results) ? data.results : [];
        const map = {};
        for (const v of arr) {
          const evId = Number(v.eventId ?? v.event?.id);
          if (String(evId) !== String(eventId)) continue;
          const catId = v.categoryId ?? v.category?.id;
          const nomId = v.nomineeId ?? v.nominee?.id;
          if (catId && nomId) map[catId] = nomId;
        }
        if (ok) {
          setVoted(map);
          if (REVIEW_MODE && Object.keys(map).length > 0) setSubmittedOnce(true);
        }
      } catch { /* empty */ }
    })();
    return () => { ok = false; };
  }, [eventId, REVIEW_MODE]);

  const event = bundle?.event || null;
  const categories = bundle?.categories || [];
  const nomineesFlat = bundle?.nominees;
  const nomineesByCategoryFromMap = bundle?.nomineesByCategory || null;

  // tolerate nominees[] or nomineesByCategory{}
  const nomsByCat = useMemo(() => {
    const m = new Map();
    if (nomineesByCategoryFromMap && typeof nomineesByCategoryFromMap === "object") {
      for (const [k, list] of Object.entries(nomineesByCategoryFromMap)) {
        m.set(Number(k), list || []);
      }
    } else {
      for (const n of nomineesFlat || []) {
        const k = n.categoryId ?? n.category?.id;
        if (!k) continue;
        (m.get(k) || m.set(k, []).get(k)).push(n);
      }
    }
    return m;
  }, [nomineesFlat, nomineesByCategoryFromMap]);

  const status = useMemo(() => {
    if (!event) return { active: false, label: "—", color: "#6b7280" };
    const now = new Date();
    const s = event.startAt || event.startDate ? new Date(event.startAt || event.startDate) : null;
    const e = event.endAt   || event.endDate   ? new Date(event.endAt   || event.endDate)   : null;
    if (s && now < s) return { active: false, label: "UPCOMING",  color: "#3b82f6" };
    if (e && now > e) return { active: false, label: "COMPLETED", color: "#6b7280" };
    return { active: true, label: "ACTIVE", color: "#10b981" };
  }, [event]);

  // status pill style
  const getStatusInfo = (label) => {
    const L = String(label || "").toLowerCase();
    if (L.includes("active")) return { background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", text: "Active - Voting Open" };
    if (L.includes("upcoming")) return { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", text: "Coming Soon" };
    if (L.includes("complete")) return { background: "linear-gradient(135deg,#6b7280,#4b5563)", color: "#fff", text: "Completed" };
    return { background: "linear-gradient(135deg,#6b7280,#4b5563)", color: "#fff", text: label || "—" };
  };
  const statusInfo = getStatusInfo(status.label);

  // actions
  const handleVote = async (categoryId, nominee) => {
    if (REVIEW_MODE) {
      setDraft(d => ({ ...d, [categoryId]: nominee.id }));
      return;
    }
    if (!status.active || (voted[categoryId] && !ALLOW_EDIT)) return;
    setBusy(b => ({ ...b, [nominee.id]: true }));
    try {
      await castVote({ eventId: Number(eventId), categoryId, nomineeId: nominee.id });
      setVoted(v => ({ ...v, [categoryId]: nominee.id }));
      setSubmittedOnce(true);
      localStorage.setItem("votes_dirty", String(Date.now()));
      
      // Show different toast message for edit mode vs new votes
      if (ALLOW_EDIT) {
        showToast("Selection updated successfully", "success");
      } else {
        showToast("Vote recorded.", "success");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to cast vote", "error", 3600);
    } finally {
      setBusy(b => ({ ...b, [nominee.id]: false }));
    }
  };

  const submitAll = async () => {
    const entries = Object.entries(draft);
    if (!entries.length) { showToast("You haven't selected any nominees.", "info"); return; }
    setShowReview(false);
    try {
      await Promise.all(
        entries.map(([categoryId, nomineeId]) =>
          castVote({ eventId: Number(eventId), categoryId: Number(categoryId), nomineeId })
        )
      );
      setVoted(prev => ({ ...prev, ...draft }));
      setDraft({});
      setSubmittedOnce(true);
      localStorage.setItem("votes_dirty", String(Date.now()));
      
      // Show different toast message for edit mode and navigate with toast
      if (ALLOW_EDIT) {
        navigateToMyVoteWithToast("Selections updated successfully");
      } else {
        navigateToMyVoteWithToast("Your selections have been submitted.");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to submit votes", "error", 3600);
    }
  };

  const submittedCount = useMemo(
    () => Object.keys(voted).filter(cid => !!voted[cid]).length,
    [voted]
  );
  const postSubmitLocked = submittedOnce && !ALLOW_EDIT;

  // helpers
  const totalNominees = useMemo(() => countAllNominees(nomsByCat), [nomsByCat]);
  const periodText = useMemo(
    () => dateRange(event?.startAt || event?.startDate, event?.endAt || event?.endDate),
    [event?.startAt, event?.startDate, event?.endAt, event?.endDate]
  );

  return (
    <div className="public-event">
      {/* Header with edit mode controls */}
      <header className="vh__topbar">
        <div className="vh__topbar-inner">
          <Link to="/" className="vh__brand">
            <div className="vh__logo">🗳️</div>
            <span className="vh__brand-text">University Voting</span>
            <span className="vh__badge">Voting Portal</span>
          </Link>

          <div className="vh__actions">
            {ALLOW_EDIT && (
              <div className="event-vote__edit-controls">
                <span className="event-vote__edit-pill">
                  Edit Mode
                </span>
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="event-vote__cancel-edit"
                >
                  <IconClose />
                  Cancel
                </button>
              </div>
            )}
            <Link to="/my-vote" className="vh__btn vh__btn-green">
              <span className="vh__btn-ico">📊</span> My Vote
            </Link>
            <button type="button" onClick={logoutHere} className="vh__btn vh__btn-red">
              <span className="vh__btn-ico">🚪</span> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="public-event__main">
        {/* Edit mode banner */}
        {ALLOW_EDIT && (
          <div className="edit-mode-banner">
            <IconEdit className="edit-mode-banner__icon" />
            <div className="edit-mode-banner__content">
              <strong className="edit-mode-banner__title">Edit Mode Active</strong>
              <p className="edit-mode-banner__description">
                You can change your previous votes. Click "Cancel" to exit edit mode.
              </p>
            </div>
          </div>
        )}

        {/* Review toolbar */}
        {REVIEW_MODE && (
          <div className="review-toolbar">
            <div className="review-toolbar__left">
              <span className="review-toolbar__dot">•</span>
              {!postSubmitLocked ? (
                <span>Selected {Object.keys(draft).length}/{categories.length}</span>
              ) : (
                <span>Submitted {submittedCount}/{categories.length}</span>
              )}
            </div>
            <div>
              {!postSubmitLocked ? (
                <button
                  className="review-toolbar__btn"
                  onClick={() => setShowReview(true)}
                  disabled={!Object.keys(draft).length}
                >
                  Review &amp; Submit
                </button>
              ) : (
                <button className="review-toolbar__btn" disabled>
                  Submitted
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="public-event__nav">
          <Link to="/voting" className="public-event__back-link">
            <IconArrowLeft />
            Back to Events
          </Link>
        </div>

        {/* Loading / error / not found */}
        {loading && (
          <div className="public-event__loading">
            <div className="public-event__spinner"></div>
            <h3>Loading Event</h3>
            <p>Please wait while we load the event details...</p>
          </div>
        )}
        {!loading && err && (
          <div className="public-event__error">
            <h3>Error Loading Event</h3>
            <p>{err}</p>
          </div>
        )}
        {!loading && !err && !event && (
          <div className="public-event__not-found">
            <h3>Event Not Found</h3>
            <p>The event you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        )}

        {/* Event Header */}
        {event && (
          <div className="event-header">
            <div className="event-header__top">
              <div>
                <h1 className="event-header__title">{event.name}</h1>
                {event.description && (
                  <p className="event-header__description">{event.description}</p>
                )}
              </div>
              <div 
                className="event-header__status"
                style={{ 
                  background: statusInfo.background,
                  color: statusInfo.color
                }}
              >
                {statusInfo.text}
              </div>
            </div>

            <div className="event-header__stats">
              <StatTile 
                gradient="linear-gradient(135deg, #3b82f6, #2563eb)" 
                icon={<IconCalendar />} 
                label="Duration" 
                value={periodText} 
              />
              <StatTile 
                gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                icon={<IconTrophy />} 
                label="Categories" 
                value={`${categories.length} Award Categories`} 
              />
              <StatTile 
                gradient="linear-gradient(135deg, #10b981, #059669)" 
                icon={<IconUser />} 
                label="Nominees" 
                value={`${totalNominees} Total Nominees`} 
              />
              <StatTile 
                gradient="linear-gradient(135deg, #f59e0b, #d97706)" 
                icon={<IconStar />} 
                label={REVIEW_MODE ? "Submitted" : "Status"} 
                value={REVIEW_MODE ? `${submittedCount}/${categories.length}` : status.label} 
              />
            </div>
          </div>
        )}

        {/* Categories + Nominees */}
        {event && (
          <section className="categories-section">
            {categories.length === 0 ? (
              <div className="public-event__empty">
                <h3>No Categories Yet</h3>
                <p>Categories will be added soon. Please check back later.</p>
              </div>
            ) : (
              categories.map((cat) => {
                const list = nomsByCat.get(cat.id) || [];
                return (
                  <article key={cat.id} className="category-card">
                    <div className="category-card__header">
                      <span style={{ fontSize: '32px' }}>🎯</span>
                      <div style={{ flex: 1 }}>
                        <h2 className="category-card__title">{cat.name}</h2>
                        {cat.description && (
                          <p className="category-card__description">{cat.description}</p>
                        )}
                      </div>
                      <div className="category-card__count">
                        <IconTarget />
                        {list.length} Nominee{list.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {list.length === 0 ? (
                      <div style={{ paddingTop: '8px', color: '#64748b' }}>
                        No nominees yet.
                      </div>
                    ) : (
                      <div className="nominees-grid">
                        {list.map((n) => {
                          const selected = postSubmitLocked
                            ? voted[cat.id] === n.id
                            : (REVIEW_MODE ? draft[cat.id] === n.id : voted[cat.id] === n.id);

                          const categoryLockedOther =
                            !postSubmitLocked && REVIEW_MODE && draft[cat.id] && draft[cat.id] !== n.id;

                          const isBusy = !!busy[n.id];

                          return (
                            <div
                              key={n.id}
                              className={`nominee-card ${selected ? 'nominee-card--selected' : ''}`}
                            >
                              <div className="nominee-card__image-container">
                                {(() => {
                                  const photoSrc = resolveNomineePhoto(n);
                                  return photoSrc ? (
                                    <img
                                      src={photoSrc}
                                      alt={n.name}
                                      className="nominee-card__image"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const placeholder = e.currentTarget.parentElement.querySelector('.nominee-no-photo');
                                        if (placeholder) placeholder.style.display = 'flex';
                                      }}
                                    />
                                  ) : null;
                                })()}
                                <div className="nominee-no-photo">
                                  <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
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
                              </div>

                              <div className="nominee-card__header">
                                <h3 className="nominee-card__name">{n.name}</h3>
                                {selected && (
                                  <div className="nominee-card__selected">
                                    ✓ Selected
                                  </div>
                                )}
                              </div>

                              {(n.description || n.bio || n.additionalInfo) && (
                                <p className="nominee-card__description">
                                  {n.description || n.bio || n.additionalInfo}
                                </p>
                              )}

                              <button
                                className={`nominee-card__button ${
                                  selected ? 'nominee-card__button--voted' : 'nominee-card__button--vote'
                                }`}
                                disabled={
                                  !status.active ||
                                  postSubmitLocked ||
                                  (!REVIEW_MODE && !!voted[cat.id] && !ALLOW_EDIT) ||
                                  (REVIEW_MODE && !!voted[cat.id] && !ALLOW_EDIT) ||
                                  categoryLockedOther ||
                                  isBusy
                                }
                                onClick={() => handleVote(cat.id, n)}
                                title={categoryLockedOther ? "You already selected someone in this category. Clear to change." : undefined}
                              >
                                {postSubmitLocked
                                  ? (selected ? "Voted ✓" : "Select")
                                  : (REVIEW_MODE
                                    ? (selected ? "Selected ✓" : "Select")
                                    : (isBusy ? "Voting…" : selected ? "Voted ✓" : `Vote for ${n.name.split(' ')[0] || 'Nominee'}`))}
                              </button>

                              {!postSubmitLocked && REVIEW_MODE && selected && (
                                <button
                                  className="nominee-card__clear"
                                  onClick={() =>
                                    setDraft(d => {
                                      const copy = { ...d }; delete copy[cat.id]; return copy;
                                    })
                                  }
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* Review modal */}
        {REVIEW_MODE && showReview && (
          <ReviewModal
            onClose={() => setShowReview(false)}
            onSubmit={submitAll}
            categories={categories}
            nomsByCat={nomsByCat}
            draft={draft}
          />
        )}
      </main>

      <Toast message={toast?.message} kind={toast?.kind} onClose={() => setToast(null)} />
    </div>
  );
}

/* --- Small stat card --- */
function StatTile({ gradient, icon, label, value }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__icon" style={{ background: gradient }}>
        {icon}
      </div>
      <div className="stat-tile__content">
        <div className="stat-tile__label">{label}</div>
        <div className="stat-tile__value">{value}</div>
      </div>
    </div>
  );
}

/* --- helpers --- */
function countAllNominees(nomsByCat) {
  let total = 0;
  for (const [, list] of nomsByCat.entries()) total += list.length;
  return total;
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

/* --- Review modal & Toast --- */
function ReviewModal({ onClose, onSubmit, categories, nomsByCat, draft }) {
  const byId = new Map();
  for (const [, list] of nomsByCat.entries()) {
    for (const n of list) byId.set(n.id, n);
  }

  const selected = Object.entries(draft).map(([catId, nomId]) => ({
    category: categories.find(c => c.id === Number(catId)),
    nominee: byId.get(nomId)
  }));
  const skipped = categories.filter(c => !draft[c.id]);

  return (
    <div className="review-modal__backdrop" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="review-modal__header">
          <h3>Review your selections</h3>
          <button className="review-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="review-modal__body">
          <div className="review-modal__section">
            <h4>Selected ({selected.length})</h4>
            {selected.length === 0 ? <p style={{ color: '#64748b', fontStyle: 'italic' }}>No selections yet.</p> : (
              <ul className="review-modal__list">
                {selected.map((row, i) => (
                  <li key={i}>
                    <strong>{row.category?.name || `Category ${i + 1}`}</strong>
                    <span className="review-modal__sep">—</span>
                    <span>{row.nominee?.name || row.nominee?.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="review-modal__section">
            <h4>Skipped ({skipped.length})</h4>
            {skipped.length === 0 ? <p style={{ color: '#64748b', fontStyle: 'italic' }}>No skipped categories.</p> : (
              <ul className="review-modal__list" style={{ color: '#64748b' }}>
                {skipped.map(c => <li key={c.id}>{c.name}</li>)}
              </ul>
            )}
          </div>
        </div>
        <div className="review-modal__footer">
          <button className="review-modal__cancel" onClick={onClose}>Back</button>
          <button className="review-modal__submit" onClick={onSubmit} disabled={!selected.length}>
            Submit {selected.length} vote{selected.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

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
