import { useEffect, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell, Send, History, Archive as ArchiveIcon,
  ArrowLeft, ArrowRight, TrendingUp,
  CheckCircle, Clock, AlertCircle, Zap, Home as HomeIcon
} from "lucide-react";
import { toast } from "sonner";
import "./NotificationHome.css";
import { listActive, listArchived } from "../api/notifications"; // <- same path you use elsewhere

// helpers
const getTs = (n) =>
  new Date(
    n?.sentAt || n?.sendAtUtc || n?.updatedAt || n?.createdAt || Date.now()
  ).getTime();

const relTime = (t) => {
  const diff = Date.now() - t;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

export default function NotificationHome() {
  const [isScrolled, setIsScrolled] = useState(false);

  // keep gradient on body while mounted (prevents the “white split”)
  useEffect(() => {
    document.body.classList.add("nh-body-bg");
    return () => document.body.classList.remove("nh-body-bg");
  }, []);

  // REAL data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sent: 0,
    scheduled: 0,
    failed: 0,
    archived: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [active, archived] = await Promise.all([
          listActive(),   // non-archived: SENT / PENDING / FAILED etc.
          listArchived(), // archived list for count
        ]);

        // count by status (be forgiving about backend field names)
        const counts = active.reduce(
          (acc, n) => {
            const s = String(n.status || n.state || "").toUpperCase();
            if (s === "SENT") acc.sent++;
            else if (s === "PENDING" || s === "SCHEDULED") acc.scheduled++;
            else if (s === "FAILED" || s === "ERROR") acc.failed++;
            return acc;
          },
          { sent: 0, scheduled: 0, failed: 0 }
        );

        setStats({
          ...counts,
          archived: Array.isArray(archived) ? archived.length : 0,
        });

        // recent activity: latest 6 items from active, sorted by timestamp
        const recent = [...active]
          .sort((a, b) => getTs(b) - getTs(a))
          .slice(0, 6)
          .map((n) => ({
            id: n.id,
            subject: n.subject || "(no subject)",
            status: String(n.status || n.state || "PENDING").toUpperCase(),
            time: relTime(getTs(n)),
            recipient:
              n.recipient ||
              (Array.isArray(n.recipients) ? n.recipients.join(", ") : "—"),
          }));
        setRecentActivity(recent);
      } catch (e) {
        console.error(e);
        toast.error(e?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <div className="nh-stat-card">
      <div className="nh-stat-icon" style={{ background: color }}>
        <Icon size={24} />
      </div>
      <div className="nh-stat-content">
        <div className="nh-stat-value">
          {Number(value || 0).toLocaleString()}
        </div>
        <div className="nh-stat-label">{label}</div>
        {trend && (
          <div className="nh-stat-trend">
            <TrendingUp size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, to, color }) => (
    <NavLink to={to} className="nh-qa">
      <div className="nh-qa-icon" style={{ background: color }}>
        <Icon size={20} />
      </div>
      <div className="nh-qa-content">
        <h4 className="nh-qa-title">{title}</h4>
        <p className="nh-qa-desc">{description}</p>
      </div>
      <ArrowRight className="nh-qa-arrow" size={20} />
    </NavLink>
  );

  const ActivityItem = ({ subject, status, time, recipient }) => {
    const s = String(status).toLowerCase();
    return (
      <div className="nh-activity-item">
        <div className="nh-activity-left">
          <div className={`nh-activity-status ${s}`}>
            {status === "SENT" ? (
              <CheckCircle size={16} />
            ) : status === "FAILED" ? (
              <AlertCircle size={16} />
            ) : (
              <Clock size={16} />
            )}
          </div>
          <div className="nh-activity-info">
            <h5 className="nh-activity-subject">{subject}</h5>
            <p className="nh-activity-meta">
              <span>{recipient}</span>
              <span className="nh-dot">•</span>
              <span>{time}</span>
            </p>
          </div>
        </div>
        <span className={`nh-badge nh-badge-${s}`}>{status}</span>
      </div>
    );
  };

  return (
    <div className="nh-home">
      {/* Top Nav */}
      <nav
        className={`nh-top-nav ${isScrolled ? "scrolled" : ""}`}
        role="navigation"
        aria-label="Notifications Navigation"
      >
        <div className="nh-nav-content">
          <div className="nh-nav-brand">
            <div className="nh-nav-logo">
              <Bell className="nh-i" />
            </div>
            <span className="nh-nav-title">Notification Center</span>
          </div>

          <div className="nh-nav-links">
            <NavLink
              to="/admin/notifications"
              end
              className={({ isActive }) =>
                `nh-nav-link ${isActive ? "is-active" : ""}`
              }
            >
              <HomeIcon className="nh-i sm" />
              <span className="nh-nav-link-text">Home</span>
            </NavLink>
            <NavLink
              to="/admin/notifications/compose"
              className={({ isActive }) =>
                `nh-nav-link ${isActive ? "is-active" : ""}`
              }
            >
              <Send className="nh-i sm" />
              <span className="nh-nav-link-text">Compose</span>
            </NavLink>
            <NavLink
              to="/admin/notifications/history"
              className={({ isActive }) =>
                `nh-nav-link ${isActive ? "is-active" : ""}`
              }
            >
              <History className="nh-i sm" />
              <span className="nh-nav-link-text">History</span>
            </NavLink>
            <NavLink
              to="/admin/notifications/archived"
              className={({ isActive }) =>
                `nh-nav-link ${isActive ? "is-active" : ""}`
              }
            >
              <ArchiveIcon className="nh-i sm" />
              <span className="nh-nav-link-text">Archived</span>
            </NavLink>
          </div>

          <button
            type="button"
            className="nh-nav-back"
            onClick={backToDashboard}
          >
            <ArrowLeft className="nh-i sm" /> <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="nh-hero">
        <div className="nh-hero-inner">
          <div className="nh-hero-badge">
            <Zap size={16} />
            <span>Powered by real-time delivery</span>
          </div>
          <h1 className="nh-hero-title">
            Manage Your Notifications{" "}
            <span className="nh-gradient-text">With Ease</span>
          </h1>
          <p className="nh-hero-desc">
            Send, schedule, and track all your notifications from one powerful
            dashboard.
          </p>
          <div className="nh-hero-actions">
            <NavLink to="/admin/notifications/compose" className="nh-btn nh-btn-primary">
              <Send size={20} />
              <span>Compose Message</span>
            </NavLink>
            <NavLink to="/admin/notifications/history" className="nh-btn nh-btn-ghost">
              <span>View History</span>
              <ArrowRight size={20} />
            </NavLink>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="nh-stats">
        <div className="nh-stats-grid">
          <StatCard
            icon={CheckCircle}
            label="Total Sent"
            value={stats.sent}
            color="linear-gradient(135deg,#10b981,#059669)"
            trend="+12% this week"
          />
          <StatCard
            icon={Clock}
            label="Scheduled"
            value={stats.scheduled}
            color="linear-gradient(135deg,#f59e0b,#d97706)"
          />
          <StatCard
            icon={AlertCircle}
            label="Failed"
            value={stats.failed}
            color="linear-gradient(135deg,#ef4444,#dc2626)"
          />
          <StatCard
            icon={ArchiveIcon}
            label="Archived"
            value={stats.archived}
            color="linear-gradient(135deg,#6366f1,#4f46e5)"
          />
        </div>
      </section>

      {/* Main */}
      <main className="nh-main">
        <section className="nh-card">
          <div className="nh-card-head">
            <h3 className="nh-card-title">Quick Actions</h3>
          </div>
          <div className="nh-qa-grid">
            <QuickAction
              icon={Send}
              title="Compose"
              description="Create and send a new notification"
              to="/admin/notifications/compose"
              color="linear-gradient(135deg,#3b82f6,#2563eb)"
            />
            <QuickAction
              icon={History}
              title="History"
              description="View all sent and scheduled notifications"
              to="/admin/notifications/history"
              color="linear-gradient(135deg,#8b5cf6,#7c3aed)"
            />
            <QuickAction
              icon={ArchiveIcon}
              title="Archived"
              description="Browse archived notifications"
              to="/admin/notifications/archived"
              color="linear-gradient(135deg,#64748b,#475569)"
            />
          </div>
        </section>

        <section className="nh-card">
          <div className="nh-card-head">
            <h3 className="nh-card-title">Recent Activity</h3>
            <NavLink to="/admin/notifications/history" className="nh-link">
              View all <ArrowRight size={16} />
            </NavLink>
          </div>
          <div className="nh-activity-list">
            {loading ? (
              <div className="nh-activity-item">
                <div>Loading…</div>
              </div>
            ) : recentActivity.length ? (
              recentActivity.map((it) => <ActivityItem key={it.id} {...it} />)
            ) : (
              <div className="nh-activity-item">
                <div>No recent activity.</div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
