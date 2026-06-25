import { useEffect, useState } from "react";
import { api } from "./api";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const token = qs.get("token");
    if (token) {
      sessionStorage.setItem("admin_jwt", token);
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", clean);
    }
    const t = sessionStorage.getItem("admin_jwt");
    if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
    setReady(true);
  }, []);

  if (!ready) return null;
  return <Dashboard />;
}
