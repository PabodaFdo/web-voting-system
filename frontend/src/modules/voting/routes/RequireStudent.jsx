import { Navigate, useLocation } from "react-router-dom";

function readAuth() {
  try { return JSON.parse(localStorage.getItem("auth") || "null"); }
  catch { return null; }
}

export default function RequireStudent({ children }) {
  const loc = useLocation();
  const auth = readAuth();

  // accept token in either token or accessToken
  const hasToken = !!(auth?.token || auth?.accessToken);

  // accept role in multiple places/shapes
  const rawRole =
    auth?.role ??
    auth?.user?.role ??
    (Array.isArray(auth?.roles) ? auth.roles[0] : null);

  const role = rawRole ? String(rawRole).toUpperCase() : null;

  if (!hasToken || role !== "STUDENT") {
    // rejected -> go home (or login bridge), remember where user wanted to go
    return <Navigate to="/" replace state={{ from: loc }} />;
  }
  return children;
}
