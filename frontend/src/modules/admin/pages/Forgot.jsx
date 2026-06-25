import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestResetOtp } from "../api";
import "./Forgot.css";

export default function Forgot() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(""); 
    setMsg(""); 
    setLoading(true);
    try {
      await requestResetOtp(id.trim());
      setMsg("If an account exists, a reset code has been sent to your email.");
      // carry identifier to the reset screen
      setTimeout(() => nav(`/reset?identifier=${encodeURIComponent(id.trim())}`), 1200);
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-hero">
      <div className="forgot-wrap">
        {/* Mobile Header */}
        <div className="forgot-mobile-header">
          <div className="forgot-mobile-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h1 className="forgot-mobile-title">UniLearn</h1>
          </div>
          <p className="forgot-mobile-subtitle">Student Learning Platform</p>
        </div>

        {/* Back to Login Button */}
        <Link to="/login" className="forgot-home-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
          </svg>
          Back to login
        </Link>

        {/* Forgot Password Card */}
        <section className="forgot-card">
          <div className="forgot-card-header">
            <div className="forgot-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="forgot-card-title">Forgot Your Password?</h2>
            <p className="forgot-card-description">
              No worries! Enter your student email or ID and we'll send you a 6-digit verification code.
            </p>
          </div>

          {/* Success Message */}
          {msg && (
            <div className="forgot-alert forgot-alert--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {msg}
            </div>
          )}

          {/* Error Message */}
          {err && (
            <div className="forgot-alert forgot-alert--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {err}
            </div>
          )}

          {/* Forgot Form */}
          <form onSubmit={submit} className="forgot-form">
            <label className="forgot-field">
              <span className="forgot-label">Student Email or ID</span>
              <div className="forgot-input-container">
                <svg className="forgot-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  className="forgot-input forgot-input-with-icon"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g., it2410ab12 or student@uni.edu"
                  required
                  autoFocus
                />
              </div>
              <span className="forgot-field-hint">We'll send a verification code to your registered email</span>
            </label>

            <button className="forgot-btn" disabled={loading || !id.trim()}>
              {loading ? (
                <div className="forgot-loading">
                  <div className="forgot-spin"></div>
                  Sending Code...
                </div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Reset Code
                </>
              )}
            </button>

            <div className="forgot-divider">
              <span>or</span>
            </div>

            <Link to="/login" className="forgot-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Back to Login
            </Link>
          </form>

          {/* Info Box */}
          <div className="forgot-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong>Need help?</strong>
              <p>If you don't receive the code within a few minutes, check your spam folder or contact support.</p>
            </div>
          </div>
        </section>

        {/* Security Badge */}
        <div className="forgot-security">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Secure Password Recovery</span>
        </div>
      </div>
    </div>
  );
}