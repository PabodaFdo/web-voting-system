import { useCallback, useEffect, useState } from "react";
import { api, listEvents, listCategoriesByEvent } from "../api";
import CategoryViewsPanel from "../components/CategoryViewsPanel";
import "./Dashboard.css";

/* Icons */
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
    ArrowLeft: (p) => (
        <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
            <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
    ),
};

const token = () => {
    const sessionToken = sessionStorage.getItem("admin_jwt");
    if (sessionToken) return sessionToken;
    try {
        return JSON.parse(localStorage.getItem("admin_auth") || "null")?.token || "";
    } catch {
        return "";
    }
};
const adminLink = (path = "/admin") => path;
const resultsLink = (path = "/") =>
    path === "/" ? "/admin/results" : `/admin/results${path}`;

const idStr = (v) => (v === null || v === undefined ? "" : String(v));

function Kpi({ title, value, icon }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}

/* Dashboard nav */
function GlassNav() {
    return (
        <nav className="results-top-nav" role="navigation" aria-label="Dashboard Navigation">
            <div className="results-nav-content">
                <div className="results-nav-brand">
                    <div className="results-nav-logo"><Icon.Star /></div>
                    <span className="results-nav-title">Voting Admin</span>
                </div>

                <div className="results-nav-links">
                    <a className="results-nav-link" href={adminLink("/admin")}>
                        <Icon.Home style={{ display: 'block' }} /><span className="results-nav-link-text">Home</span>
                    </a>
                    <span className="results-nav-link" aria-current="page">
                        <Icon.Dashboard style={{ display: 'block' }} /><span className="results-nav-link-text">Dashboard</span>
                    </span>
                    <a className="results-nav-link" href={resultsLink("/analytics")}>
                        <Icon.Chart style={{ display: 'block' }} /><span className="results-nav-link-text">Analytics</span>
                    </a>
                    <a className="results-nav-link" href={resultsLink("/")}>
                        <Icon.Award style={{ display: 'block' }} /><span className="results-nav-link-text">Publish Winners</span>
                    </a>
                    <a className="results-nav-link" href={adminLink("/admin/students")}>
                        <Icon.User style={{ display: 'block' }} /><span className="results-nav-link-text">Students</span>
                    </a>
                </div>

                <a className="results-nav-back-btn" href={adminLink("/admin")}>
                    <Icon.ArrowLeft style={{ display: 'block' }} />Back to Dashboard
                </a>
            </div>
        </nav>
    );
}

export default function Dashboard() {
    // Attach token to axios once.
    useEffect(() => {
        const qs = new URLSearchParams(window.location.search);
        const t = qs.get("token");
        if (t) {
            sessionStorage.setItem("admin_jwt", t);
            const clean = window.location.pathname + window.location.hash;
            window.history.replaceState({}, "", clean);
            api.defaults.headers.common.Authorization = `Bearer ${t}`;
        } else {
            const stored = token();
            if (stored) api.defaults.headers.common.Authorization = `Bearer ${stored}`;
        }
    }, []);

    const hasToken = !!token();

    // Page state
    const [kpis, setKpis] = useState(null);
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);

    const [eventId, setEventId] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [auto, setAuto] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data loaders
    const loadInitial = useCallback(async () => {
        setErr("");
        if (!hasToken) { setLoading(false); return; }
        try {
            const { data: k } = await api.get("/api/dashboard/kpis");
            setKpis(k);
            const evs = await listEvents();
            setEvents(evs || []);
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, [hasToken]);

    const refreshAll = async () => {
        if (refreshing || !hasToken) return;
        setRefreshing(true);
        try {
            const { data: k } = await api.get("/api/dashboard/kpis");
            setKpis(k);
            const evs = await listEvents();
            setEvents(evs || []);
            if (eventId) {
                const list = await listCategoriesByEvent(eventId);
                setCategories(list || []);
            }
            if (categoryId) {
                const categoryParam = Number(categoryId) || categoryId;
                const { data } = await api.get("/api/dashboard/leaders", {
                    params: { categoryId: categoryParam, limit: 3 },
                });
                setLeaders(data || []);
            }
        } catch (e) {
            console.error("Soft refresh failed:", e);
        } finally {
            setRefreshing(false);
        }
    };

    // ---- 4) Effects (guarded by hasToken, but hooks still run every render)
    useEffect(() => { void loadInitial(); }, [loadInitial]);

    useEffect(() => {
        (async () => {
            if (!hasToken) return;
            if (!eventId) { setCategories([]); setCategoryId(""); setLeaders([]); return; }
            const list = await listCategoriesByEvent(eventId);
            setCategories(list || []);
            const stillValid = (list || []).some((c) => idStr(c.categoryId ?? c.id) === idStr(categoryId));
            if (!stillValid) setCategoryId("");
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasToken, eventId]);

    useEffect(() => {
        (async () => {
            if (!hasToken) return;
            if (!categoryId) { setLeaders([]); return; }
            try {
                const categoryParam = Number(categoryId) || categoryId;
                const { data } = await api.get("/api/dashboard/leaders", {
                    params: { categoryId: categoryParam, limit: 3 },
                });
                setLeaders(data || []);
            } catch { setLeaders([]); }
        })();
    }, [hasToken, categoryId]);

    useEffect(() => {
        if (!hasToken || !auto) return;
        const h = setInterval(async () => {
            try {
                const { data: k } = await api.get("/api/dashboard/kpis");
                setKpis(k);
                if (eventId) {
                    const list = await listCategoriesByEvent(eventId);
                    setCategories(list || []);
                }
                if (categoryId) {
                    const categoryParam = Number(categoryId) || categoryId;
                    const { data } = await api.get("/api/dashboard/leaders", {
                        params: { categoryId: categoryParam, limit: 3 },
                    });
                    setLeaders(data || []);
                }
            } catch { /* empty */ }
        }, 15000);
        return () => clearInterval(h);
    }, [hasToken, auto, eventId, categoryId]);

    const resetFilters = () => { setEventId(""); setCategoryId(""); setCategories([]); setLeaders([]); };

    const safe = kpis || { totalVotes: 0, eligibleVoters: 0, participationPct: 0, categoriesActive: 0 };

    // ---- 5) Single return; render states conditionally inside
    return (
        <div className="dashboard-hero">
            <div className="dashboard-wrap">
                <GlassNav />

                {!hasToken ? (
                    <div
                        className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center"
                        style={{ maxWidth: 480, margin: "60px auto" }}
                    >
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-red-600 text-2xl">🔒</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
                        <p className="text-gray-600 mb-4"><b>Missing admin token.</b> Please open Dashboard from Admin.</p>
                        <a className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                           href={adminLink("/admin")}>
                            Go to Admin
                        </a>
                    </div>
                ) : loading ? (
                    <div style={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
                        <div className="text-center bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading dashboard...</p>
                        </div>
                    </div>
                ) : err ? (
                    <div
                        className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
                        style={{ maxWidth: 720, margin: "24px auto" }}
                    >
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-red-600 text-xl">⚠️</span>
                        </div>
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
                        <p className="text-red-600">{err}</p>
                        <button
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors mt-4"
                            onClick={() => void loadInitial()}
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Page header card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Voting Dashboard</h1>
                                    <p className="text-gray-600 mt-2">Real-time overview and analytics (admin only)</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={auto}
                                            onChange={(e) => setAuto(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        Auto refresh (15s)
                                    </label>
                                    <button
                                        className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium ${refreshing ? "opacity-75 cursor-not-allowed" : ""}`}
                                        onClick={refreshAll}
                                        disabled={refreshing}
                                        title="Refresh KPIs and current lists without reloading the page"
                                    >
                                        <span>🔄</span>
                                        {refreshing ? "Refreshing…" : "Refresh Now"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Kpi title="Total Votes" value={safe.totalVotes} icon="🗳️" />
                            <Kpi title="Eligible Voters" value={safe.eligibleVoters} icon="👥" />
                            <Kpi title="Participation %" value={`${safe.participationPct}%`} icon="📊" />
                            <Kpi title="Active Categories" value={safe.categoriesActive} icon="🏷️" />
                        </div>

                        {/* Filters + Leaders */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* Filter */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <span className="text-purple-600">🏆</span>
                                    </div>
                                    Category Selection
                                </h3>

                                <div className="ecf">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Event</label>
                                            <select value={idStr(eventId)} onChange={(e) => setEventId(idStr(e.target.value))}>
                                                <option value="">Select an event</option>
                                                {events.map((ev) => {
                                                    const optId = idStr(ev?.id ?? ev?.eventId ?? ev?.eventID);
                                                    const name  = ev?.name ?? ev?.title ?? ev?.eventName ?? `Event ${optId}`;
                                                    return (
                                                        <option key={optId} value={optId}>
                                                            {name}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Category</label>
                                            <select
                                                value={idStr(categoryId)}
                                                onChange={(e) => setCategoryId(idStr(e.target.value))}
                                                disabled={!eventId}
                                            >
                                                {!eventId ? (
                                                    <option value="">Select an event first</option>
                                                ) : categories.length === 0 ? (
                                                    <option value="">No categories available</option>
                                                ) : (
                                                    <>
                                                        <option value="">Select a category</option>
                                                        {categories.map((c) => {
                                                            const cid  = idStr(c?.categoryId ?? c?.id);
                                                            const name = c?.categoryName ?? c?.name ?? `Category ${cid}`;
                                                            return (
                                                                <option key={cid} value={cid}>
                                                                    {name}
                                                                </option>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="ecf-actions">
                                        <button className="btn-reset" onClick={resetFilters}>Reset Filters</button>
                                    </div>
                                </div>
                            </div>

                            {/* Leaders */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <span className="text-yellow-600">👑</span>
                                    </div>
                                    Current Leaders
                                </h3>

                                <div className="space-y-4">
                                    {leaders.map((l, index) => (
                                        <div
                                            key={l.nomineeId ?? `${l.nomineeName}-${index}`}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                                        index === 0 ? "bg-yellow-500 shadow-md" :
                                                            index === 1 ? "bg-gray-400" :
                                                                index === 2 ? "bg-orange-500" : "bg-gray-300"
                                                    }`}
                                                >
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-gray-900">{l.nomineeName}</span>
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {l.votes} votes
                      </span>
                                        </div>
                                    ))}

                                    {leaders.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            <div className="text-3xl mb-3">📊</div>
                                            <p className="font-medium">No voting data available</p>
                                            <p className="text-sm mt-1">Select a category to see leaders</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CRUD panel */}
                        {categoryId && <CategoryViewsPanel categoryId={Number(categoryId) || categoryId} />}
                    </>
                )}
            </div>
        </div>
    );
}
