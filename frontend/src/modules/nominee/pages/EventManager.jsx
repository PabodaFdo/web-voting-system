import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../api";
import "./EventManager.css";

/* ---------- Name validation (like Category) ---------- */
const NAME_MIN = 3;
const NAME_MAX = 60;
const NAME_OK  = /^[A-Za-z0-9 .,&'()/-]+$/;
const trimmed  = (s = "") => s.replace(/\s+/g, " ").trim();
/* ----------------------------------------------------- */

/* --- lightweight toast (same markup as other pages; 3s auto-dismiss) --- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  return { toasts, show, dismiss };
}
function Toasts({ toasts, dismiss }) {
  return (
    <div className="toast-area">
      {toasts.map((t) => {
        const cls =
          t.type === "success" ? "ui-toast ui-toast--success" :
          t.type === "error"   ? "ui-toast ui-toast--error"   :
                                 "ui-toast ui-toast--info";
        return (
          <div key={t.id} className={cls} role="status" aria-live="polite" onClick={() => dismiss(t.id)} title="Close">
            <span className="ui-toast__dot">•</span>
            <span className="ui-toast__text">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Icons */
const Icon = {
  Dashboard: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>),
  Calendar:  (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V9h14v9z"/></svg>),
  Award:     (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><circle cx="12" cy="8" r="6" fill="currentColor"/><path fill="currentColor" d="M15.75 8l1.5 8-5.25-3-5.25 3 1.5-8"/></svg>),
  UserCircle:(p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/></svg>),
  ArrowLeft: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>),
  Star:      (p) => (<svg viewBox="0 0 24 24" width="24" height="24" {...p}><path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>),
  Plus:      (p) => (<svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>),
  Save:      (p) => (<svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z"/></svg>),
  Edit:      (p) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>),
  Trash:     (p) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>),
  Refresh:   (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>),
  X:         (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>),
  Clock:     (p) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>),
  Search:    (p) => (<svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>),
};

const empty = { name: "", description: "", startAt: "", endAt: "" };

/** format to input-local (YYYY-MM-DDTHH:mm) */
const toInput = (s) => (s ? s.slice(0, 16) : "");
const pad = (n) => (n < 10 ? "0" + n : "" + n);
const nowLocalInputOffset = (minutes = 0) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

/* Derive status for badge classes */
const statusOf = (startAt, endAt) => {
  const now = new Date();
  const s = startAt ? new Date(startAt) : null;
  const e = endAt ? new Date(endAt) : null;
  if (s && now < s) return "upcoming";
  if (e && now > e) return "ended";
  return "active";
};

/* ---------- validation helpers (same spirit as Category) ---------- */
const validateFields = (form, events, editingId) => {
  const errs = {};

  const nm = trimmed(form.name || "");
  if (!nm) errs.name = "Event name is required.";
  else if (nm.length < NAME_MIN) errs.name = `Name must be at least ${NAME_MIN} characters.`;
  else if (nm.length > NAME_MAX) errs.name = `Name must be at most ${NAME_MAX} characters.`;
  else if (!NAME_OK.test(nm)) errs.name = "Only letters, numbers, spaces and . , - & ' ( ) / are allowed.";
  else {
    const test = nm.toLowerCase();
    const dup = (events || []).some((ev) => {
      const same = trimmed(ev.name || "").toLowerCase() === test;
      const notSelf = editingId ? String(ev.id) !== String(editingId) : true;
      return same && notSelf;
    });
    if (dup) errs.name = "An event with this name already exists.";
  }

  if (!form.startAt) errs.startAt = "Start date & time is required.";
  if (!form.endAt) errs.endAt = "End date & time is required.";

  const s = form.startAt ? new Date(form.startAt) : null;
  const e = form.endAt ? new Date(form.endAt) : null;
  const nowMinute = new Date(nowLocalInputOffset(0));
  if (s && s < nowMinute) errs.startAt = "Start must be in the future.";
  if (s && e && e <= s) errs.endAt = "End must be after start.";

  return errs;
};
/* ------------------------------------------------------------------ */

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // field-level errors (computed live & visible immediately — like Category)
  const [fieldErr, setFieldErr] = useState({});
  const hasErrors = useMemo(() => Object.values(fieldErr).some(Boolean), [fieldErr]);

  // toasts
  const { toasts, show, dismiss } = useToast();

  // search + filter state for the list
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | upcoming | completed

  // dynamic mins for pickers
  const startMin = useMemo(() => nowLocalInputOffset(0), []);
  const endMin = useMemo(() => (form.startAt ? toInput(form.startAt) : startMin), [form.startAt, startMin]);

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvents();
      const list = (Array.isArray(res) ? res : res?.data || []).map((e) => ({
        id: e.id ?? e.eventId ?? e.uuid,
        name: e.name ?? e.title ?? e.eventName ?? "Untitled Event",
        description: e.description ?? e.desc ?? "",
        startAt: e.startAt ?? e.start_date ?? e.start ?? "",
        endAt: e.endAt ?? e.end_date ?? e.end ?? "",
      }));
      setEvents(list);
    } catch (err) {
      setError("Failed to load events. Please try again.");
      show("Failed to load events. Please try again.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  // compute & show validation immediately (mirrors Category page behavior)
  useEffect(() => {
    setFieldErr(validateFields(form, events, editingId));
  }, [form, events, editingId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const finalErrs = validateFields(form, events, editingId);
    setFieldErr(finalErrs);
    if (Object.values(finalErrs).some(Boolean)) return;

    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, name: trimmed(form.name) };
      if (editingId) {
        await updateEvent(editingId, payload);
        show("Event updated successfully.", "success");
      } else {
        await createEvent(payload);
        show("Event created successfully.", "success");
      }
      setEditingId(null);
      setForm(empty);
      await load();
    } catch (err) {
      setError("Failed to save event. Please try again.");
      show("Failed to save event. Please try again.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      name: ev.name || "",
      description: ev.description || "",
      startAt: ev.startAt || "",
      endAt: ev.endAt || "",
    });
    setFieldErr({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this event? This action cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteEvent(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(empty);
      }
      show("Event deleted.", "success");
      await load();
    } catch (err) {
      setError("Failed to delete event. Please try again.");
      show("Failed to delete event. Please try again.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(+d)) return iso;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // displayed events after search + status filter
  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      const name = (ev.name || "").toLowerCase();
      const desc = (ev.description || "").toLowerCase();
      const matchesQ = !q || name.includes(q) || desc.includes(q);

      const st = statusOf(ev.startAt, ev.endAt); // active | upcoming | ended
      const key = st === "ended" ? "completed" : st;
      const matchesStatus = status === "all" || key === status;

      return matchesQ && matchesStatus;
    });
  }, [events, query, status]);

  return (
    <div className="home-modern page-event">
      <Toasts toasts={toasts} dismiss={dismiss} />
      <div className="bg-gradient" />

      <div className="home-container">
        {/* Top Navigation */}
        <nav className="top-nav" role="navigation" aria-label="Event Manager Navigation">
          <div className="nav-content">
            <div className="nav-brand">
              <div className="nav-logo"><Icon.Star /></div>
              <span className="nav-title">Voting Admin</span>
            </div>

            <div className="nav-links">
              <Link className="nav-link" to="/admin/nominees" aria-label="Dashboard">
                <Icon.Dashboard /><span className="nav-link-text">Home</span>
              </Link>
              <Link className="nav-link" to="/admin/nominees/events" aria-label="Events">
                <Icon.Calendar /><span className="nav-link-text">Events</span>
              </Link>
              <Link className="nav-link" to="/admin/nominees/categories" aria-label="Categories">
                <Icon.Award /><span className="nav-link-text">Categories</span>
              </Link>
              <Link className="nav-link" to="/admin/nominees/nominees" aria-label="Nominees">
                <Icon.UserCircle /><span className="nav-link-text">Nominees</span>
              </Link>
            </div>

            <button type="button" className="nav-back-btn" onClick={backToDashboard} aria-label="Back to Dashboard">
              <Icon.ArrowLeft /> <span className="nav-back-text">Back to Dashboard</span>
            </button>
          </div>
        </nav>

        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1>Event Manager</h1>
            <p>Create, edit, and organize your voting events with ease.</p>
          </div>
        </header>

        {error && <div className="error-message" role="alert">{error}</div>}

        {/* Main form card */}
        <section className="main-card" aria-labelledby="form-heading">
          <div className="section-header">
            <h2 id="form-heading">{editingId ? "Edit Event" : "Create New Event"}</h2>
            {editingId && (
              <button
                className="cancel-button btn-soft danger"
                onClick={() => { setEditingId(null); setForm(empty); setFieldErr({}); }}
                aria-label="Cancel editing"
              >
                <Icon.X /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={onSubmit} className="event-form" noValidate>
            {/* Event name */}
            <div className="form-group">
              <label htmlFor="eventName">EVENT NAME *</label>
              <input
                id="eventName"
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                onBlur={() => setFieldErr((fe) => ({ ...fe, name: validateFields(form, events, editingId).name }))}
                placeholder="e.g., Annual Tech Awards 2025"
                required
                aria-required="true"
                aria-invalid={!!fieldErr.name}
                className={fieldErr.name ? "input-invalid" : ""}
              />
              {fieldErr.name ? (
                <p className="error-text">{fieldErr.name}</p>
              ) : (
                <div className="field-hint">3–60 characters; letters, numbers, spaces and . , - &apos; ( ) / allowed.</div>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="eventDesc">DESCRIPTION</label>
              <textarea
                id="eventDesc"
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Provide a brief description of the event for participants..."
                rows="4"
              />
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startAt"><Icon.Clock /> START DATE &amp; TIME *</label>
                <input
                  id="startAt"
                  name="startAt"
                  type="datetime-local"
                  value={toInput(form.startAt)}
                  onChange={onChange}
                  onBlur={() => setFieldErr((fe) => ({ ...fe, startAt: validateFields(form, events, editingId).startAt }))}
                  min={startMin}
                  className={fieldErr.startAt ? "input-invalid" : ""}
                  aria-invalid={!!fieldErr.startAt}
                  required
                />
                {fieldErr.startAt && <p className="error-text">{fieldErr.startAt}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="endAt"><Icon.Clock /> END DATE &amp; TIME *</label>
                <input
                  id="endAt"
                  name="endAt"
                  type="datetime-local"
                  value={toInput(form.endAt)}
                  onChange={onChange}
                  onBlur={() => setFieldErr((fe) => ({ ...fe, endAt: validateFields(form, events, editingId).endAt }))}
                  min={endMin}
                  className={fieldErr.endAt ? "input-invalid" : ""}
                  aria-invalid={!!fieldErr.endAt}
                  required
                />
                {fieldErr.endAt && <p className="error-text">{fieldErr.endAt}</p>}
              </div>
            </div>

            <button className="submit-button" type="submit" disabled={loading || hasErrors} aria-busy={loading}>
              {loading ? (<><span className="loading-spinner" /> Processing...</>) :
               editingId ? (<><Icon.Save /> Save Changes</>) :
                           (<><Icon.Plus /> Create Event</>)}
            </button>
          </form>
        </section>

        {/* Events list */}
        <section className="main-card" aria-labelledby="events-heading">
          <div className="section-header">
            <h2 id="events-heading">All Events ({displayed.length})</h2>
            <button className="refresh-button btn-soft refresh" onClick={load} disabled={loading} aria-label="Refresh events list">
              <Icon.Refresh /> Refresh
            </button>
          </div>

          {/* Search + status pills */}
          <div className="search-panel" style={{ marginBottom: 20 }}>
            <div className="search-controls">
              <div className="search-box">
                <Icon.Search className="search-icon" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search events by name or description…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                {["all", "active", "upcoming", "completed"].map((f) => (
                  <button key={f} type="button" onClick={() => setStatus(f)} className={`filter-pill ${status === f ? "active" : ""}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && events.length === 0 ? (
            <p className="empty-state-text">Loading events...</p>
          ) : displayed.length === 0 ? (
            <p className="empty-state-text">No events match your search or filters.</p>
          ) : (
            <div className="events-grid">
              {displayed.map((ev) => {
                const st = statusOf(ev.startAt, ev.endAt);
                return (
                  <article className="event-card" key={ev.id}>
                    <div className="event-header">
                      <h3>{ev.name}</h3>
                      <div className="event-actions">
                        <button className="edit-button" onClick={() => onEdit(ev)} aria-label={`Edit ${ev.name}`} title="Edit event"><Icon.Edit /></button>
                        <button className="delete-button" onClick={() => onDelete(ev.id)} aria-label={`Delete ${ev.name}`} title="Delete event"><Icon.Trash /></button>
                      </div>
                    </div>

                    {ev.description && <p className="event-description">{ev.description}</p>}

                    <div className="event-dates">
                      <div className="date-info">
                        <span className="date-label">Start</span>
                        <span className="date-value">{fmtDate(ev.startAt)}</span>
                      </div>
                      <div className="date-info">
                        <span className="date-label">End</span>
                        <span className="date-value">{fmtDate(ev.endAt)}</span>
                      </div>
                    </div>

                    <div className="event-status">
                      <span
                        className={`status-badge ${st === "active" ? "status-active" : st === "upcoming" ? "status-upcoming" : "status-ended"}`}
                        role="status"
                      >
                        {st === "active" ? "● Active" : st === "upcoming" ? "○ Upcoming" : "✓ Completed"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
