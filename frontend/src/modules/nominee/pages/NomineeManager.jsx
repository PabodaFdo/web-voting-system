import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getEvents,
  getCategoriesByEvent,
  getNomineesByCategory,
  getNominees,
  createNominee,
  updateNominee,
  deleteNominee,
  nomineePhotoUrl,
} from "../api";
import "./NomineeManager.css";

/* --- lightweight toast (same markup used elsewhere; 3s auto-dismiss) --- */
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

const Icon = {
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V9h14v9z"/>
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
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
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
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  Save: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zM6 6h9v4H6z"/>
    </svg>
  ),
  /* thin circular refresh */
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}>
      <path d="M19 12a7 7 0 1 1-2.06-4.95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 5v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  Image: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14h18zM5 5h14v9l-3.5-3.5-4.5 4.5-2-2L5 16V5zM7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
    </svg>
  ),
};

const empty = { name: "", bio: "", eventId: "", categoryId: "" };

/* --- VALIDATION (mirrors Category) --- */
const NAME_MIN = 3;
const NAME_MAX = 60;
const BIO_MAX  = 300;
const NAME_OK  = /^[A-Za-z0-9 .,&'()/-]+$/;
const trimmed = (s="") => s.replace(/\s+/g, " ").trim();

export default function NomineeManager() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);

  const [eventFilter, setEventFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState({});
  const [query, setQuery] = useState("");

  // cache-busting for updated photos
  const [imgNonce, setImgNonce] = useState(0);

  // toasts
  const { toasts, show, dismiss } = useToast();

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  /* Loaders */
  const loadEvents = useCallback(async () => {
    try {
      const res = await getEvents();
      setEvents(Array.isArray(res?.data) ? res.data : res || []);
    } catch {
      setErr("Failed to load events.");
      show("Failed to load events.", "error");
    }
  }, [show]);
  const loadCategoriesForEvent = useCallback(async (eid) => {
    try {
      if (!eid) { setCategories([]); return; }
      const res = await getCategoriesByEvent(eid);
      setCategories(Array.isArray(res?.data) ? res.data : res || []);
    } catch {
      setErr("Failed to load categories.");
      show("Failed to load categories.", "error");
    }
  }, [show]);
  const loadNomineesAll = useCallback(async () => {
    try {
      const { data } = await getNominees();
      setNominees(data);
    } catch {
      setErr("Failed to load nominees.");
      show("Failed to load nominees.", "error");
    }
  }, [show]);
  const loadNomineesForCategory = useCallback(async (categoryId) => {
    try {
      const { data } = await getNomineesByCategory(categoryId);
      setNominees(data);
    } catch {
      setErr("Failed to load nominees.");
      show("Failed to load nominees.", "error");
    }
  }, [show]);
  const loadNomineesForEvent = useCallback(async (eid) => {
    try {
      const { data: cats } = await getCategoriesByEvent(eid);
      if (!cats?.length) return setNominees([]);
      const arrays = await Promise.all(
        cats.map((c) => getNomineesByCategory(c.id).then((r) => r.data))
      );
      setNominees(arrays.flat());
    } catch {
      setErr("Failed to load nominees.");
      show("Failed to load nominees.", "error");
    }
  }, [show]);

  useEffect(() => {
    loadEvents();
    loadNomineesAll();
  }, [loadEvents, loadNomineesAll]);

  /* Top event filter behavior */
  useEffect(() => {
    if (!eventFilter) {
      setCategories([]);
      setCategoryFilter("");
      loadNomineesAll();
      setForm((f) => ({ ...f, eventId: "", categoryId: "" }));
      return;
    }

    (async () => {
      await loadCategoriesForEvent(eventFilter);
      setForm((f) => ({
        ...f,
        eventId: String(eventFilter),
        // keep selected category while editing; otherwise reset
        categoryId: editingId ? String(f.categoryId || "") : ""
      }));
    })();

    if (!editingId) setCategoryFilter("");

    if (!categoryFilter) loadNomineesForEvent(eventFilter);
    else loadNomineesForCategory(categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventFilter, editingId]);

  useEffect(() => {
    if (!eventFilter) return;
    if (!categoryFilter) {
      loadNomineesForEvent(eventFilter);
      setForm((f) => ({ ...f, categoryId: editingId ? String(f.categoryId || "") : "" }));
    } else {
      loadNomineesForCategory(categoryFilter);
      setForm((f) => ({ ...f, categoryId: String(categoryFilter) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, eventFilter]);

  /* Preview image */
  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* Duplicate check within same category */
  const duplicateNameInCategory = (name, categoryId) => {
    if (!name || !categoryId) return false;
    const test = trimmed(name).toLowerCase();
    return nominees.some((n) => {
      const cid = String(n.category?.id ?? n.categoryId);
      const sameCat = cid === String(categoryId);
      const sameName = trimmed(n.name || "").toLowerCase() === test;
      const notSelf = editingId ? String(n.id) !== String(editingId) : true;
      return sameCat && sameName && notSelf;
    });
  };

  /* Validation */
  const validateForm = (candidate = form) => {
    const e = {};

    // Event & category are required
    if (!candidate.eventId) e.eventId = "Pick an event above.";
    if (!candidate.categoryId) e.categoryId = "Pick a category.";

    // Name rules
    const nm = trimmed(candidate.name || "");
    if (!nm) e.name = "Nominee name is required.";
    else if (nm.length < NAME_MIN) e.name = `Name must be at least ${NAME_MIN} characters.`;
    else if (nm.length > NAME_MAX) e.name = `Name must be at most ${NAME_MAX} characters.`;
    else if (!NAME_OK.test(nm)) e.name = "Only letters, numbers, spaces and . , - & ' ( ) / are allowed.";
    else if (duplicateNameInCategory(nm, candidate.categoryId))
      e.name = "A nominee with this name already exists in this category.";

    // Bio length (optional)
    const bio = candidate.bio || "";
    if (bio.length > BIO_MAX) e.bio = `Biography must be ${BIO_MAX} characters or less.`;

    return e;
  };

  useEffect(() => {
    setFieldErr(validateForm(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, nominees, editingId]);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const finalErrs = validateForm({ ...form, name: trimmed(form.name) });
    setFieldErr(finalErrs);
    if (Object.values(finalErrs).some(Boolean)) return;

    setLoading(true);
    setErr("");

    const dto = {
      name: trimmed(form.name),
      bio: (form.bio || "").trim(),
      categoryId: Number(form.categoryId),
    };

    try {
      if (editingId) {
        await updateNominee(editingId, dto, file);
        show("Nominee updated successfully.", "success");
      } else {
        await createNominee(dto, file);
        show("Nominee added successfully.", "success");
      }

      // After save: reset to All Events / All Categories
      setEditingId(null);
      setEventFilter("");
      setCategoryFilter("");
      setCategories([]);
      setForm({ ...empty });
      setFile(null);
      setPreview("");

      await loadNomineesAll();
      setImgNonce((v) => v + 1);
    } catch {
      setErr("Saving nominee failed. Please try again.");
      show("Saving nominee failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (n) => {
    const eid = n.category?.event?.id ? String(n.category.event.id) : "";
    const cid = n.category?.id ? String(n.category.id) : "";

    setEditingId(n.id);
    setForm({
      name: n.name || "",
      bio: n.bio || "",
      eventId: eid,
      categoryId: cid,
    });

    setEventFilter(eid);
    setCategoryFilter(cid);

    setFile(null);
    setPreview("");
    setFieldErr({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this nominee?")) return;
    try {
      await deleteNominee(id);
      show("Nominee deleted.", "success");
      if (!eventFilter) await loadNomineesAll();
      else if (!categoryFilter) await loadNomineesForEvent(eventFilter);
      else await loadNomineesForCategory(categoryFilter);
      if (editingId === id) {
        setEditingId(null);
        setForm(empty);
        setFile(null);
        setPreview("");
      }
    } catch {
      setErr("Delete failed. Try again.");
      show("Delete failed. Try again.", "error");
    }
  };

  const cancelEdit = async () => {
    setEditingId(null);
    // reset filters like after Save
    setEventFilter("");
    setCategoryFilter("");
    setCategories([]);

    setForm({ ...empty });
    setFile(null);
    setPreview("");
    setFieldErr({});

    await loadNomineesAll();
    setImgNonce((v) => v + 1);
  };

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nominees;
    return nominees.filter((n) => {
      const name = (n.name || "").toLowerCase();
      const bio = (n.bio || "").toLowerCase();
      const cat = (n.category?.name || "").toLowerCase();
      const ev = (n.category?.event?.name || "").toLowerCase();
      return name.includes(q) || bio.includes(q) || cat.includes(q) || ev.includes(q);
    });
  }, [nominees, query]);

  const findEventName = (id) =>
    events.find((e) => String(e.id) === String(id))?.name || "Unknown Event";

  const hasErrors = Object.values(fieldErr).some(Boolean);

  return (
    <div className="home-modern page-nominee">
      {/* toasts */}
      <Toasts toasts={toasts} dismiss={dismiss} />

      <div className="bg-gradient" />

      <div className="home-container">
        {/* Top Nav */}
        <nav className="top-nav" role="navigation" aria-label="Nominee Navigation">
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

        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1>Nominee Manager</h1>
            <p>Add and manage nominees with photos and biographies.</p>
          </div>
        </header>

        {err && <div className="error-message" role="alert">{err}</div>}

        {/* === FILTERS === */}
        <section className="main-card" aria-labelledby="filters-heading">
          <div className="section-header">
            <h2 id="filters-heading">Filter Nominees</h2>
            <div className="filters-count">
              Showing {displayed.length} nominee{displayed.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eventFilter">Event</label>
              <select
                id="eventFilter"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="categoryFilter">Category</label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={!eventFilter}
              >
                {!eventFilter ? (
                  <option value="">Select an event first</option>
                ) : (
                  <>
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
        </section>

        {/* === FORM === */}
        <section className="main-card" aria-labelledby="form-heading">
          <div className="section-header">
            <h2 id="form-heading">{editingId ? "Edit Nominee" : "Add New Nominee"}</h2>
            {editingId && (
              <button className="cancel-button btn-soft danger" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>

          <form className="nominee-form" onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="nomineeName">Nominee Name *</label>
              <input
                id="nomineeName"
                type="text"
                placeholder="Enter nominee name"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErr((x)=>({...x,name:""})); }}
                onBlur={() => setFieldErr((fe) => ({ ...fe, name: validateForm(form).name }))}
                className={fieldErr.name ? "input-invalid" : ""}
                required
              />
              {fieldErr.name ? (
                <p className="error-text">{fieldErr.name}</p>
              ) : (
                <div className="field-hint">3–60 letters, spaces and . , - & ' ( ) </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lockEvent">Event *</label>
                <select
                  id="lockEvent"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  onBlur={() => setFieldErr((fe) => ({ ...fe, eventId: validateForm(form).eventId }))}                  className={fieldErr.eventId ? "input-invalid" : ""}
                >
                  <option value="">Select an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
                {eventFilter ? (
                  <div className="field-hint">🔒 Locked to <strong>{findEventName(eventFilter)}</strong>.</div>
                ) : (
                  <div className="field-hint">Pick an event to enable category & image upload.</div>
                )}
                {fieldErr.eventId && <p className="error-text">{fieldErr.eventId}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="formCategory">Category *</label>
                <select
                  id="formCategory"
                  value={form.categoryId}
                  onChange={(e) => { setForm({ ...form, categoryId: e.target.value }); setFieldErr((x)=>({...x,categoryId:""})); }}
                  onBlur={() => setFieldErr((fe) => ({ ...fe, categoryId: validateForm(form).categoryId, name: validateForm(form).name }))}
                  disabled={!eventFilter}
                  className={fieldErr.categoryId ? "input-invalid" : ""}
                  required
                >
                  {!eventFilter ? (
                    <option value="">Select an event first</option>
                  ) : (
                    <>
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </>
                  )}
                </select>
                {fieldErr.categoryId && <p className="error-text">{fieldErr.categoryId}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nomineeBio">Biography</label>
              <textarea
                id="nomineeBio"
                placeholder="Short biography (optional)"
                rows="4"
                value={form.bio}
                onChange={(e) => { setForm({ ...form, bio: e.target.value }); setFieldErr((x)=>({...x,bio:""})); }}
                onBlur={() => setFieldErr((fe) => ({ ...fe, bio: validateForm(form).bio }))}
                className={fieldErr.bio ? "input-invalid" : ""}
              />
              {fieldErr.bio ? (
                <p className="error-text">{fieldErr.bio}</p>
              ) : (
                <div className="field-hint">Up to {BIO_MAX} characters.</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nomineePhoto"><Icon.Image /> Photo (optional)</label>
              <div className="file-upload-container">
                <input
                  id="nomineePhoto"
                  className="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={!eventFilter}
                />
                <label htmlFor="nomineePhoto" className="file-upload-button">
                  Choose Photo
                </label>
                {file && <span className="file-name">{file.name}</span>}
              </div>

              {preview && (
                <div className="image-preview">
                  <img src={preview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => { setFile(null); setPreview(""); }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button className="submit-button" type="submit" disabled={loading || hasErrors}>
              {loading ? (
                <>
                  <span className="loading-spinner" /> Processing…
                </>
              ) : editingId ? (
                <>
                  <Icon.Save /> Save Changes
                </>
              ) : (
                <>
                  <Icon.Plus /> Add Nominee
                </>
              )}
            </button>
          </form>
        </section>

        {/* === LIST (Search + Refresh) === */}
        <section className="main-card" aria-labelledby="list-heading">
          <div className="section-header list-header">
            <h2 id="list-heading">Nominees ({displayed.length})</h2>

            <div className="list-tools">
              <div className="search-box small">
                <Icon.Search className="search-icon" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by name, bio, event, or category…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                className="refresh-button"
                onClick={async () => {
                  try {
                    if (!eventFilter) await loadNomineesAll();
                    else if (!categoryFilter) await loadNomineesForEvent(eventFilter);
                    else await loadNomineesForCategory(categoryFilter);
                    setImgNonce((v) => v + 1);
                    show("Nominees refreshed.", "info");
                  } catch {
                    /* load* already handle errors & toasts */
                  }
                }}
              >
                <Icon.Refresh /> Refresh
              </button>
            </div>
          </div>

          {displayed.length === 0 ? (
            <p className="empty-state-text">No nominees match your filters/search.</p>
          ) : (
            <div className="nominees-grid">
              {displayed.map((n) => (
                <article key={n.id} className="nominee-card">
                  <div className="nominee-image">
                    <img
                      src={`${nomineePhotoUrl(n.id)}?v=${imgNonce}`}
                      alt={n.name}
                      onLoad={(e) => {
                        const ph = e.currentTarget.nextElementSibling;
                        if (ph) ph.style.display = "none";
                        e.currentTarget.style.display = "block";
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const ph = e.currentTarget.nextElementSibling;
                        if (ph) ph.style.display = "flex";
                      }}
                    />
                    <div className="placeholder-cover" aria-hidden="true">
                      <div className="placeholder-box">
                        <svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true">
                          <path
                            fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2v11Z"
                          />
                          <circle cx="12" cy="13" r="4" fill="none" stroke="#94a3b8" strokeWidth="2" />
                        </svg>
                        <span className="placeholder-text">No photo</span>
                      </div>
                    </div>
                  </div>

                  <div className="nominee-content">
                    <div className="nominee-header">
                      <h3>{n.name}</h3>
                      <div className="nominee-actions">
                        <button className="edit-button" title="Edit" onClick={() => onEdit(n)}><Icon.Edit /></button>
                        <button className="delete-button" title="Delete" onClick={() => onDelete(n.id)}><Icon.Trash /></button>
                      </div>
                    </div>

                    {n.bio && <p className="nominee-bio">{n.bio}</p>}

                    <div className="nominee-meta">
                      <span className="event-badge">{n.category?.event?.name || "Unknown Event"}</span>
                      <span className="category-badge">{n.category?.name || "Unknown Category"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
