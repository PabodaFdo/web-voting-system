import { Link, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./AdminHome.css";
import { getAdminStats } from "../api";

/* ========== Landing-style dark-chip Toast ========== */
function useToast() {
  const [toast, setToast] = useState(null); // {message, kind}
  const show = useCallback((message, kind = "info", ms = 3000) => {
    setToast({ message, kind });
    if (ms > 0) {
      const t = setTimeout(() => setToast(null), ms);
      return () => clearTimeout(t);
    }
  }, []);
  const close = useCallback(() => setToast(null), []);
  return { toast, show, close };
}

function Toast({ toast, onClose }) {
  if (!toast?.message) return null;
  const klass =
    toast.kind === "success" ? "toast toast--success" :
    toast.kind === "error"   ? "toast toast--error"   :
                               "toast toast--info";
  return (
    <div className="toast-area">
      <div className={klass} role="status" aria-live="polite" onClick={onClose}>
        <span aria-hidden="true">✓</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

/* ---- Inline SVG icons - Updated to match other pages ---- */
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

/* ---- Glassy Admin header (same size as Results) ---- */
function AdminHeader({ onLogout }) {
  const linkCls = "subnav-link";
  return (
    <nav className="subnav" role="navigation" aria-label="Admin Navigation">
      <div className="subnav__inner">
        <div className="subnav__brand">
          <div className="subnav__logo"><Icon.Star /></div>
          <span className="subnav__title">Voting Admin</span>
        </div>

        <div className="subnav__links">
          <NavLink to="/admin" end className={linkCls} title="Home">
            <Icon.Home style={{ display: 'block' }} /><span className="subnav__text">Home</span>
          </NavLink>
          <NavLink to="/admin/dashboard" className={linkCls} title="Dashboard">
            <Icon.Dashboard style={{ display: 'block' }} /><span className="subnav__text">Dashboard</span>
          </NavLink>
          <NavLink to="/admin/results-analytics" className={linkCls} title="Analytics">
            <Icon.Chart style={{ display: 'block' }} /><span className="subnav__text">Analytics</span>
          </NavLink>
          <NavLink to="/admin/results" className={linkCls} title="Results">
            <Icon.Award style={{ display: 'block' }} /><span className="subnav__text">Publish Winners</span>
          </NavLink>
          <NavLink to="/admin/students" className={linkCls} title="Students">
            <Icon.User style={{ display: 'block' }} /><span className="subnav__text">Students</span>
          </NavLink>
        </div>

        <button type="button" className="subnav__logout" onClick={onLogout} title="Logout">
          <Icon.ArrowLeft style={{ display: 'block' }} /> Logout
        </button>
      </div>
    </nav>
  );
}

export default function AdminHome({ onLogout }) {
  const { toast, show, close } = useToast();

  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("admin_auth") || "null"); }
    catch { return null; }
  }, []);

  const user = {
    username: auth?.username || "admin",
    role: auth?.role || "ADMIN",
  };

  const [stats, setStats] = useState({ categories: 0, nominees: 0, votes: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const errorShownRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAdminStats();
        if (!mounted) return;
        setStats({
          categories: Number(data?.categories || 0),
          nominees: Number(data?.nominees || 0),
          votes: Number(data?.votes || 0),
        });
      } catch {
        if (!errorShownRef.current) {
          show("Couldn't load summary stats", "error");
          errorShownRef.current = true;
        }
      } finally {
        if (mounted) setStatsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [show]);

  // one-shot welcome
  useEffect(() => {
    if (sessionStorage.getItem("admin_toast") === "1") {
      show(`Welcome back, ${user.username}!`, "success");
      sessionStorage.removeItem("admin_toast");
    }
  }, [show, user.username]);

  const fmt = (n) => (statsLoading ? "—" : Number(n || 0).toLocaleString());

  return (
    <div className="admin-home">
      <AdminHeader onLogout={onLogout} />

      {/* Landing-style dark toast */}
      <Toast toast={toast} onClose={close} />

      {/* Hero */}
      <section className="admin-home__hero">
        <div className="admin-home__welcome">
          <h1 className="admin-home__title">
            Welcome, <span className="admin-home__username">{user.username}</span>
          </h1>
          <p className="admin-home__subtitle">
            Manage categories, nominees, notifications, and view results — all in one place.
          </p>
          <div className="admin-home__user-badge">
            <span className="admin-home__role-icon">🛡️</span>
            {user.role}
          </div>
        </div>

        <div className="admin-home__stats">
          <div className="admin-home__stat-card">
            <div className="admin-home__stat-icon">📁</div>
            <div className="admin-home__stat-number">{fmt(stats.categories)}</div>
            <div className="admin-home__stat-label">Categories</div>
          </div>
          <div className="admin-home__stat-card">
            <div className="admin-home__stat-icon">👤</div>
            <div className="admin-home__stat-number">{fmt(stats.nominees)}</div>
            <div className="admin-home__stat-label">Nominees</div>
          </div>
          <div className="admin-home__stat-card">
            <div className="admin-home__stat-icon">🗳️</div>
            <div className="admin-home__stat-number">{fmt(stats.votes)}</div>
            <div className="admin-home__stat-label">Votes</div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="admin-home__links">
        <div className="admin-home__section-header">
          <h2 className="admin-home__section-title">
            <span className="admin-home__section-icon">⚡</span> Quick Actions
          </h2>
          <p className="admin-home__section-subtitle">
            Jump straight to the most common tasks.
          </p>
        </div>

        <div className="admin-home__links-grid">
          <div className="admin-home__link-card">
            <div className="admin-home__link-header">
              <div className="admin-home__link-icon">👥</div>
            </div>
            <h3 className="admin-home__link-title">Manage Students</h3>
            <p className="admin-home__link-description">
              Approve, deactivate, or view student profiles and requests.
            </p>
            <Link to="/admin/students" className="admin-home__link-button">
              Open Students <span className="admin-home__link-arrow">→</span>
            </Link>
          </div>

          <div className="admin-home__link-card">
            <div className="admin-home__link-header">
              <div className="admin-home__link-icon">🏆</div>
            </div>
            <h3 className="admin-home__link-title">Nominees</h3>
            <p className="admin-home__link-description">
              Add or review nominees across categories.
            </p>
            <Link to="/admin/nominees" className="admin-home__link-button">
              Manage Nominees <span className="admin-home__link-arrow">→</span>
            </Link>
          </div>

          <div className="admin-home__link-card">
            <div className="admin-home__link-header">
              <div className="admin-home__link-icon">📧</div>
            </div>
            <h3 className="admin-home__link-title">Notification Management</h3>
            <p className="admin-home__link-description">
              Manage notifications and reminders.
            </p>
            <Link to="/admin/notifications" className="admin-home__link-button">
              Open Notifications <span className="admin-home__link-arrow">→</span>
            </Link>
          </div>

          <div className="admin-home__link-card">
            <div className="admin-home__link-header">
              <div className="admin-home__link-icon">📊</div>
            </div>
            <h3 className="admin-home__link-title">Dashboard</h3>
            <p className="admin-home__link-description">Live voting overview and metrics.</p>
            <Link to="/admin/dashboard" className="admin-home__link-button">
              View Dashboard <span className="admin-home__link-arrow">→</span>
            </Link>
          </div>

          <div className="admin-home__link-card">
            <div className="admin-home__link-header">
              <div className="admin-home__link-icon">📈</div>
            </div>
            <h3 className="admin-home__link-title">Results Analytics</h3>
            <p className="admin-home__link-description">
              View comprehensive voting analytics and reports.
            </p>
            <Link to="/admin/results-analytics" className="admin-home__link-button">
              View Analytics <span className="admin-home__link-arrow">→</span>
            </Link>
          </div>

          <div className="admin-home__link-card">
            <div className="admin-home__link-header">
              <div className="admin-home__link-icon">🏅</div>
            </div>
            <h3 className="admin-home__link-title">Publish Winners</h3>
            <p className="admin-home__link-description">
              Check current standings and final results.
            </p>
            <Link to="/admin/results" className="admin-home__link-button">
              See Results <span className="admin-home__link-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="admin-home__activity-card">
          <div className="admin-home__section-header">
            <h2 className="admin-home__section-title">
              <span className="admin-home__section-icon">📜</span> Recent Activity
            </h2>
            <p className="admin-home__section-subtitle">
              Latest changes made by admins and organizers.
            </p>
          </div>

          <div className="admin-home__activity-list">
            <div className="admin-home__activity-item">
              <div className="admin-home__activity-icon">✅</div>
              <div className="admin-home__activity-content">
                <p className="admin-home__activity-text">12 student accounts approved</p>
                <span className="admin-home__activity-time">Just now</span>
              </div>
            </div>
            <div className="admin-home__activity-item">
              <div className="admin-home__activity-icon">🏷️</div>
              <div className="admin-home__activity-content">
                <p className="admin-home__activity-text">Created category "Best Community Impact"</p>
                <span className="admin-home__activity-time">1 hour ago</span>
              </div>
            </div>
            <div className="admin-home__activity-item">
              <div className="admin-home__activity-content">
                <p className="admin-home__activity-text">5 new nominees added to "Best Performance"</p>
                <span className="admin-home__activity-time">3 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}