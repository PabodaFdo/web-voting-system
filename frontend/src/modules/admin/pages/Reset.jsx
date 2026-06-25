import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "../api";
import "./Reset.css";

export default function Reset() {
  const nav = useNavigate();
  const { search } = useLocation();
  const presetId = useMemo(() => new URLSearchParams(search).get("identifier") || "", [search]);

  const [identifier, setIdentifier] = useState(presetId);
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [conf, setConf] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const canSubmit = identifier && otp && pw && pw === conf && !loading;

  async function submit(e) {
    e.preventDefault();
    setErr(""); 
    setMsg(""); 
    setLoading(true);
    try {
      await confirmPasswordReset({ 
        identifier: identifier.trim(), 
        otp: otp.trim(), 
        newPassword: pw 
      });
      setMsg("Password updated successfully! Redirecting to login…");
      setTimeout(() => nav("/login", { replace: true }), 1200);
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-hero">
      <div className="reset-wrap">
        {/* Mobile Header */}
        <div className="reset-mobile-header">
          <div className="reset-mobile-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h1 className="reset-mobile-title">UniLearn</h1>
          </div>
          <p className="reset-mobile-subtitle">Student Learning Platform</p>
        </div>

        {/* Back to Login Button */}
        <Link to="/login" className="reset-home-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
          </svg>
          Back to login
        </Link>

        {/* Reset Card */}
        <section className="reset-card">
          <div className="reset-card-header">
            <div className="reset-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="reset-card-title">Reset Your Password</h2>
            <p className="reset-card-description">
              Enter the 6-digit code sent to your email and create a new password.
            </p>
          </div>

          {/* Success Message */}
          {msg && (
            <div className="reset-alert reset-alert--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {msg}
            </div>
          )}

          {/* Error Message */}
          {err && (
            <div className="reset-alert reset-alert--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {err}
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={submit} className="reset-form">
            <label className="reset-field">
              <span className="reset-label">Student Email or ID</span>
              <div className="reset-input-container">
                <svg className="reset-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  className="reset-input reset-input-with-icon"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g., it2410ab12 or student@uni.edu"
                  required
                />
              </div>
            </label>

            <label className="reset-field">
              <span className="reset-label">6-Digit Verification Code</span>
              <div className="reset-input-container">
                <svg className="reset-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <input
                  className="reset-input reset-input-with-icon"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ""))}
                  placeholder="123456"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  required
                />
              </div>
              <span className="reset-field-hint">Check your email for the code</span>
            </label>

            <label className="reset-field">
              <span className="reset-label">New Password</span>
              <div className="reset-input-container">
                <svg className="reset-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  className="reset-input reset-input-with-icon reset-input-with-eye"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reset-eye-btn"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <span className="reset-field-hint">Must be at least 8 characters</span>
            </label>

            <label className="reset-field">
              <span className="reset-label">Confirm New Password</span>
              <div className="reset-input-container">
                <svg className="reset-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  className="reset-input reset-input-with-icon reset-input-with-eye"
                  type={showConf ? "text" : "password"}
                  value={conf}
                  onChange={(e) => setConf(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reset-eye-btn"
                  onClick={() => setShowConf(v => !v)}
                  aria-label={showConf ? "Hide confirmation" : "Show confirmation"}
                  title={showConf ? "Hide confirmation" : "Show confirmation"}
                >
                  {showConf ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {pw && conf && pw !== conf && (
                <span className="reset-field-error">Passwords do not match</span>
              )}
            </label>

            <button className="reset-btn" disabled={!canSubmit}>
              {loading ? (
                <div className="reset-loading">
                  <div className="reset-spin"></div>
                  Updating Password...
                </div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Update Password
                </>
              )}
            </button>

            <div className="reset-divider">
              <span>or</span>
            </div>

            <div className="reset-links">
              <Link to="/login" className="reset-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Back to Login
              </Link>
              <Link to="/forgot" className="reset-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Resend Code
              </Link>
            </div>
          </form>
        </section>

        {/* Security Badge */}
        <div className="reset-security">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>256-bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}