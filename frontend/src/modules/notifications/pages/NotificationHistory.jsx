import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Send, History, Archive as ArchiveIcon, ArrowLeft, Search, RefreshCw, Edit, X, Clock, Calendar, Home as HomeIcon } from "lucide-react";
import { toast } from "sonner";
import "./NotificationHistory.css";
import { listActive, archiveOne, cancelOne, reschedule } from "../api/notifications";

export default function NotificationHistory() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("ALL"); // ALL | SCHEDULED | SENT | FAILED

  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState("");

  // sticky nav "scrolled" glow like Nominee
  useEffect(() => {
    const root = document.querySelector(".history-page");
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
    try {
      setItems(await listActive());
    } catch (e) {
      toast.error(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // search text filter
  const textFiltered = items.filter(n => {
    const t = search.toLowerCase();
    return (
      (n.recipient || "").toLowerCase().includes(t) ||
      (n.subject || "").toLowerCase().includes(t) ||
      (n.status || "").toLowerCase().includes(t)
    );
  });

  // status chip filter
  const statusFiltered = textFiltered.filter(n => {
    if (tab === "ALL") return true;
    if (tab === "SCHEDULED") return n.status === "PENDING";
    if (tab === "SENT") return n.status === "SENT";
    if (tab === "FAILED") return n.status === "FAILED";
    return true;
  });

  const doArchive = async (id) => {
    try { await archiveOne(id); toast.success("Archived"); load(); }
    catch (e) { toast.error(e?.message || "Archive failed"); }
  };

  const doCancel  = async (id) => {
    try { await cancelOne(id); toast.success("Cancelled"); load(); }
    catch (e) { toast.error(e?.message || "Cancel failed"); }
  };

  const saveReschedule = async () => {
    if (!rescheduleId || !rescheduleTime) return;
    try {
      await reschedule(rescheduleId, rescheduleTime);
      toast.success("Rescheduled");
      setRescheduleId(null);
      setRescheduleTime("");
      load();
    } catch (e) {
      toast.error(e?.message || "Reschedule failed");
    }
  };

  const StatusBadge = ({ status }) => status==="SENT"
    ? <span className="badge badge-green">Sent</span>
    : status==="FAILED" ? <span className="badge badge-red">Failed</span>
    : <span className="badge badge-yellow">Pending</span>;

  return (
    <div className="history-page">
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
            {/* Compose now lives at /compose */}
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
        <div className="card nh">
          <div className="card-header nh__header">
            <div className="nh__title">
              <div className="nh__icon"><Clock size={22} /></div>
              <h2>Notification History</h2>
            </div>

            <button onClick={load} disabled={loading} className="btn btn-outline">
              <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
            </button>

            <div className="nh__search searchbar">
              <div className="searchbar-inner">
                <Search size={18} className="searchbar-icon" aria-hidden="true" />
                <input
                  className="searchbar-input"
                  placeholder="Search notifications by subject, recipient, or status…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search notifications"
                />
              </div>

              <div className="seg">
                <button
                  type="button"
                  className={`seg-btn ${tab === "ALL" ? "is-active" : ""}`}
                  onClick={() => setTab("ALL")}
                >All</button>

                <button
                  type="button"
                  className={`seg-btn ${tab === "SCHEDULED" ? "is-active" : ""}`}
                  onClick={() => setTab("SCHEDULED")}
                >Scheduled</button>

                <button
                  type="button"
                  className={`seg-btn ${tab === "SENT" ? "is-active" : ""}`}
                  onClick={() => setTab("SENT")}
                >Sent</button>

                <button
                  type="button"
                  className={`seg-btn ${tab === "FAILED" ? "is-active" : ""}`}
                  onClick={() => setTab("FAILED")}
                >Failed</button>
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="nh__empty">
                <div className="nh__loader"><RefreshCw size={24} className="spin" /></div>
                <p>Loading notifications...</p>
              </div>
            ) : statusFiltered.length === 0 ? (
              <div className="nh__empty">
                <div className="nh__ghost"><Clock size={28} /></div>
                <h3>No notifications found</h3>
                <p>{search || tab !== "ALL" ? "Try a different search or filter" : "Compose a new notification to get started"}</p>
              </div>
            ) : (
              <div className="nh__list">
                {statusFiltered.map(n => (
                  <div key={n.id} className="nh__item">
                    <div className="nh__row">
                      <div className="nh__cell">
                        <h4 className="nh__subject">{n.subject}</h4>
                        <p className="nh__recipient">{n.recipient}</p>
                      </div>
                      <StatusBadge status={n.status} />
                    </div>

                    <p className="nh__body">{n.body}</p>

                    <div className="nh__meta">
                      <div className="nh__meta__cell"><Calendar size={14} /><span>Created: {new Date(n.createdAt).toLocaleString()}</span></div>
                      {n.scheduledFor && <div className="nh__meta__cell"><Clock size={14} /><span>Scheduled: {new Date(n.scheduledFor).toLocaleString()}</span></div>}
                      {n.sentAt && <div className="nh__meta__cell"><Clock size={14} /><span>Sent: {new Date(n.sentAt).toLocaleString()}</span></div>}
                    </div>

                    <div className="nh__actions">
                      {n.status === "PENDING" ? (
                        <>
                          <button className="btn btn-primary" onClick={() => navigate(`/edit/${n.id}`)}><Edit size={16} /> Edit</button>
                          <button
                            className="btn btn-outline"
                            onClick={() => {
                              setRescheduleId(n.id);
                              setRescheduleTime(
                                (n.scheduledFor && new Date(n.scheduledFor).toISOString().slice(0, 16)) ||
                                new Date().toISOString().slice(0, 16)
                              );
                            }}
                          >
                            <Clock size={16} /> Reschedule
                          </button>
                          <button className="btn btn-outline nh__danger" onClick={() => doCancel(n.id)}><X size={16} /> Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-outline" onClick={() => doArchive(n.id)}><ArchiveIcon size={16} /> Archive</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {rescheduleId && (
        <div className="nh__modal__backdrop" onClick={() => setRescheduleId(null)}>
          <div className="nh__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reschedule Notification</h3>
            <p>Pick a new date and time</p>
            <input
              type="datetime-local"
              className="input"
              value={rescheduleTime}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setRescheduleTime(e.target.value)}
            />
            <div className="nh__modal__actions">
              <button className="btn btn-primary" onClick={saveReschedule}>Save</button>
              <button className="btn btn-outline" onClick={() => setRescheduleId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
