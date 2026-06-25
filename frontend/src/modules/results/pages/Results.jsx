import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEvents, listResultSets, createResultSet } from "../api";
import "./Results.css";

/* ------------ Tiny Toasts ------------ */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    // auto-dismiss
    setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);
  const Stack = useCallback(() => (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => dismiss(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  ), [dismiss, toasts]);
  return { push, Stack };
}

/* ---- Inline SVG icons ---- */
const Icon = {
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Home: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 3l9 8h-3v10h-5V14H11v7H6V11H3l9-8z"/>
    </svg>
  ),
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  Chart: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 3h2v18H3V3zm16 18h2V9h-2v12zM7 21h2V13H7v8zm8 0h2V5h-2v16z"/>
    </svg>
  ),
  Award: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M17 4a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4l-2-2 2-2V6a2 2 0 0 1 2-2h10zm-5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
    </svg>
  ),
  Logout: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V9h14v9z"/>
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
  FileText: (p) => (
    <svg viewBox="0 0 24 24" width="48" height="48" {...p}>
      <path fill="currentColor" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
};

function adminLink(path = "/admin") {
  return path;
}

export default function Results() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(""); // start empty -> enables placeholder
  const [sets, setSets] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // validation helpers
  const [touched, setTouched] = useState({ eventId: false, title: false });
  const errors = useMemo(() => {
    const e = {};
    if (!eventId) e.eventId = "Please choose an event.";
    const t = title.trim();
    if (!t) e.title = "Title is required.";
    else if (t.length < 3) e.title = "Title must be at least 3 characters.";
    else if (t.length > 120) e.title = "Title must be 120 characters or less.";
    return e;
  }, [eventId, title]);
  const isValid = Object.keys(errors).length === 0;

  const navigate = useNavigate();
  const { push: pushToast, Stack: ToastStack } = useToasts();

  // Add smooth scrolling behavior
  useEffect(() => {
    const handleSmoothScroll = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (target) {
        e.preventDefault();
        const id = target.getAttribute('href').slice(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, []);

  // load events
  useEffect(() => {
    (async () => {
      try {
        const evs = await getEvents();
        setEvents(Array.isArray(evs) ? evs : []);
      } catch (err) {
        console.error("Failed to load events:", err);
        pushToast("Failed to load events.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [pushToast]);

  // load sets for selected event
  useEffect(() => {
    if (!eventId) { setSets([]); return; }
    (async () => {
      try {
        const resultSets = await listResultSets(eventId);
        setSets(Array.isArray(resultSets) ? resultSets : []);
      } catch (err) {
        console.error("Failed to load result sets:", err);
        pushToast("Failed to load result sets.", "error");
      }
    })();
  }, [eventId, pushToast]);

  const selectedEvent = useMemo(
    () => events.find((e) => String(e.id) === String(eventId)),
    [events, eventId]
  );

  async function handleCreate(e) {
    e.preventDefault();
    setTouched({ eventId: true, title: true });
    if (!isValid) {
      pushToast("Please fix the form errors and try again.", "error");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        eventId: Number(eventId),
        title: title.trim(),
        notes: notes.trim() || null,
      };
      const rs = await createResultSet(payload);

      // refresh list + clear form
      setTitle("");
      setNotes("");
      setSets(await listResultSets(eventId));

      pushToast("Result set created successfully.", "success");
      navigate(`/admin/results/set/${rs.id}`);
    } catch (err) {
      console.error("Failed to create result set:", err);
      const msg = err?.response?.data?.message || "Failed to create result set. Please try again.";
      pushToast(msg, "error");
    } finally {
      setCreating(false);
    }
  }

  const backToDashboard = useCallback(() => {
    window.location.assign(adminLink("/admin"));
  }, []);

  if (loading) {
    return (
      <div className="results-page">
        <div className="bg-gradient"></div>
        <div className="centered-container">
          <div className="results-loading">📊 Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      {/* Toasts */}
      <ToastStack />

      <div className="bg-gradient"></div>

      <div className="centered-container">
        {/* Top Navigation */}
        <nav className="results-top-nav" role="navigation" aria-label="Results Navigation">
          <div className="results-nav-content">
            <div className="results-nav-brand">
              <div className="results-nav-logo"><Icon.Star /></div>
              <span className="results-nav-title">Voting Admin</span>
            </div>

            <div className="results-nav-links">
              <a className="results-nav-link" href={adminLink("/admin")}>
                <Icon.Home style={{ display: 'block' }} /><span className="results-nav-link-text">Home</span>
              </a>
              <a className="results-nav-link" href={adminLink("/admin/dashboard")}>
                <Icon.Dashboard style={{ display: 'block' }} /><span className="results-nav-link-text">Dashboard</span>
              </a>
              <Link className="results-nav-link" to="/admin/results/analytics">
                <Icon.Chart style={{ display: 'block' }} /><span className="results-nav-link-text">Analytics</span>
              </Link>
              <span className="results-nav-link" aria-current="page" title="You're here">
                <Icon.Award style={{ display: 'block' }} /><span className="results-nav-link-text">Publish Winners</span>
              </span>
              <a className="results-nav-link" href={adminLink("/admin/students")}>
                <Icon.User style={{ display: 'block' }} /><span className="results-nav-link-text">Students</span>
              </a>
            </div>

            <button type="button" className="results-nav-back-btn" onClick={backToDashboard}>
              <Icon.ArrowLeft style={{ display: 'block' }} /><span className="results-nav-back-text">Back to Dashboard</span>
            </button>
          </div>
        </nav>

        {/* Header Section */}
        <div className="results-header">
          <div className="results-header-content">
            <div className="results-header-icon">🏆</div>
            <div>
              <h1 className="results-title"><span className="results-title-text">Results Management</span></h1>
              <p className="results-subtitle">Create and manage result sets for your voting events</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="results-grid">
          {/* Left Column - Create Form */}
          <div className="results-col-left">
            <section className="results-card">
              <div className="results-card-header">
                <h2 className="results-card-title"><Icon.Plus style={{ display: 'block' }} />Create New Result Set</h2>
              </div>
              <div className="results-card-body">
                {/* Select Event */}
                <div className="results-form-group-full">
                  <label htmlFor="event-select" className="results-label">
                    Select Event <span className="required">*</span>
                  </label>
                  <select
                    id="event-select"
                    className={`results-select ${touched.eventId && errors.eventId ? "input-invalid" : ""}`}
                    value={eventId}
                    onBlur={() => setTouched((t) => ({ ...t, eventId: true }))}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={creating}
                    required
                  >
                    <option value="">— Choose an event —</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                  {touched.eventId && errors.eventId && (
                    <div className="field-error">{errors.eventId}</div>
                  )}
                </div>

                {selectedEvent && (
                  <form onSubmit={handleCreate} className="results-form" noValidate>
                    {/* Title */}
                    <div className="results-form-group-full">
                      <label htmlFor="title-input" className="results-label">
                        Title <span className="required">*</span>
                      </label>
                      <input
                        id="title-input"
                        type="text"
                        className={`results-input ${touched.title && errors.title ? "input-invalid" : ""}`}
                        placeholder="e.g., Final Winners 2025"
                        value={title}
                        onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        minLength={3}
                        maxLength={120}
                        disabled={creating}
                      />
                      {touched.title && errors.title && (
                        <div className="field-error">{errors.title}</div>
                      )}
                      <p className="results-hint">Give your result set a descriptive title</p>
                    </div>

                    {/* Notes */}
                    <div className="results-form-group-full">
                      <label htmlFor="notes-input" className="results-label">
                        Notes <span className="optional">(optional)</span>
                      </label>
                      <textarea
                        id="notes-input"
                        className="results-textarea"
                        placeholder="Additional notes or description..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        disabled={creating}
                      />
                      <p className="results-hint">Add any additional context or details</p>
                    </div>

                    <button
                      type="submit"
                      className="results-create-btn"
                      disabled={creating || !isValid}
                    >
                      {creating ? (<><span className="spinner"></span>Creating...</>) : (<><Icon.Plus style={{ display: 'block' }} />Create Result Set</>)}
                    </button>
                  </form>
                )}

                {!selectedEvent && (
                  <div className="results-no-event">
                    <Icon.Calendar style={{ width: 32, height: 32, opacity: 0.5, display: 'block' }} />
                    <p>Select an event to create a result set</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - History */}
          <div className="results-col-right">
            <section className="results-card">
              <div className="results-card-header">
                <h2 className="results-card-title">
                  <Icon.FileText style={{ width: 20, height: 20, display: 'block' }} />
                  Result Sets History
                </h2>
                <span className="results-count-badge">{sets.length}</span>
              </div>
              <div className="results-card-body">
                {sets.length === 0 ? (
                  <div className="results-empty">
                    <Icon.FileText style={{ display: 'block', margin: '0 auto 16px' }} />
                    <p>No result sets yet</p>
                    <p className="results-empty-hint">Create your first result set to get started!</p>
                  </div>
                ) : (
                  <div className="results-list">
                    {sets.map((s) => (
                      <div key={s.id} className="results-list-item">
                        <div className="results-list-header">
                          <div className="results-list-title-row">
                            <h3 className="results-list-title">{s.title}</h3>
                            <span className={`results-status-badge ${(s.status || "draft").toLowerCase()}`}>
                              {s.status || "Draft"}
                            </span>
                          </div>
                          {s.notes && <p className="results-list-notes">{s.notes}</p>}
                        </div>

                        <div className="results-list-meta">
                          <div className="results-list-meta-item">
                            <span className="results-list-meta-label">Created:</span>
                            <span className="results-list-meta-value">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          {s.publishedAt && (
                            <div className="results-list-meta-item">
                              <span className="results-list-meta-label">Published:</span>
                              <span className="results-list-meta-value">
                                {new Date(s.publishedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="results-list-meta-item">
                            <span className="results-list-meta-label">Items:</span>
                            <span className="results-list-meta-value results-list-count">{s.itemsCount ?? 0}</span>
                          </div>
                        </div>

                        <Link to={`/set/${s.id}`} className="results-list-btn">Open Details →</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
