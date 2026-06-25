import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getEvents,
  getCategories,
  getCategoriesByEvent,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api";
import "./CategoryManager.css";

/* --- lightweight toast (same markup as other pages; 3s auto-dismiss) --- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
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
          <div
            key={t.id}
            className={cls}
            role="status"
            aria-live="polite"
            onClick={() => dismiss(t.id)}
            title="Close"
          >
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
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 14H5V8h14v9z"/>
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
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  Save: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z"/>
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
};

const empty = { name: "", description: "", votingStart: "", votingEnd: "", eventId: "" };
const toInput = (s) => (s ? s.slice(0, 16) : "");

/* Validation rules */
const NAME_MIN = 3;
const NAME_MAX = 60;
const DESC_MAX = 300;
const NAME_OK = /^[A-Za-z0-9 .,&'()/-]+$/;

/* Status helpers */
const computeStatus = (start, end) => {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (e && e < now) return { cls: "status-ended", label: "Completed", key: "completed" };
  if (s && s > now) return { cls: "status-upcoming", label: "Upcoming", key: "upcoming" };
  if (s && e && s <= now && e >= now) return { cls: "status-active", label: "Active", key: "active" };
  return { cls: "status-upcoming", label: "Scheduled", key: "upcoming" };
};

export default function CategoryManager() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [filterEventId, setFilterEventId] = useState("");
  const lockedByFilter = !!filterEventId;

  // Local search & status filter
  const [catQuery, setCatQuery] = useState("");
  const [catStatus, setCatStatus] = useState("all"); // all | active | upcoming | completed

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState({});

  // toasts
  const { toasts, show, dismiss } = useToast();

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

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

  /* Loaders */
  const loadEvents = useCallback(async () => {
    try {
      const res = await getEvents();
      const raw = Array.isArray(res?.data) ? res.data : res || [];
      const list = raw.map((e) => ({
        id: e.id ?? e.eventId ?? e.uuid,
        name: e.name ?? e.title ?? e.eventName ?? "Untitled Event",
        description: e.description ?? e.desc ?? "",
        startAt: e.startAt ?? e.start_date ?? e.start ?? "",
        endAt: e.endAt ?? e.end_date ?? e.end ?? "",
      }));
      setEvents(list);
    } catch (e) {
      console.error(e);
      setErr("Failed to load events.");
      show("Failed to load events.", "error");
    }
  }, [show]);

  const loadCategories = useCallback(async (eventId = "") => {
    try {
      const res = eventId ? await getCategoriesByEvent(eventId) : await getCategories();
      setCategories(Array.isArray(res?.data) ? res.data : res || []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load categories.");
      show("Failed to load categories.", "error");
    }
  }, [show]);

  useEffect(() => {
    loadEvents();
    loadCategories();
  }, [loadEvents, loadCategories]);

  useEffect(() => {
    loadCategories(filterEventId);
    setForm((f) => ({ ...f, eventId: filterEventId || "" }));
  }, [filterEventId, loadCategories]);

  const selectedEvent = useMemo(
    () => events.find((e) => String(e.id) === String(form.eventId || filterEventId)),
    [events, form.eventId, filterEventId]
  );

  const evStart = toInput(selectedEvent?.startAt || "");
  const evEnd   = toInput(selectedEvent?.endAt || "");

  let startMin = evStart || undefined;
  let startMax = evEnd   || undefined;
  if (form.votingEnd && startMax && form.votingEnd < startMax) startMax = form.votingEnd;

  let endMin = evStart || undefined;
  if (form.votingStart) endMin = endMin ? (form.votingStart > endMin ? form.votingStart : endMin) : form.votingStart;
  const endMax = evEnd || undefined;

  useEffect(() => {
    if (!selectedEvent) return;
    setForm((f) => {
      let vs = f.votingStart;
      let ve = f.votingEnd;
      if (vs && (vs < evStart || vs > evEnd)) vs = evStart;
      if (ve && (ve < evStart || ve > evEnd)) ve = evEnd;
      if (vs && ve && ve < vs) ve = vs;
      return { ...f, votingStart: vs, votingEnd: ve };
    });
    setFieldErr((fe) => ({ ...fe, votingStart: "", votingEnd: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id, evStart, evEnd]);

  /* --- VALIDATION ------------------------------------------------------- */
  const trimmed = (s) => s.replace(/\s+/g, " ").trim();

  const duplicateNameInEvent = (name, eventId) => {
    if (!name || !eventId) return false;
    const test = trimmed(name).toLowerCase();
    return categories.some((c) => {
      const cid = c.id;
      const evId = String(c.eventId ?? c.event?.id);
      const sameEvent = evId === String(eventId);
      const sameName  = trimmed(c.name || "").toLowerCase() === test;
      const notSelf   = editingId ? String(cid) !== String(editingId) : true;
      return sameEvent && sameName && notSelf;
    });
  };

  const validateForm = (candidate = form) => {
    const errs = {};
    if (!candidate.eventId) errs.eventId = "Please select an event.";

    const nm = trimmed(candidate.name || "");
    if (!nm) errs.name = "Category name is required.";
    else if (nm.length < NAME_MIN) errs.name = `Name must be at least ${NAME_MIN} characters.`;
    else if (nm.length > NAME_MAX) errs.name = `Name must be at most ${NAME_MAX} characters.`;
    else if (!NAME_OK.test(nm)) errs.name = "Only letters, numbers, spaces and . , - & ' ( ) / are allowed.";
    else if (duplicateNameInEvent(nm, candidate.eventId || filterEventId))
      errs.name = "A category with this name already exists for this event.";

    const desc = candidate.description || "";
    if (desc.length > DESC_MAX) errs.description = `Description must be ${DESC_MAX} characters or less.`;

    if (selectedEvent) {
      if (candidate.votingStart && (candidate.votingStart < evStart || candidate.votingStart > evEnd)) {
        errs.votingStart = `Start must be between ${fmtDate(selectedEvent.startAt)} and ${fmtDate(selectedEvent.endAt)}.`;
      }
      if (candidate.votingEnd && (candidate.votingEnd < evStart || candidate.votingEnd > evEnd)) {
        errs.votingEnd = `End must be between ${fmtDate(selectedEvent.startAt)} and ${fmtDate(selectedEvent.endAt)}.`;
      }
      if (candidate.votingStart && candidate.votingEnd && candidate.votingEnd < candidate.votingStart) {
        errs.votingEnd = "End must be after start.";
      }
    }

    return errs;
  };

  useEffect(() => {
    setFieldErr(validateForm(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, selectedEvent, categories, editingId]);

  const hasErrors = Object.values(fieldErr).some(Boolean);

  /* Create / Update */
  const onSubmit = async (e) => {
    e.preventDefault();
    const finalErrs = validateForm({ ...form, name: trimmed(form.name) });
    setFieldErr(finalErrs);
    if (Object.values(finalErrs).some(Boolean)) return;

    setLoading(true);
    setErr("");
    const payload = {
      name: trimmed(form.name),
      description: (form.description || "").trim(),
      votingStart: form.votingStart || null,
      votingEnd: form.votingEnd || null,
      eventId: Number(form.eventId),
    };
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
        show("Category updated successfully.", "success");
      } else {
        await createCategory(payload);
        show("Category created successfully.", "success");
      }

      const keepEvent = form.eventId;
      setEditingId(null);
      setForm({ ...empty, eventId: keepEvent });
      await loadCategories(filterEventId || keepEvent);
    } catch (e2) {
      console.error(e2);
      setErr("Save failed. Please check inputs and try again.");
      show("Save failed. Please check inputs and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      description: c.description || "",
      votingStart: toInput(c.votingStart),
      votingEnd: toInput(c.votingEnd),
      eventId: c.event?.id ?? c.eventId ?? "",
    });
    setFieldErr({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this category? Nominees under it must be handled.")) return;
    setLoading(true);
    setErr("");
    try {
      await deleteCategory(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(empty);
      }
      show("Category deleted.", "success");
      await loadCategories(filterEventId);
    } catch (e) {
      console.error(e);
      setErr("Delete failed. Try again.");
      show("Delete failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* Helpers */
  const eventName = useCallback((id) => {
    const row = events.find((e) => String(e.id) === String(id));
    return row?.name ?? "Unknown Event";
  }, [events]);

  // First apply the event filter
  const filteredByEvent = useMemo(() => {
    if (!filterEventId) return categories;
    return categories.filter((c) => String(c.eventId ?? c.event?.id) === String(filterEventId));
  }, [categories, filterEventId]);

  // Then apply search + status pills
  const displayed = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return filteredByEvent.filter((c) => {
      const status = computeStatus(c.votingStart, c.votingEnd).key; // active/upcoming/completed
      const name = (c.name || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const evn  = (c.event?.name || eventName(c.eventId) || "").toLowerCase();
      const matchesQ = !q || name.includes(q) || desc.includes(q) || evn.includes(q);
      const matchesStatus = catStatus === "all" || status === catStatus;
      return matchesQ && matchesStatus;
    });
  }, [filteredByEvent, catQuery, catStatus, eventName]);

  // Date change handlers (clamp)
  const onStartChange = (value) => {
    let v = value;
    if (selectedEvent) {
      if (startMin && v < startMin) v = startMin;
      if (startMax && v > startMax) v = startMax;
    }
    setForm((f) => {
      let ve = f.votingEnd;
      if (ve && v && ve < v) ve = v;
      return { ...f, votingStart: v, votingEnd: ve };
    });
    setFieldErr((fe) => ({ ...fe, votingStart: "" }));
  };

  const onEndChange = (value) => {
    let v = value;
    if (selectedEvent) {
      if (endMin && v < endMin) v = endMin;
      if (endMax && v > endMax) v = endMax;
    }
    setForm((f) => ({ ...f, votingEnd: v }));
    setFieldErr((fe) => ({ ...fe, votingEnd: "" }));
  };

  return (
    <div className="home-modern page-category">
      {/* toasts */}
      <Toasts toasts={toasts} dismiss={dismiss} />

      <div className="bg-gradient" />
      <div className="home-container">
        {/* Top Navigation */}
        <nav className="top-nav" role="navigation" aria-label="Category Manager Navigation">
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
              <Icon.ArrowLeft /> <span className="nav-back-text">Back to Dashboard</span>
            </button>
          </div>
        </nav>

        <header className="app-header">
          <div className="header-content">
            <h1>Category Manager</h1>
            <p>Create, edit, and organize categories under events.</p>
          </div>
        </header>

        {err && <div className="error-message" role="alert">{err}</div>}

        {/* Filters (Refresh button removed from here) */}
        <section className="main-card" aria-labelledby="filters-heading">
          <div className="section-header">
            <h2 id="filters-heading">Filters</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eventFilter">Filter by Event</label>
              <select
                id="eventFilter"
                value={filterEventId}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterEventId(v);
                  setForm((f) => ({ ...f, eventId: v }));
                }}
              >
                <option value="">All events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" />
          </div>

          <p className="empty-state-text" style={{ paddingTop: 8, paddingBottom: 0 }}>
            Showing {filteredByEvent.length} categor{filteredByEvent.length === 1 ? "y" : "ies"}
            {filterEventId ? ` for ${eventName(filterEventId)}` : ""}
          </p>
        </section>

        {/* Form */}
        <section className="main-card" aria-labelledby="form-heading">
          <div className="section-header">
            <h2 id="form-heading">{editingId ? "Edit Category" : "Create New Category"}</h2>
            {editingId && (
              <button
                className="cancel-button btn-soft danger"
                onClick={() => { setEditingId(null); setForm(empty); setFieldErr({}); }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form className="category-form" onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categoryName">Category Name *</label>
                <input
                  id="categoryName"
                  type="text"
                  placeholder="e.g., Best Speaker"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setFieldErr((fe) => ({ ...fe, name: validateForm(form).name }))}
                  className={fieldErr.name ? "input-invalid" : ""}
                  required
                />
                {fieldErr.name && <p className="error-text">{fieldErr.name}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="categoryEvent">Event *</label>
                <select
                  id="categoryEvent"
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  onBlur={() => setFieldErr((fe) => ({ ...fe, eventId: validateForm(form).eventId }))}
                  disabled={lockedByFilter}
                  className={fieldErr.eventId ? "input-invalid" : ""}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
                {lockedByFilter && (
                  <div className="field-hint">🔒 Locked to <strong>{eventName(filterEventId)}</strong> by the filter.</div>
                )}
                {fieldErr.eventId && <p className="error-text">{fieldErr.eventId}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="categoryDesc">Description</label>
              <textarea
                id="categoryDesc"
                rows={4}
                placeholder="Short description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onBlur={() => setFieldErr((fe) => ({ ...fe, description: validateForm(form).description }))}
                className={fieldErr.description ? "input-invalid" : ""}
              />
              {fieldErr.description && <p className="error-text">{fieldErr.description}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="votingStart"><Icon.Clock /> Voting Start</label>
                <input
                  id="votingStart"
                  type="datetime-local"
                  value={form.votingStart}
                  onChange={(e) => onStartChange(e.target.value)}
                  min={startMin}
                  max={startMax}
                  disabled={!selectedEvent}
                  className={fieldErr.votingStart ? "input-invalid" : ""}
                />
                {selectedEvent ? (
                  <div className="field-hint">
                    Available: <strong>{fmtDate(selectedEvent.startAt)}</strong> — <strong>{fmtDate(selectedEvent.endAt)}</strong>
                  </div>
                ) : (
                  <div className="field-hint">Select an event to set the voting period.</div>
                )}
                {fieldErr.votingStart && <p className="error-text">{fieldErr.votingStart}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="votingEnd"><Icon.Clock /> Voting End</label>
                <input
                  id="votingEnd"
                  type="datetime-local"
                  value={form.votingEnd}
                  onChange={(e) => onEndChange(e.target.value)}
                  min={endMin}
                  max={endMax}
                  disabled={!selectedEvent}
                  className={fieldErr.votingEnd ? "input-invalid" : ""}
                />
                {selectedEvent && (
                  <div className="field-hint">
                    Must be between <strong>{fmtDate(selectedEvent.startAt)}</strong> and <strong>{fmtDate(selectedEvent.endAt)}</strong>
                    {form.votingStart && `, and not before ${fmtDate(form.votingStart)}`}.
                  </div>
                )}
                {fieldErr.votingEnd && <p className="error-text">{fieldErr.votingEnd}</p>}
              </div>
            </div>

            <button className="submit-button" type="submit" disabled={loading || hasErrors}>
              {loading ? <><span className="loading-spinner" /> Processing…</> :
                editingId ? <><Icon.Save /> Save Changes</> : <><Icon.Plus /> Create Category</>}
            </button>
          </form>
        </section>

        {/* List */}
        <section className="main-card" aria-labelledby="list-heading">
          <div className="section-header">
            <h2 id="list-heading">All Categories ({displayed.length})</h2>
            {/* Refresh button moved here */}
            <button
              className="refresh-button btn-soft"
              onClick={() => loadCategories(filterEventId)}
              disabled={loading}
              aria-label="Refresh categories"
            >
              <Icon.Refresh /> Refresh
            </button>
          </div>

          {/* Search + pills */}
          <div className="search-panel" style={{ marginBottom: 20 }}>
            <div className="search-controls">
              <div className="search-box">
                <Icon.Search className="search-icon" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search categories by name, description, or event…"
                  value={catQuery}
                  onChange={(e) => setCatQuery(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                {["all", "active", "upcoming", "completed"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCatStatus(f)}
                    className={`filter-pill ${catStatus === f ? "active" : ""}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {displayed.length === 0 ? (
            <p className="empty-state-text">No categories match your search or filters.</p>
          ) : (
            <div className="categories-grid">
              {displayed.map((c) => {
                const st = computeStatus(c.votingStart, c.votingEnd);
                return (
                  <article className="category-card" key={c.id}>
                    <div className="category-header">
                      <h3>{c.name}</h3>
                      <div className="category-actions">
                        <button className="edit-button" onClick={() => onEdit(c)} title="Edit"><Icon.Edit /></button>
                        <button className="delete-button" onClick={() => onDelete(c.id)} title="Delete"><Icon.Trash /></button>
                      </div>
                    </div>

                    <div className="category-event">
                      <span className="event-badge">{c.event?.name || eventName(c.eventId)}</span>
                    </div>

                    {c.description && <p className="category-description">{c.description}</p>}

                    <div className="category-dates">
                      <div className="date-info">
                        <span className="date-label">Voting Starts</span>
                        <span className="date-value">{fmtDate(c.votingStart)}</span>
                      </div>
                      <div className="date-info">
                        <span className="date-label">Voting Ends</span>
                        <span className="date-value">{fmtDate(c.votingEnd)}</span>
                      </div>
                    </div>

                    <div className="category-status">
                      <span className={`status-badge ${st.cls}`}>{st.label}</span>
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
