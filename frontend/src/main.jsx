import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";

import { AuthProvider } from "./modules/admin/AuthContext.jsx";

const Landing = lazy(() => import("./modules/admin/pages/Landing.jsx"));
const PublicHome = lazy(() => import("./modules/admin/pages/PublicHome.jsx"));
const PublicEvent = lazy(() => import("./modules/admin/pages/PublicEvent.jsx"));
const Login = lazy(() => import("./modules/admin/pages/Login.jsx"));
const Forgot = lazy(() => import("./modules/admin/pages/Forgot.jsx"));
const Reset = lazy(() => import("./modules/admin/pages/Reset.jsx"));
const ITC = lazy(() => import("./modules/admin/pages/ITC.jsx"));
const AdminApp = lazy(() => import("./modules/admin/App.jsx"));
const Bridge = lazy(() => import("./modules/voting/pages/Bridge.jsx"));
const VotingHome = lazy(() => import("./modules/voting/pages/VotingHome.jsx"));
const EventVote = lazy(() => import("./modules/voting/pages/EventVote.jsx"));
const MyVote = lazy(() => import("./modules/voting/pages/MyVote.jsx"));

import "./index.css";
import "./modules/admin/index.css";
import "./modules/voting/index.css";
import "./modules/nominee/index.css";
import "./modules/notifications/index.css";
import "./modules/results/index.css";
import "./modules/dashboard/index.css";

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      Loading...
    </div>
  );
}

function readStudentAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

function RequireStudent({ children }) {
  const loc = useLocation();
  const auth = readStudentAuth();
  const hasToken = !!(auth?.token || auth?.accessToken);
  const rawRole =
    auth?.role ??
    auth?.user?.role ??
    (Array.isArray(auth?.roles) ? auth.roles[0] : null);
  const role = rawRole ? String(rawRole).replace(/^ROLE_/, "").toUpperCase() : null;

  if (!hasToken || role !== "STUDENT") {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }

  return children;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/events" element={<PublicHome />} />
            <Route path="/e/:eventId" element={<PublicEvent />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Navigate to="/login?tab=signup" replace />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/itc" element={<ITC />} />

            <Route path="/bridge" element={<Bridge />} />
            <Route
              path="/voting"
              element={
                <RequireStudent>
                  <VotingHome />
                </RequireStudent>
              }
            />
            <Route
              path="/voting/events/:eventId"
              element={
                <RequireStudent>
                  <EventVote />
                </RequireStudent>
              }
            />
            <Route
              path="/my-vote"
              element={
                <RequireStudent>
                  <MyVote />
                </RequireStudent>
              }
            />

            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
