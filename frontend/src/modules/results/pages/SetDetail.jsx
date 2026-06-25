import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getEventBundle, getResultSet, updateResultSet, deleteResultSet,
  addResultItem, deleteResultItem, publishResultSet, exportCsv, api
} from "../api";
import SetDataCategoryDash from "./SetDataCategoryDash";
import "./setDetail.css";

/* ---------- Tiny toast hook (matches Results/Analytics vibe) ---------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  };
  const Stack = () => (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { push, Stack };
}

/* ---- Icons ---- */
const Icon = {
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
  Save: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  ),
};

export default function SetDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToasts();

  const [detail, setDetail] = useState(null);
  const [bundle, setBundle] = useState({ event: null, categories: [], nominees: [] });
  const [err, setErr] = useState("");

  const [catId, setCatId] = useState("");
  const [nomId, setNomId] = useState("");
  const [position, setPosition] = useState(1);
  const [overrideName, setOverrideName] = useState("");
  const [editingId, setEditingId] = useState(null);

  // validation flags
  const [touched, setTouched] = useState({
    headerTitle: false, catId: false, nomId: false, position: false
  });

  const headerErrors = useMemo(() => {
    const e = {};
    const t = (detail?.title || "").trim();
    if (!t) e.title = "Title is required.";
    else if (t.length < 3) e.title = "Title must be at least 3 characters.";
    else if (t.length > 120) e.title = "Title must be 120 characters or less.";
    return e;
  }, [detail?.title]);

  const itemErrors = useMemo(() => {
    const e = {};
    if (!catId) e.catId = "Please choose a category.";
    if (!nomId) e.nomId = "Please choose a nominee.";
    const pos = Number(position);
    if (!Number.isInteger(pos) || pos < 1) e.position = "Position must be a whole number ≥ 1.";
    return e;
  }, [catId, nomId, position]);

  const [leadCatId, setLeadCatId] = useState("");
  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const refreshTimer = useRef(null);

  useEffect(() => {
    let token = sessionStorage.getItem("admin_jwt");
    if (!token) {
      try {
        token = JSON.parse(localStorage.getItem("admin_auth") || "null")?.token || "";
      } catch {
        token = "";
      }
    }
    if (!token) {
      setErr("Session expired. Please open Results from the Admin app again.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await getResultSet(id);
        if (!alive) return;
        setDetail(d);
        try {
          const b = await getEventBundle(d.eventId);
          if (alive) {
            setBundle(b);
            if (!leadCatId && (b.categories?.length || 0) > 0) {
              setLeadCatId(String(b.categories[0].id));
            }
          }
        } catch (e) {
          console.error("Failed to load event bundle:", e);
        }
      } catch (e) {
        console.error("Failed to load result set:", e);
        setErr("Failed to load this result set. It may be missing or you're not authorized.");
      }
    })();
    return () => { alive = false; };
  }, [id, leadCatId]);

  const nomineesInCat = useMemo(
    () => (bundle.nominees || []).filter(n => n.categoryId === Number(catId || 0)),
    [bundle, catId]
  );

  async function addItem() {
    setTouched((t) => ({ ...t, catId: true, nomId: true, position: true }));
    if (Object.keys(itemErrors).length) {
      toast.push("Please fix the winner form errors.", "error");
      return;
    }
    try {
      await addResultItem(id, {
        categoryId: Number(catId),
        nomineeId: Number(nomId),
        position: Number(position || 1),
        winnerNameOverride: (overrideName || "").trim() || null
      });
      resetForm();
      setDetail(await getResultSet(id));
      toast.push("Winner added.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to add item. Make sure this set is DRAFT.", "error");
    }
  }

  async function updateItem() {
    setTouched((t) => ({ ...t, catId: true, nomId: true, position: true }));
    if (!editingId) {
      toast.push("Nothing to update.", "error");
      return;
    }
    if (Object.keys(itemErrors).length) {
      toast.push("Please fix the winner form errors.", "error");
      return;
    }
    try {
      await deleteResultItem(editingId);
      await addResultItem(id, {
        categoryId: Number(catId),
        nomineeId: Number(nomId),
        position: Number(position || 1),
        winnerNameOverride: (overrideName || "").trim() || null
      });
      resetForm();
      setDetail(await getResultSet(id));
      toast.push("Winner updated.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to update item.", "error");
    }
  }

  function resetForm() {
    setEditingId(null);
    setCatId("");
    setNomId("");
    setPosition(1);
    setOverrideName("");
    setTouched((t) => ({ ...t, catId: false, nomId: false, position: false }));
  }

  function startEdit(it) {
    const cid =
      it.categoryId ??
      bundle.categories.find(c => c.name === it.categoryName)?.id ??
      "";

    const nid =
      it.nomineeId ??
      bundle.nominees.find(n => n.name === it.nomineeName && n.categoryId === Number(cid))?.id ??
      "";

    setCatId(String(cid || ""));
    setNomId(String(nid || ""));
    setPosition(it.position ?? 1);
    const baseName =
      (typeof it.nomineeName === "string" && it.nomineeName) ||
      bundle.nominees.find(n => n.id === Number(nid))?.name ||
      "";
    setOverrideName(it.displayName && it.displayName !== baseName ? it.displayName : "");
    setEditingId(it.id);
  }

  async function saveHeader() {
    setTouched((t) => ({ ...t, headerTitle: true }));
    if (Object.keys(headerErrors).length) {
      toast.push("Please fix the title and try again.", "error");
      return;
    }
    try {
      await updateResultSet(id, {
        eventId: detail.eventId,
        title: detail.title.trim(),
        notes: (detail.notes || "").trim() || null
      });
      setDetail(await getResultSet(id));
      toast.push("Header saved.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to save header.", "error");
    }
  }

  async function removeItem(itemId) {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteResultItem(itemId);
      if (editingId === itemId) resetForm();
      setDetail(await getResultSet(id));
      toast.push("Item deleted.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to delete item.", "error");
    }
  }

  async function publish() {
    if (!confirm("Publish this result set? It will be visible to the public.")) return;
    try {
      await publishResultSet(id);
      setDetail(await getResultSet(id));
      toast.push("Published successfully.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to publish. Make sure the set has items.", "error");
    }
  }

  async function unpublish() {
    if (!confirm("Unpublish this result set?")) return;
    try {
      await api.post(`/api/results/${id}/unpublish`);
      setDetail(await getResultSet(id));
      toast.push("Unpublished.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to unpublish.", "error");
    }
  }

  async function removeSet() {
    if (!confirm("Delete this DRAFT set? This cannot be undone.")) return;
    try {
      await deleteResultSet(id);
      toast.push("Draft deleted.", "success");
      nav("/admin/results");
    } catch (e) {
      console.error(e);
      toast.push("Failed to delete set.", "error");
    }
  }

  async function fetchLeaders(categoryId) {
    let t = sessionStorage.getItem("admin_jwt");
    if (!t) {
      try {
        t = JSON.parse(localStorage.getItem("admin_auth") || "null")?.token || "";
      } catch {
        t = "";
      }
    }
    if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
    const { data } = await api.get("/api/dashboard/leaders", {
      params: { categoryId: Number(categoryId), limit: 3 }
    });
    return Array.isArray(data) ? data : [];
  }

  useEffect(() => {
    if (!detail || !leadCatId) return;

    let alive = true;
    async function run() {
      try {
        setLeadersLoading(true);
        const arr = await fetchLeaders(leadCatId);
        if (!alive) return;
        setLeaders(arr);
      } catch (e) {
        console.error("leaders fetch failed", e);
        if (alive) setLeaders([]);
      } finally {
        if (alive) setLeadersLoading(false);
      }
    }
    run();

    clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(run, 15000);

    return () => {
      alive = false;
      clearInterval(refreshTimer.current);
    };
  }, [detail, leadCatId]);

  async function quickPickTop(n) {
    if (!detail || !leadCatId) return;
    if (detail.status !== "DRAFT") {
      toast.push("Only DRAFT sets can add winners.", "error");
      return;
    }
    try {
      await addResultItem(id, {
        categoryId: Number(leadCatId),
        nomineeId: Number(n.nomineeId),
        position: 1,
        winnerNameOverride: null
      });
      setDetail(await getResultSet(id));
      setCatId(String(leadCatId));
      setNomId(String(n.nomineeId));
      setPosition(1);
      toast.push("Top leader picked as winner.", "success");
    } catch (e) {
      console.error(e);
      toast.push("Failed to add winner from leaders.", "error");
    }
  }

  const backToDashboard = useCallback(() => {
    nav("/admin/results");
  }, [nav]);

  if (err) {
    return (
      <div className="setdetail-page">
        {/* Toasts */}
        <toast.Stack />
        <div className="bg-gradient"></div>
        <div className="centered-container">
          <div className="setdetail-error-page">
            <h1>⚠️ Error</h1>
            <p>{err}</p>
            <Link to="/admin/results" className="setdetail-back-link">← Back to Results</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="setdetail-page">
        <toast.Stack />
        <div className="bg-gradient"></div>
        <div className="centered-container">
          <div className="setdetail-loading">📊 Loading...</div>
        </div>
      </div>
    );
  }

  const isDraft = detail.status === "DRAFT";
  const abs = (u) => (u && !u.startsWith("http") ? `${api.defaults.baseURL}${u}` : u);

  return (
    <div className="setdetail-page">
      {/* Toasts */}
      <toast.Stack />

      <div className="bg-gradient"></div>

      <div className="centered-container">
        {/* Header */}
        <div className="setdetail-header">
          <button onClick={backToDashboard} className="setdetail-back-btn">
            <Icon.ArrowLeft />
            Back to Results
          </button>
          
          <div className="setdetail-header-content">
            <div className="setdetail-title-row">
              <h1 className="setdetail-title">
                <span className="setdetail-title-text">{detail.title}</span>
              </h1>
              <span className={`setdetail-status-badge ${isDraft ? 'draft' : 'published'}`}>
                {detail.status}
              </span>
            </div>
            <p className="setdetail-subtitle">Result Set #{detail.id}</p>
          </div>
        </div>

        {/* Header Edit Section */}
        <section className="setdetail-card">
          <div className="setdetail-card-header">
            <h2 className="setdetail-card-title">
              <Icon.Edit />
              Result Set Information
            </h2>
          </div>
          <div className="setdetail-card-body">
            <div className="setdetail-form-grid">
              <div className="setdetail-form-group">
                <label className="setdetail-label">Title</label>
                <input 
                  className={`setdetail-input ${touched.headerTitle && headerErrors.title ? "input-invalid" : ""}`}
                  value={detail.title}
                  onBlur={() => setTouched((t) => ({ ...t, headerTitle: true }))}
                  onChange={e=>setDetail(d=>({...d,title:e.target.value}))} 
                  disabled={!isDraft}
                  maxLength={120}
                />
                {touched.headerTitle && headerErrors.title && (
                  <div className="field-error">{headerErrors.title}</div>
                )}
              </div>
              <div className="setdetail-form-group">
                <label className="setdetail-label">Notes</label>
                <input 
                  className="setdetail-input"
                  value={detail.notes || ""} 
                  onChange={e=>setDetail(d=>({...d,notes:e.target.value}))} 
                  disabled={!isDraft}
                  maxLength={240}
                />
              </div>
            </div>
            {isDraft ? (
              <button onClick={saveHeader} className="setdetail-btn setdetail-btn-primary">
                <Icon.Save />
                Save Changes
              </button>
            ) : (
              <div className="setdetail-published-info">
                📅 Published at {new Date(detail.publishedAt).toLocaleString()}
              </div>
            )}
          </div>
        </section>

        {/* Category Overview Dashboard */}
        <SetDataCategoryDash
          categories={bundle.categories || []}
          nominees={bundle.nominees || []}
          items={detail.items || []}
        />

        {/* Live Leaders */}
        <section className="setdetail-card">
          <div className="setdetail-card-header">
            <h2 className="setdetail-card-title">
              <Icon.Star />
              Live Vote Leaders
            </h2>
            <span className="setdetail-refresh-badge">Auto-refresh every 15s</span>
          </div>
          <div className="setdetail-card-body">
            <div className="setdetail-leaders-grid">
              <div className="setdetail-leaders-sidebar">
                <label className="setdetail-label-small">Select Category</label>
                <select
                  className="setdetail-select"
                  value={leadCatId}
                  onChange={e=>setLeadCatId(e.target.value)}
                >
                  {(bundle.categories || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="setdetail-leaders-content">
                {leadersLoading ? (
                  <div className="setdetail-leaders-loading">Loading leaders...</div>
                ) : leaders.length === 0 ? (
                  <div className="setdetail-leaders-empty">No votes yet for this category.</div>
                ) : (
                  <div className="setdetail-leaders-list">
                    {leaders.map((n, idx) => (
                      <div key={n.nomineeId} className="setdetail-leader-item">
                        <div className="setdetail-leader-rank">#{idx + 1}</div>
                        <div className="setdetail-leader-name">{n.nomineeName}</div>
                        <div className="setdetail-leader-votes">{n.votes} votes</div>
                        {isDraft && idx === 0 && (
                          <button onClick={() => quickPickTop(n)} className="setdetail-btn setdetail-btn-small">
                            <Icon.Check />
                            Pick Winner
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Add Winner Form */}
        <section className="setdetail-card">
          <div className="setdetail-card-header">
            <h2 className="setdetail-card-title">
              <Icon.Plus />
              {editingId ? "Edit Winner" : "Add Winner"}
            </h2>
          </div>
          <div className="setdetail-card-body">
            <div className="setdetail-form-grid-3">
              <div className="setdetail-form-group">
                <label className="setdetail-label">Category</label>
                <select 
                  className={`setdetail-select ${touched.catId && itemErrors.catId ? "input-invalid" : ""}`}
                  value={catId} 
                  onBlur={() => setTouched((t) => ({ ...t, catId: true }))}
                  onChange={e=>{ setCatId(e.target.value); setNomId(""); }} 
                  disabled={!isDraft}
                >
                  <option value="">— Choose category —</option>
                  {(bundle.categories||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {touched.catId && itemErrors.catId && <div className="field-error">{itemErrors.catId}</div>}
              </div>

              <div className="setdetail-form-group">
                <label className="setdetail-label">Nominee</label>
                <select 
                  className={`setdetail-select ${touched.nomId && itemErrors.nomId ? "input-invalid" : ""}`}
                  value={nomId} 
                  onBlur={() => setTouched((t) => ({ ...t, nomId: true }))}
                  onChange={e=>setNomId(e.target.value)} 
                  disabled={!isDraft || !catId}
                >
                  <option value="">— Choose nominee —</option>
                  {nomineesInCat.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                {touched.nomId && itemErrors.nomId && <div className="field-error">{itemErrors.nomId}</div>}
              </div>

              <div className="setdetail-form-group">
                <label className="setdetail-label">Position</label>
                <input 
                  className={`setdetail-input ${touched.position && itemErrors.position ? "input-invalid" : ""}`}
                  type="number" 
                  min={1} 
                  value={position} 
                  onBlur={() => setTouched((t) => ({ ...t, position: true }))}
                  onChange={e=>setPosition(e.target.value)} 
                  disabled={!isDraft}
                />
                {touched.position && itemErrors.position && <div className="field-error">{itemErrors.position}</div>}
              </div>
            </div>

            <div className="setdetail-form-group">
              <label className="setdetail-label">Override Name (optional)</label>
              <input 
                className="setdetail-input"
                placeholder="Leave blank to use nominee's name" 
                value={overrideName} 
                onChange={e=>setOverrideName(e.target.value)} 
                disabled={!isDraft}
                maxLength={120}
              />
            </div>

            <div className="setdetail-form-actions">
              {editingId ? (
                <>
                  <button 
                    onClick={updateItem} 
                    disabled={!isDraft}
                    className="setdetail-btn setdetail-btn-primary"
                  >
                    <Icon.Check />
                    Update Winner
                  </button>
                  <button onClick={resetForm} className="setdetail-btn setdetail-btn-secondary">
                    <Icon.X />
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={addItem} 
                  disabled={!isDraft}
                  className="setdetail-btn setdetail-btn-primary"
                >
                  <Icon.Plus />
                  Add Winner
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Winners Table */}
        <section className="setdetail-card">
          <div className="setdetail-card-header">
            <h2 className="setdetail-card-title">
              Winners List
            </h2>
            <span className="setdetail-count-badge">{detail.items?.length || 0} items</span>
          </div>
          <div className="setdetail-card-body">
            {detail.items?.length === 0 ? (
              <div className="setdetail-empty">
                No winners added yet. Add winners above to get started.
              </div>
            ) : (
              <div className="setdetail-table-wrapper">
                <table className="setdetail-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Nominee</th>
                      <th>Position</th>
                      <th>Display Name</th>
                      <th>Photo</th>
                      {isDraft && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map(it => (
                      <tr key={it.id}>
                        <td className="setdetail-table-category">{it.categoryName}</td>
                        <td className="setdetail-table-nominee">{it.nomineeName}</td>
                        <td className="setdetail-table-position">#{it.position}</td>
                        <td>{it.displayName}</td>
                        <td>
                          {it.photoUrl ? (
                            <img
                              alt=""
                              src={abs(it.photoUrl)}
                              className="setdetail-table-photo"
                              onError={(e)=>{ e.currentTarget.style.display = "none"; }}
                            />
                          ) : <span className="setdetail-table-no-photo">—</span>}
                        </td>
                        {isDraft && (
                          <td>
                            <div className="setdetail-table-actions">
                              <button 
                                onClick={() => startEdit(it)} 
                                className="setdetail-btn-icon setdetail-btn-icon-edit"
                                title="Edit"
                              >
                                <Icon.Edit />
                              </button>
                              <button 
                                onClick={()=>removeItem(it.id)} 
                                className="setdetail-btn-icon setdetail-btn-icon-delete"
                                title="Delete"
                              >
                                <Icon.Trash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="setdetail-actions">
          {isDraft ? (
            <>
              <button onClick={publish} className="setdetail-btn setdetail-btn-success">
                <Icon.Check />
                Publish Result Set
              </button>
              <button onClick={removeSet} className="setdetail-btn setdetail-btn-danger">
                <Icon.Trash />
                Delete Draft
              </button>
            </>
          ) : (
            <>
              <a 
                href={exportCsv(detail.id)} 
                target="_blank" 
                rel="noreferrer"
                className="setdetail-btn setdetail-btn-primary"
              >
                <Icon.Download />
                Export CSV
              </a>
              <button onClick={unpublish} className="setdetail-btn setdetail-btn-warning">
                <Icon.X />
                Unpublish
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
