import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useMemo, useCallback } from "react";
import AdminHome from "./pages/AdminHome.jsx";
import Students from "./pages/Students.jsx";
import Forgot from "./pages/Forgot.jsx";
import Reset from "./pages/Reset.jsx";

const DashboardApp = lazy(() => import("../dashboard/App.jsx"));
const NomineeApp = lazy(() => import("../nominee/App.jsx"));
const NotificationsApp = lazy(() => import("../notifications/App.jsx"));
const ResultsApp = lazy(() => import("../results/App.jsx"));

function AdminRouteFallback() {
  return <div className="admin-route-fallback">Loading workspace...</div>;
}

export default function App() {
  const loc = useLocation();
  const isAdminPath = loc.pathname.startsWith("/admin"); 

  const isAuthed = useMemo(() => {
    try {
      const v = JSON.parse(localStorage.getItem("admin_auth") || "null");
      return !!(v && v.token);
    } catch {
      return false;
    }
  }, []);

  const handleLogout = useCallback(() => {
    ["admin_auth", "token", "accessToken", "refreshToken", "role", "user"].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    try {
      sessionStorage.setItem(
        "nav_toast",
        JSON.stringify({ ts: Date.now(), kind: "success", message: "Logged out successfully." })
      );
    } catch {}
    const dest = new URL("/", window.location.origin);
    dest.searchParams.set("toast", "logout");
    dest.searchParams.set("msg", "Logged out successfully.");
    window.location.replace(dest.toString());
  }, []);

  if (isAdminPath && !isAuthed) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`}
        replace
      />
    );
  }

  return (
    <div className="app">
      <main className="app-main">
        <div className="app-main__container">
          <Suspense fallback={<AdminRouteFallback />}>
            <Routes>
              <Route index element={<AdminHome onLogout={handleLogout} />} />
              <Route path="students" element={<Students onLogout={handleLogout} />} />
              <Route path="nominees/*" element={<NomineeApp />} />
              <Route path="notifications/*" element={<NotificationsApp />} />
              <Route path="dashboard" element={<DashboardApp />} />
              <Route path="results-analytics" element={<Navigate to="/admin/results/analytics" replace />} />
              <Route path="results/*" element={<ResultsApp />} />

              {/* Absolute paths kept */}
              <Route path="/forgot" element={<Forgot />} />
              <Route path="/reset" element={<Reset />} />

              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
