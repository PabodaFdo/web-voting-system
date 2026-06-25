import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import ChartArea from "./ChartArea";
import "./CategoryViewsPanel.css";

/* ---------- Metrics & Chart Types ---------- */
const METRICS = [
  { value: "LEADERS",       label: "Top Candidates",      icon: "👑" },
  { value: "GENDERS",       label: "Gender Distribution", icon: "👥" },
  { value: "VOTES_BY_DAY",  label: "Votes by Day",        icon: "📅" },
  { value: "PARTICIPATION", label: "Participation",       icon: "🎯" },
];

const CHART_TYPES = [
  { value: "BAR",  label: "Bar Chart",  icon: "📊" },
  { value: "PIE",  label: "Pie Chart",  icon: "🥧" },
  { value: "LINE", label: "Line Chart", icon: "📈" },
];

/* ===========================================================
   Data helpers — normalize shapes from various endpoints
   =========================================================== */
const asStr = (v) => (v === null || v === undefined ? "" : String(v));

/* Votes by Day */
function normalizeVotesByDay(raw) {
  const rows = [];
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (Array.isArray(it) && it.length >= 2) {
        rows.push({ date: it[0], count: Number(it[1]) || 0 });
      } else if (it && typeof it === "object") {
        const dayish = it.day ?? it.date ?? it.ts ?? it.when ?? it.label;
        const val =
          typeof it.value === "number"
            ? it.value
            : typeof it.votes === "number"
            ? it.votes
            : typeof it.count === "number"
            ? it.count
            : 0;
        rows.push({ date: dayish, count: val });
      }
    }
  } else if (raw && typeof raw === "object") {
    const L = raw.labels || raw.days || raw.dates;
    const V = raw.values || raw.counts || raw.votes;
    if (Array.isArray(L) && Array.isArray(V) && L.length === V.length) {
      for (let i = 0; i < L.length; i++) rows.push({ date: L[i], count: Number(V[i]) || 0 });
    } else {
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "number") rows.push({ date: k, count: v });
      }
    }
  }
  return rows;
}

async function fetchVotesByDay(categoryId) {
  const id = Number(categoryId) || categoryId;
  const tries = [
    ["/api/dashboard/votes-by-day", { params: { categoryId: id } }],
    ["/api/dashboard/votesByDay",   { params: { categoryId: id } }],
  ];
  for (const [url, cfg] of tries) {
    try {
      const { data } = await api.get(url, cfg);
      return normalizeVotesByDay(data);
    } catch {}
  }
  return [];
}

/* Participation */
function normalizeParticipation(raw) {
  let eligible = 0, voted = 0, percent = null;

  if (Array.isArray(raw)) {
    const named = raw
      .map((r) => ({
        name: asStr(r.name || r.label || ""),
        value: Number(r.value ?? r.count ?? r.votes ?? 0) || 0,
      }))
      .filter((r) => r.name);
    if (named.length) return named;
  }

  if (raw && typeof raw === "object") {
    eligible = Number(raw.eligible ?? raw.eligibleVoters ?? raw.totalEligible ?? 0) || 0;
    voted    = Number(raw.voted ?? raw.votedCount ?? raw.totalVotes ?? raw.votes ?? 0) || 0;
    percent  = raw.percent != null
      ? Number(raw.percent)
      : raw.participationPct != null
      ? Number(raw.participationPct)
      : null;

    if (eligible && !voted && percent != null) {
      voted = Math.round((percent / 100) * eligible);
    } else if (!eligible && voted && percent != null && percent > 0) {
      eligible = Math.round((voted * 100) / percent);
    }

    if (eligible && voted) {
      const notVoted = Math.max(eligible - voted, 0);
      return [
        { name: "Voted", value: voted },
        { name: "Not Voted", value: notVoted },
      ];
    }

    if (percent != null) {
      const p = Math.max(0, Math.min(100, percent));
      return [
        { name: "Participated", value: p },
        { name: "Not Participated", value: 100 - p },
      ];
    }
  }
  return [];
}

async function fetchParticipation(categoryId) {
  const id = Number(categoryId) || categoryId;
  const tries = [
    ["/api/dashboard/participation", { params: { categoryId: id } }],
    ["/api/dashboard/participation-rate", { params: { categoryId: id } }],
  ];
  for (const [url, cfg] of tries) {
    try {
      const { data } = await api.get(url, cfg);
      return normalizeParticipation(data);
    } catch {}
  }
  return [];
}

/* =========================================================== */

export default function CategoryViewsPanel({ categoryId }) {
  const [views, setViews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    chartType: "BAR",
    metric: "LEADERS",
    topN: 3,
    showPublic: false,
  });
  const [preview, setPreview] = useState({ id: null, chartType: "BAR", data: [] });
  const [expanded, setExpanded] = useState({});

  const isEdit = editId != null;

  const fetchViews = async () => {
    const { data } = await api.get("/api/dashboard/category-views", { params: { categoryId } });
    // Hide legacy TREND views if any exist in DB
    const list = (Array.isArray(data) ? data : []).filter(v => String(v.metric).toUpperCase() !== "TREND");
    setViews(list);
  };

  useEffect(() => {
    resetForm();
    if (categoryId) fetchViews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const updateField = (k, v) => {
    if (k === "metric") {
      const next = v;
      setDraft((d) => ({
        ...d,
        metric: next,
        chartType:
          next === "GENDERS" ? "PIE" :
          next === "VOTES_BY_DAY" ? "LINE" :
          next === "PARTICIPATION" ? "PIE" :
          d.chartType,
      }));
    } else {
      setDraft((d) => ({ ...d, [k]: v }));
    }
  };

  const resetForm = () => {
    setEditId(null);
    setDraft({ title: "", chartType: "BAR", metric: "LEADERS", topN: 3, showPublic: false });
    setPreview({ id: null, chartType: "BAR", data: [] });
  };

  const payload = useMemo(
    () => ({
      ...draft,
      categoryId: Number(categoryId),
      topN: draft.topN ? Number(draft.topN) : null,
    }),
    [draft, categoryId]
  );

  /* CRUD */
  const save = async () => {
    if (!draft.title.trim()) return alert("Please enter a title for your view");
    if (draft.metric === "LEADERS" && (!draft.topN || draft.topN < 1)) {
      return alert("Please set Top N to at least 1 for leaderboards");
    }
    setBusy(true);
    try {
      if (isEdit) await api.put(`/api/dashboard/category-views/${editId}`, payload);
      else await api.post("/api/dashboard/category-views", payload);
      await fetchViews();
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to save view");
    } finally {
      setBusy(false);
    }
  };

  const editView = (v) => {
    const metric = String(v.metric || "LEADERS").toUpperCase() === "TREND" ? "VOTES_BY_DAY" : v.metric;
    setEditId(v.id);
    setDraft({
      title: v.title ?? "",
      chartType: v.chartType ?? "BAR",
      metric: metric ?? "LEADERS",
      topN: v.topN ?? 3,
      showPublic: !!v.showPublic,
    });
    setPreview({ id: null, chartType: v.chartType ?? "BAR", data: [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteView = async (id) => {
    if (!confirm("Are you sure you want to delete this saved view?")) return;
    try {
      await api.delete(`/api/dashboard/category-views/${id}`);
      await fetchViews();
      if (editId === id) resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to delete view");
    }
  };

  const togglePublic = async (v) => {
    try {
      await api.put(`/api/dashboard/category-views/${v.id}`, {
        id: v.id,
        categoryId: v.categoryId,
        title: v.title,
        chartType: v.chartType,
        metric: v.metric,
        topN: v.topN,
        showPublic: !v.showPublic,
      });
      await fetchViews();
    } catch (e) {
      console.error(e);
      alert("Failed to update visibility");
    }
  };

  const prettyGender = (g) => {
    const s = String(g || "").toLowerCase();
    if (s === "m" || s === "male") return "Male";
    if (s === "f" || s === "female") return "Female";
    if (s === "other" || s === "o") return "Other";
    if (s === "unknown" || s === "u") return "Unknown";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  /* Preview (form) */
  const previewNow = async () => {
    setPreview({ id: "loading", chartType: draft.chartType, data: [] });
    try {
      if (draft.metric === "LEADERS") {
        const { data } = await api.get("/api/dashboard/leaders", {
          params: { categoryId, limit: draft.topN || 3 },
        });
        setPreview({ id: "ok", chartType: draft.chartType, data });
      } else if (draft.metric === "GENDERS") {
        const { data } = await api.get("/api/dashboard/genders", { params: { categoryId } });
        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && typeof data === "object") {
          rows = Object.entries(data).map(([k, v]) => ({
            name: prettyGender(k),
            value: Number(v) || 0,
          }));
        }
        setPreview({ id: "ok", chartType: draft.chartType, data: rows });
      } else if (draft.metric === "VOTES_BY_DAY") {
        const rows = await fetchVotesByDay(categoryId);
        setPreview({ id: "ok", chartType: draft.chartType, data: rows });
      } else if (draft.metric === "PARTICIPATION") {
        const rows = await fetchParticipation(categoryId);
        setPreview({ id: "ok", chartType: draft.chartType, data: rows });
      } else {
        setPreview({ id: "na", chartType: draft.chartType, data: [] });
        alert("Preview for this metric is not implemented.");
      }
    } catch (e) {
      console.error(e);
      setPreview({ id: "err", chartType: draft.chartType, data: [] });
      alert("Failed to load preview data");
    }
  };

  /* Expanded preview for saved cards */
  const loadExpanded = async (v) => {
    const key = v.id;
    setExpanded((m) => ({ ...m, [key]: { id: "loading", chartType: v.chartType, data: [] } }));
    try {
      if (v.metric === "LEADERS") {
        const limit = v.topN || 3;
        const { data } = await api.get("/api/dashboard/leaders", { params: { categoryId, limit } });
        setExpanded((m) => ({ ...m, [key]: { id: "ok", chartType: v.chartType, data } }));
      } else if (v.metric === "GENDERS") {
        const { data } = await api.get("/api/dashboard/genders", { params: { categoryId } });
        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && typeof data === "object") {
          rows = Object.entries(data).map(([k, val]) => ({
            name: prettyGender(k),
            value: Number(val) || 0,
          }));
        }
        setExpanded((m) => ({ ...m, [key]: { id: "ok", chartType: v.chartType, data: rows } }));
      } else if (v.metric === "VOTES_BY_DAY") {
        const rows = await fetchVotesByDay(categoryId);
        setExpanded((m) => ({ ...m, [key]: { id: "ok", chartType: v.chartType, data: rows } }));
      } else if (v.metric === "PARTICIPATION") {
        const rows = await fetchParticipation(categoryId);
        setExpanded((m) => ({ ...m, [key]: { id: "ok", chartType: v.chartType, data: rows } }));
      } else {
        setExpanded((m) => ({ ...m, [key]: { id: "na", chartType: v.chartType, data: [] } }));
      }
    } catch (e) {
      console.error(e);
      setExpanded((m) => ({ ...m, [key]: { id: "err", chartType: v.chartType, data: [] } }));
    }
  };

  const toggleExpanded = async (v) => {
    const cur = expanded[v.id];
    if (cur) {
      const cpy = { ...expanded };
      delete cpy[v.id];
      setExpanded(cpy);
    } else {
      await loadExpanded(v);
    }
  };

  /* CSV Export (trend branch removed) */
  const exportViewCsv = async (v) => {
    const metric = String(v.metric || "").toUpperCase();
    const safe = (s) =>
      String(s || "view").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const download = (filename, text) => {
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
    };
    const tryBackendExport = async (url, filename) => {
      try {
        const res = await api.get(url, { responseType: "blob" });
        const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dlUrl);
        return true;
      } catch {
        return false;
      }
    };

    try {
      if (metric === "LEADERS") {
        const n = v.topN || 3;
        const fname = `${safe(v.title)}_leaders_cat_${categoryId}_top${n}.csv`;
        const url = `/api/dashboard/exports/leaders?categoryId=${categoryId}&topN=${n}`;
        if (await tryBackendExport(url, fname)) return;

        const { data } = await api.get("/api/dashboard/leaders", { params: { categoryId, limit: n } });
        const rows = Array.isArray(data) ? data : [];
        const csv = ["rank,name,votes"];
        rows.forEach((r, i) =>
          csv.push(`${i + 1},"${(r.nomineeName ?? r.name ?? "").replace(/"/g, '""')}",${r.votes ?? r.value ?? 0}`)
        );
        download(fname, csv.join("\n"));
        return;
      }

      if (metric === "GENDERS") {
        const fname = `${safe(v.title)}_genders_cat_${categoryId}.csv`;
        const url = `/api/dashboard/exports/genders?categoryId=${categoryId}`;
        if (await tryBackendExport(url, fname)) return;

        const { data } = await api.get("/api/dashboard/genders", { params: { categoryId } });
        const rows = Array.isArray(data)
          ? data
          : Object.entries(data || {}).map(([k, val]) => ({ name: k, value: val }));
        const csv = ["gender,count"];
        rows.forEach((r) => csv.push(`"${String(r.name ?? r.label ?? r.gender ?? "").replace(/"/g, '""')}",${r.value ?? r.count ?? 0}`));
        download(fname, csv.join("\n"));
        return;
      }

      if (metric === "VOTES_BY_DAY") {
        const fname = `${safe(v.title)}_votes_by_day_cat_${categoryId}.csv`;
        const url = `/api/dashboard/exports/votes-by-day?categoryId=${categoryId}`;
        if (await tryBackendExport(url, fname)) return;

        const rows = await fetchVotesByDay(categoryId);
        const csv = ["date,count"];
        rows.forEach((r) => csv.push(`${r.date ?? ""},${r.count ?? 0}`));
        download(fname, csv.join("\n"));
        return;
      }

      if (metric === "PARTICIPATION") {
        const fname = `${safe(v.title)}_participation_cat_${categoryId}.csv`;
        const url = `/api/dashboard/exports/participation?categoryId=${categoryId}`;
        if (await tryBackendExport(url, fname)) return;

        const rows = await fetchParticipation(categoryId);
        const csv = ["name,value"];
        rows.forEach((r) => csv.push(`"${String(r.name ?? "").replace(/"/g, '""')}",${r.value ?? 0}`));
        download(fname, csv.join("\n"));
        return;
      }
    } catch (e) {
      try {
        const status = e?.response?.status;
        const text = await e?.response?.data?.text?.();
        alert(`Export failed${status ? " (" + status + ")" : ""}${text ? `: ${text}` : ""}`);
      } catch {
        alert("Export failed");
      }
      console.error(e);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="cvp card mt-6 bg-white shadow-lg rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Saved Chart Views</h3>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage reusable chart configurations for this category
          </p>
        </div>
        {isEdit && (
          <button className="cvp-btn cvp-btn-secondary" onClick={resetForm} disabled={busy}>
            Cancel Edit
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          {isEdit ? "Edit View" : "Create New View"}
        </h4>

        <div className="cvp-grid">
          <div className="cvp-field">
            <label className="cvp-label">View Title</label>
            <input
              className="cvp-input"
              value={draft.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g., Top 3 Leaders"
            />
          </div>

          <div className="cvp-field">
            <label className="cvp-label">Data Metric</label>
            <select
              className="cvp-input"
              value={draft.metric}
              onChange={(e) => updateField("metric", e.target.value)}
            >
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.icon} {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {draft.metric === "LEADERS" && (
          <div className="cvp-field w-40">
            <label className="cvp-label">Show Top N</label>
            <input
              type="number"
              min={1}
              step={1}
              className="cvp-input"
              value={draft.topN ?? 1}
              onChange={(e) => updateField("topN", e.currentTarget.valueAsNumber || 1)}
            />
          </div>
        )}

        {/* Chart Type segmented control */}
        <div className="cvp-field">
          <label className="cvp-label">Chart Type</label>
          <div className="cvp-seg" role="tablist" aria-label="Chart Type">
            {CHART_TYPES.map((ct) => {
              const active = draft.chartType === ct.value;
              return (
                <button
                  key={ct.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`cvp-seg-btn${active ? " is-active" : ""}`}
                  onClick={() => updateField("chartType", ct.value)}
                >
                  <span className="cvp-seg-emoji">{ct.icon}</span>
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cvp-field-group">
          <label className="cvp-check">
            <input
              type="checkbox"
              checked={draft.showPublic}
              onChange={(e) => updateField("showPublic", e.target.checked)}
            />
            <span>Make this view public</span>
          </label>

          <div className="cvp-actions">
            <button className="cvp-btn cvp-btn-primary" onClick={save} disabled={busy}>
              {busy ? "Saving..." : isEdit ? "💾 Update View" : "➕ Create View"}
            </button>
            <button className="cvp-btn cvp-btn-secondary" onClick={previewNow} disabled={busy}>
              👁️ Preview Chart
            </button>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      {preview.id && (
        <div className="border-t border-gray-200 p-6 bg-blue-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">📈 Chart Preview</h4>
          {preview.id === "loading" && (
            <div className="text-center py-8">
              <div className="cvp-spinner mx-auto mb-3" />
              <p className="text-gray-500">Loading preview data...</p>
            </div>
          )}
          {preview.id === "ok" && <ChartArea chartType={preview.chartType} data={preview.data} />}
          {preview.id === "err" && <div className="text-center py-8 text-red-600">Failed to load preview data</div>}
          {preview.id === "na" && <div className="text-center py-8 text-gray-600">Preview for this metric is not implemented.</div>}
        </div>
      )}

      {/* Saved views list */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Your Saved Views</h4>
          <span className="cvp-pill">{views.length} view{views.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="cvp-list">
          {views.map((v) => (
            <div key={v.id} className="cvp-view">
              <div className="cvp-view-head">
                <div className="cvp-view-meta">
                  <h5 className="cvp-view-title">{v.title}</h5>
                  <div className="cvp-tags">
                    <span className="cvp-tag cvp-tag-blue">{String(v.chartType).toLowerCase()}</span>
                    <span className="cvp-tag cvp-tag-purple">{String(v.metric).toLowerCase()}</span>
                    {v.topN ? <span className="cvp-tag cvp-tag-orange">top {v.topN}</span> : null}
                    {v.showPublic ? <span className="cvp-badge-public">✓ Public</span> : null}
                  </div>
                </div>

                <div className="cvp-view-actions">
                  <button className="cvp-btn cvp-btn-cyan" onClick={() => toggleExpanded(v)} title="Toggle Chart Preview">📊</button>
                  <button className="cvp-btn cvp-btn-green" onClick={() => exportViewCsv(v)} title="Export to CSV">📥</button>
                  <button className="cvp-btn cvp-btn-secondary" onClick={() => editView(v)} title="Edit View">✏️</button>
                  <button className="cvp-btn cvp-btn-indigo" onClick={() => togglePublic(v)} title={v.showPublic ? "Hide from Public" : "Show to Public"}>{v.showPublic ? "🔓" : "🔒"}</button>
                  <button className="cvp-btn cvp-btn-danger" onClick={() => deleteView(v.id)} title="Delete View">🗑️</button>
                </div>
              </div>

              {expanded[v.id] && (
                <div className="cvp-preview">
                  <p className="cvp-preview-title">Chart Preview</p>
                  {expanded[v.id].id === "loading" && (
                    <div className="text-center py-6">
                      <div className="cvp-spinner mx-auto mb-2" />
                      <span className="text-gray-500 text-sm">Loading...</span>
                    </div>
                  )}
                  {expanded[v.id].id === "ok" && (
                    <ChartArea chartType={expanded[v.id].chartType} data={expanded[v.id].data} />
                  )}
                  {expanded[v.id].id === "err" && (
                    <div className="text-center py-6 text-red-600">Failed to load data for this view</div>
                  )}
                  {expanded[v.id].id === "na" && (
                    <div className="text-center py-6 text-gray-600">Preview for this metric is not implemented.</div>
                  )}
                </div>
              )}
            </div>
          ))}

          {views.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">📊</div>
              <p className="text-gray-500">No saved views yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first view to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
