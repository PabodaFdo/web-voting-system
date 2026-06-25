import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Bridge.css";

export default function Bridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const token = qs.get("token");
    const role = qs.get("role");
    const username = qs.get("username");
    const next = qs.get("next") || "/voting";

    if (!token || !role) {
      navigate("/login?e=missing_token", { replace: true });
      return;
    }

    // persist auth
    localStorage.setItem("auth", JSON.stringify({ token, role, username }));

    // ---- toast handoff (from Login app) ----
    const toast = qs.get("toast"); // "login" | "logout" | null
    const msg = qs.get("msg");

    // also set same-origin one-shot toast as a fallback
    if (toast) {
      try {
        const defaultMsg =
          toast === "login"
            ? "Logged in successfully."
            : toast === "logout"
            ? "Logged out successfully."
            : "Done.";
        sessionStorage.setItem(
          "nav_toast",
          JSON.stringify({ ts: Date.now(), kind: "success", message: msg || defaultMsg })
        );
      } catch {}
    }

    // build next path and forward toast via query so /voting can read it immediately
    let nextPath = next || "/voting";
    if (toast) {
      const extra = new URLSearchParams();
      extra.set("toast", toast);
      if (msg) extra.set("msg", msg);
      nextPath += (nextPath.includes("?") ? "&" : "?") + extra.toString();
    }

    navigate(nextPath, { replace: true });
  }, [qs, navigate]);

  return (
    <div className="bridge-page">
      <section className="bridge-card" role="status" aria-live="polite">
        <div className="bridge-card__spinner" />
        <h2>Signing you in...</h2>
        <p>Transferring session from admin login.</p>
      </section>
    </div>
  );
}
