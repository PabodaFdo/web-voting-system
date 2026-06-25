import { useEffect, useState, useCallback, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell, Send, History, Archive as ArchiveIcon, ArrowLeft, RefreshCw,
  RotateCcw, Trash2, Search, Home as HomeIcon
} from "lucide-react";
import { toast } from "sonner";
import "./ArchivedNotifications.css";
import {
  listArchived, restoreOne, deleteOne, restoreAllArchived, deleteAllArchived
} from "../api/notifications";

export default function ArchivedNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // match History: search + tab chips
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL"); // ALL | SCHEDULED | SENT | FAILED

  useEffect(() => {
    const root = document.querySelector(".arch-page");
    const onScroll = () => root?.classList.toggle("is-scrolled", window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await listArchived()); }
    catch (e) { toast.error(e?.message || "Failed to load archived"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const doRestore = async (id) => {
    try { await restoreOne(id); toast.success("Restored"); load(); }
    catch (e) { toast.error(e?.message || "Restore failed"); }
  };
  const doDelete = async (id) => {
    if (!confirm("Permanently delete?")) return;
    try { await deleteOne(id); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e?.message || "Delete failed"); }
  };
  const doRestoreAll = async () => {
    if (!confirm("Restore all archived?")) return;
    try { await restoreAllArchived(); toast.success("All restored"); load(); }
    catch (e) { toast.error(e?.message || "Restore all failed"); }
  };
  const doDeleteAll = async () => {
    if (!confirm("Delete all archived items?")) return;
    try { await deleteAllArchived(); toast.success("All deleted"); load(); }
    catch (e) { toast.error(e?.message || "Delete all failed"); }
  };

  const StatusBadge = ({ status }) =>
    status === "SENT" ? <span className="badge badge-green">Sent</span> :
    status === "FAILED" ? <span className="badge badge-red">Failed</span> :
    <span className="badge badge-yellow">Pending</span>;

  // same filtering as History
  const textFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(n =>
      (n.subject || "").toLowerCase().includes(q) ||
      (n.recipient || "").toLowerCase().includes(q) ||
      (n.status || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const filtered = useMemo(() => {
    return textFiltered.filter(n => {
      if (tab === "ALL") return true;
      if (tab === "SCHEDULED") return n.status === "PENDING";
      if (tab === "SENT") return n.status === "SENT";
      if (tab === "FAILED") return n.status === "FAILED";
      return true;
    });
  }, [textFiltered, tab]);

  return (
    <div className="arch-page">
      {/* Top Nav */}
      <nav className="top-nav" role="navigation" aria-label="Notifications Navigation">
        <div className="nav-content">
          <div className="nav-brand">
            <div className="nav-logo"><Bell className="i" /></div>
            <span className="nav-title">Notification Center</span>
          </div>

          <div className="nav-links">
            <NavLink to="/admin/notifications" end className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <HomeIcon className="i sm" /><span className="nav-link-text">Home</span>
            </NavLink>
            <NavLink to="/admin/notifications/compose" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <Send className="i sm" /><span className="nav-link-text">Compose</span>
            </NavLink>
            <NavLink to="/admin/notifications/history" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <History className="i sm" /><span className="nav-link-text">History</span>
            </NavLink>
            <NavLink to="/admin/notifications/archived" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <ArchiveIcon className="i sm" /><span className="nav-link-text">Archived</span>
            </NavLink>
          </div>

          <button type="button" className="nav-back-btn" onClick={backToDashboard}>
            <ArrowLeft className="i sm" /> <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      {/* Page card */}
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="card arch">
          <div className="card-header arch__header">
            <div className="arch__title">
              <div className="arch__icon"><ArchiveIcon size={20} /></div>
              <h2>Archived Notifications</h2>
            </div>

            {/* Toolbar actions */}
            <div className="arch__right">
              {items.length > 0 && (
                <>
                  <button onClick={doRestoreAll} className="btn btn-outline"><RotateCcw size={16} /> Restore All</button>
                  <button onClick={doDeleteAll} className="btn btn-outline arch__danger"><Trash2 size={16} /> Delete All</button>
                </>
              )}
              <button onClick={load} disabled={loading} className="btn btn-outline">
                <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>

            {/* EXACT same pill search + chips row as History */}
            <div className="arch__search searchbar">
              <div className="searchbar-inner">
                <Search size={18} className="searchbar-icon" aria-hidden="true" />
                <input
                  className="searchbar-input"
                  placeholder="Search archived by subject, recipient, or status…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search archived notifications"
                />
              </div>

              <div className="seg">
                <button type="button" className={`seg-btn ${tab === "ALL" ? "is-active" : ""}`} onClick={() => setTab("ALL")}>All</button>
                <button type="button" className={`seg-btn ${tab === "SCHEDULED" ? "is-active" : ""}`} onClick={() => setTab("SCHEDULED")}>Scheduled</button>
                <button type="button" className={`seg-btn ${tab === "SENT" ? "is-active" : ""}`} onClick={() => setTab("SENT")}>Sent</button>
                <button type="button" className={`seg-btn ${tab === "FAILED" ? "is-active" : ""}`} onClick={() => setTab("FAILED")}>Failed</button>
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="arch__empty">
                <div className="arch__ghost"><RefreshCw size={24} className="spin" /></div>
                <p>Loading archived notifications...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="arch__empty">
                <div className="arch__ghost"><ArchiveIcon size={24} /></div>
                <h3>No archived notifications {search ? "match your search" : ""}</h3>
                <p>{search ? "Try a different keyword" : "Archived items will show here"}</p>
              </div>
            ) : (
              <div className="arch__list">
                {filtered.map(n => (
                  <div key={n.id} className="arch__item">
                    <div className="arch__row">
                      <div className="arch__cell">
                        <h4 className="arch__subject">{n.subject}</h4>
                        <p className="arch__recipient">{n.recipient}</p>
                      </div>
                      <StatusBadge status={n.status} />
                    </div>
                    <p className="arch__body">{n.body}</p>
                    <div className="arch__actions">
                      <button className="btn btn-primary" onClick={() => doRestore(n.id)}><RotateCcw size={16} /> Restore</button>
                      <button className="btn btn-outline arch__danger" onClick={() => doDelete(n.id)}><Trash2 size={16} /> Delete Permanently</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
