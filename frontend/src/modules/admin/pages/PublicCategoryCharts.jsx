import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import ChartArea from "../components/ChartArea";

/* ---------- helpers ---------- */

const asStr = (v) => (v == null ? "" : String(v));

const prettyGender = (g) => {
  const s = String(g || "").toLowerCase();
  if (s === "m" || s === "male") return "Male";
  if (s === "f" || s === "female") return "Female";
  if (s === "other" || s === "o") return "Other";
  if (s === "unknown" || s === "u") return "Unknown";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function niceTitleForMetric(metric, topN) {
  const m = String(metric || "").toUpperCase();
  if (m === "LEADERS") return topN ? `Top ${topN}` : "Leaders";
  if (m === "GENDERS") return "Genders";
  if (m === "VOTES_BY_DAY" || m === "TREND") return "Votes by day";
  if (m === "PARTICIPATION") return "Participation";
  return "Chart";
}

// votes by day → [{date, count}, ...]
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
      for (let i = 0; i < L.length; i++)
        rows.push({ date: L[i], count: Number(V[i]) || 0 });
    } else {
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "number") rows.push({ date: k, count: v });
      }
    }
  }
  return rows;
}

/* ---------- metric fetchers ---------- */

async function fetchLeaders(categoryId, topN = 3) {
  const id = Number(categoryId) || categoryId;
  const tries = [
    ["/api/public/leaders", { params: { categoryId: id, limit: topN } }],
    ["/api/dashboard/leaders", { params: { categoryId: id, limit: topN } }],
  ];
  for (const [url, cfg] of tries) {
    try {
      const { data } = await api.get(url, cfg);
      return Array.isArray(data) ? data : [];
    } catch { /* empty */ }
  }
  return [];
}

async function fetchGenders(categoryId) {
  const id = Number(categoryId) || categoryId;
  const tries = [
    ["/api/public/genders", { params: { categoryId: id } }],
    ["/api/dashboard/genders", { params: { categoryId: id } }],
  ];
  for (const [url, cfg] of tries) {
    try {
      const { data } = await api.get(url, cfg);
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object") {
        return Object.entries(data).map(([k, v]) => ({
          name: prettyGender(k),
          value: Number(v) || 0,
        }));
      }
    } catch { /* empty */ }
  }
  return [];
}

async function fetchVotesByDay(categoryId) {
  const id = Number(categoryId) || categoryId;
  const tries = [
    ["/api/public/votes-by-day", { params: { categoryId: id } }],
    ["/api/public/votesByDay", { params: { categoryId: id } }],
    ["/api/dashboard/votes-by-day", { params: { categoryId: id } }],
    ["/api/dashboard/votesByDay", { params: { categoryId: id } }],
  ];
  for (const [url, cfg] of tries) {
    try {
      const { data } = await api.get(url, cfg);
      return normalizeVotesByDay(data);
    } catch { /* empty */ }
  }
  return [];
}

async function fetchParticipation(categoryId) {
  const id = Number(categoryId) || categoryId;
  const tries = [
    ["/api/public/participation", { params: { categoryId: id } }],
    ["/api/public/participation-rate", { params: { categoryId: id } }],
    ["/api/dashboard/participation", { params: { categoryId: id } }],
    ["/api/dashboard/participation-rate", { params: { categoryId: id } }],
  ];
  for (const [url, cfg] of tries) {
    try {
      const { data } = await api.get(url, cfg);
      if (Array.isArray(data)) {
        const named = data
          .map((r) => ({
            name: asStr(r.name || r.label || ""),
            value: Number(r.value ?? r.count ?? r.votes ?? 0) || 0,
          }))
          .filter((r) => r.name);
        if (named.length) return named;
      }
      if (data && typeof data === "object") {
        let eligible =
          Number(data.eligible ?? data.eligibleVoters ?? data.totalEligible ?? 0) || 0;
        let voted =
          Number(data.voted ?? data.votedCount ?? data.totalVotes ?? data.votes ?? 0) || 0;
        let percent =
          data.percent != null
            ? Number(data.percent)
            : data.participationPct != null
            ? Number(data.participationPct)
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
    } catch { /* empty */ }
  }
  return [];
}

/* ---------- get public views ---------- */

async function fetchPublicViews(categoryId) {
  const id = Number(categoryId) || categoryId;

  // Preferred: public widgets for category
  try {
    const { data } = await api.get(`/api/public/categories/${id}/widgets`);
    const arr = Array.isArray(data) ? data : Array.isArray(data?.widgets) ? data.widgets : [];
    if (arr.length) {
      return arr
        .map((v) => ({
          ...v,
          title: v.title ?? v.name ?? "",
          metric: String(v.metric || v.kind || "").toUpperCase(),
          chartType: String(v.chartType || v.type || "").toUpperCase(),
          topN: v.topN ?? v.limit ?? 3,
          showPublic: v.showPublic ?? v.public ?? true,
        }))
        .filter((v) => v.showPublic !== false);
    }
  } catch { /* empty */ }

  // Fallback: admin list (filter public)
  try {
    const { data } = await api.get(`/api/dashboard/category-views`, {
      params: { categoryId: id },
    });
    const list = Array.isArray(data) ? data : [];
    return list
      .filter((v) => !!v.showPublic)
      .map((v) => ({
        ...v,
        title: v.title ?? v.name ?? "",
        metric: String(v.metric || "").toUpperCase(),
        chartType: String(v.chartType || v.type || "").toUpperCase(),
        topN: v.topN ?? v.limit ?? 3,
      }));
  } catch { /* empty */ }

  return [];
}

function defaultChartTypeFor(metric) {
  const m = String(metric || "").toUpperCase();
  if (m === "GENDERS" || m === "PARTICIPATION") return "PIE";
  if (m === "VOTES_BY_DAY" || m === "TREND") return "LINE";
  return "BAR";
}

/* ---------- Component ---------- */

export default function PublicCategoryCharts({ categoryId }) {
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const views = await fetchPublicViews(categoryId);

      // take first two *public* views only
      const chosen = views
        .map((v) => ({
          ...v,
          metric: String(v.metric || "").toUpperCase(),
          chartType:
            String(v.chartType || defaultChartTypeFor(v.metric)).toUpperCase(),
          topN: v.topN ?? v.limit ?? 3,
          // prefer author’s title, otherwise a nice default
          _title:
            (v.title && String(v.title).trim()) ||
            niceTitleForMetric(v.metric, v.topN),
        }))
        .slice(0, 2);

      const out = [];
      for (const v of chosen) {
        let data = [];
        try {
          if (v.metric === "LEADERS") {
            data = await fetchLeaders(categoryId, v.topN);
          } else if (v.metric === "GENDERS") {
            data = await fetchGenders(categoryId);
          } else if (v.metric === "VOTES_BY_DAY" || v.metric === "TREND") {
            data = await fetchVotesByDay(categoryId);
          } else if (v.metric === "PARTICIPATION") {
            data = await fetchParticipation(categoryId);
          }
        } catch { /* empty */ }
        out.push({ chartType: v.chartType, data, title: v._title });
      }

      if (!cancelled) setPairs(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const hasDataOrTitle = useMemo(
    () => pairs.length && pairs.some((p) => p.title || (Array.isArray(p.data) && p.data.length)),
    [pairs]
  );
  if (!hasDataOrTitle) return null;

  return (
    <div className="mt-4">
      <ChartArea height={280} pairs={pairs} />
    </div>
  );
}
