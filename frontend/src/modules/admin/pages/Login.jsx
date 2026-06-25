import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login, publicRegisterStudent } from "../api.js";
import "./Login.css";

/* ---------- role helpers ---------- */
function pickRole(data) {
  if (data?.role) return data.role;
  if (Array.isArray(data?.roles) && data.roles.length) return data.roles[0];
  return "USER";
}
function isAdminRole(role) { return role === "ADMIN" || role === "ROLE_ADMIN"; }
function isOrganizerRole(role) { return role === "ORGANIZER" || role === "ROLE_ORGANIZER"; }
function isStudentRole(role) { return role === "STUDENT" || role === "ROLE_STUDENT"; }
function isItcRole(role) {
  return (
    role === "IT_COORDINATOR" ||
    role === "ROLE_IT_COORDINATOR" ||
    role === "ITC" ||
    role === "ROLE_ITC"
  );
}

const VOTING_URL = import.meta.env.VITE_VOTING_URL || window.location.origin;

/* Icons */
const IconVote = (p) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
    <path fill="currentColor" d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66a.996.996 0 0 0 0 1.41l11.46 11.46a.996.996 0 0 0 1.41 0l5.45-5.45a.996.996 0 0 0 0-1.41L14.16 2.29a.975.975 0 0 0-1.4-.01z"/>
  </svg>
);

const IconMail = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/>
  </svg>
);

const IconLock = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 8.73V16a1 1 0 1 1 2 0v.73a1.5 1.5 0 1 1-2 0ZM9 8V6a3 3 0 1 1 6 0v2H9Z"/>
  </svg>
);

const IconUser = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"/>
  </svg>
);

const IconShield = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.74 8 11 4.6-1.26 8-6 8-11V5l-8-3Z"/>
  </svg>
);

const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path fill="currentColor" d="m9 16.17-3.88-3.88L3.7 13.7 9 19l12-12-1.41-1.41L9 16.17Z"/>
  </svg>
);

const IconAward = (p) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
    <path fill="currentColor" d="M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4 12.9a8 8 0 1 1-8 0L6 22l6-2 6 2-2-7.1Z"/>
  </svg>
);

const Eye = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
  </svg>
);

const EyeOff = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
    <path fill="currentColor" d="M3 4.27 4.28 3 21 19.72 19.73 21l-2.3-2.3A10.8 10.8 0 0 1 12 19c-5 0-9-4.5-9-7a9.94 9.94 0 0 1 4.27-6.73L3 4.27Zm6.11 6.11A4.02 4.02 0 0 0 8 12a4 4 0 0 0 6.9 2.82l-5.79-5.44ZM12 5c5 0 9 4.5 9 7 0 1.02-.47 2.19-1.27 3.32L17.9 13.5A4 4 0 0 0 12 8c-.53 0-1.04.1-1.5.28L8.4 6.35C9.4 5.5 10.65 5 12 5Z"/>
  </svg>
);

const HomeIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

/* ---------- Toast System ---------- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  function show(message, type = "info") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }
  function dismiss(id) { setToasts((t) => t.filter((x) => x.id !== id)); }
  return { toasts, show, dismiss };
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const startTab = new URLSearchParams(loc.search).get("tab") === "signup" ? "signup" : "login";

  /* clear any stale cross-route toast on entry */
  useEffect(() => {
    try { sessionStorage.removeItem("nav_toast"); } catch { /* empty */ }
  }, []);

  /* ---------- shared ---------- */
  const [activeTab, setActiveTab] = useState(startTab);
  const [loading, setLoading] = useState(false);

  /* ---------- login state ---------- */
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  /* ---------- signup state ---------- */
  const [idx, setIdx] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [spwd, setSpwd] = useState("");
  const [scp, setScp] = useState("");
  const [gender, setGender] = useState("PREFER NOT TO SAY");
  const [sErr, setSErr] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSpwd, setShowSpwd] = useState(false);
  const [showScp, setShowScp] = useState(false);
  const [touched, setTouched] = useState({});
  const { toasts, show: toast, dismiss } = useToast();

  /* ---------- validators ---------- */
  const isEmail = (s) => /\S+@\S+\.\S+/.test(String(s || "").trim());
  const strongPwd = (s) => (s || "").length >= 6;
  const idxOk = (s) => /^it[0-9]{4}[A-Za-z0-9_]{4}$/i.test(String(s || "").trim());

  const validations = {
    indexNo:
      !idx && touched.indexNo ? "Index number is required." :
      idx && !idxOk(idx) ? "Index must be IT/it + 4 digits + 4 letters/digits/_." : "",
    fullName:
      !fullName && touched.fullName ? "Full name is required." : "",
    email:
      !email && touched.email ? "Email is required." :
      email && !isEmail(email) ? "Please enter a valid email." : "",
    password:
      !spwd && touched.password ? "Password is required." :
      spwd && !strongPwd(spwd) ? "At least 6 characters." : "",
    confirm:
      !scp && touched.confirm ? "Please confirm password." :
      scp && scp !== spwd ? "Passwords do not match." : "",
  };
  const formInvalid = Object.values(validations).some(Boolean);

  /* ---------- handlers ---------- */
  async function handleLogin(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const data = await login(u, p);
      toast("Login successful. Redirectingâ€¦", "success");

      const role = pickRole(data);
      const payload = {
        token: data.token,
        username: data.username,
        role,
        roles: Array.isArray(data?.roles) ? data.roles : data.role ? [data.role] : [],
      };

      if (isAdminRole(role)) {
        localStorage.setItem("admin_auth", JSON.stringify(payload));
        sessionStorage.setItem("admin_toast", "1");
        nav("/admin", { replace: true });
      } else if (isOrganizerRole(role)) {
        localStorage.setItem("admin_auth", JSON.stringify(payload));
        nav("/admin/nominees", { replace: true });
      } else if (isItcRole(role)) {
        localStorage.setItem("admin_auth", JSON.stringify(payload));
        nav("/itc", { replace: true });
      } else if (isStudentRole(role)) {
        try {
          sessionStorage.setItem(
            "nav_toast",
            JSON.stringify({ ts: Date.now(), kind: "success", message: "Logged in successfully." })
          );
        } catch { /* empty */ }

        const url = new URL("/bridge", VOTING_URL);
        url.searchParams.set("toast", "login");
        url.searchParams.set("token", data.token || "");
        url.searchParams.set("role", role);
        url.searchParams.set("username", data.username || u);
        window.location.href = url.toString();
      } else {
        nav("/", { replace: true });
      }
    } catch {
      setErr("Invalid username or password");
      toast("Invalid username or password", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSErr("");
    setTouched({ indexNo: true, fullName: true, email: true, password: true, confirm: true });
    if (formInvalid) return;

    setLoading(true);
    try {
      await publicRegisterStudent({
        indexNo: idx.replace(/\s+/g, ""),
        fullName: fullName.trim(),
        email: email.trim(),
        password: spwd,
        gender,
      });
      setSubmitted(true);
      toast("Registration submitted. Await admin approval.", "success");
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2.message || "Registration failed";
      setSErr(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  // Determine container and card classes based on active tab
  const isSignup = activeTab === "signup";
  const containerClass = `login-forms-container ${isSignup ? "login-forms-container--expanded" : "login-forms-container--compact"}`;
  const cardClass = `login-card ${isSignup ? "login-card--expanded" : "login-card--compact"}`;
  const cardHeaderClass = `login-card-header ${isSignup ? "login-card-header--expanded" : "login-card-header--compact"}`;
  const formClass = `login-form ${isSignup ? "login-form--expanded" : "login-form--compact"}`;

  return (
    <div className="login-hero">
      {/* Toasts */}
      <div className="login-toast-area">
        {toasts.map((t) => (
          <div key={t.id} className={`login-toast login-toast--${t.type}`}>
            <span className="login-toast-dot" />
            <div className="login-toast-msg">{t.message}</div>
            <button className="login-toast-x" onClick={() => dismiss(t.id)} aria-label="Close">Ã—</button>
          </div>
        ))}
      </div>

      {/* Left Side - Branding with Security Features */}
      <div className="login-branding">
        <div className="login-branding-content">
          <div className="login-brand-header">
            <div className="login-brand-logo">
              <IconVote />
            </div>
            <div className="login-brand-text">
              <h1>Student Awards Portal</h1>
              <p>Secure Bright Future Voting Platform</p>
            </div>
          </div>
          
          <h2 className="login-brand-title">
            Your Voice<br />
            Shapes Our<br />
            <span className="login-brand-accent">Campus Future</span>
          </h2>
          
          <p className="login-brand-description">
            Join thousands of students making their voices heard through our secure, transparent campus voting system.
          </p>
          
          <div className="login-features">
            <div className="login-feature-item">
              <IconCheck />
              <span>End-to-end Encrypted Voting</span>
            </div>
            <div className="login-feature-item">
              <IconCheck />
              <span>Anonymous Ballot System</span>
            </div>
            <div className="login-feature-item">
              <IconCheck />
              <span>One Vote Per Student</span>
            </div>
            <div className="login-feature-item">
              <IconCheck />
              <span>Real-time Results</span>
            </div>
          </div>

          <div className="login-security-badge">
            <IconShield />
            <span>ISO 27001 Certified Security</span>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="login-forms">
        <div className={containerClass}>
          {/* Mobile header */}
          <div className="login-mobile-header">
            <div className="login-mobile-logo">
              <IconVote />
              <h1 className="login-mobile-title">Bright Future</h1>
            </div>
            <p className="login-mobile-subtitle">Student Portal</p>
          </div>

          {/* Back to Home Button */}
          <Link to="/" className="login-home-back">
            <HomeIcon />
            Back to Home
          </Link>

          {/* Tabs */}
          <div className="login-tabs">
            <div className="login-tablist">
              <button
                className={`login-tab ${activeTab === "login" ? "login-tab--active" : ""}`}
                onClick={() => setActiveTab("login")}
              >
                Sign In
              </button>
              <button
                className={`login-tab ${activeTab === "signup" ? "login-tab--active" : ""}`}
                onClick={() => setActiveTab("signup")}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" && (
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <div className="login-badge">
                    <IconAward />
                  </div>
                  <h3 className="login-card-title">Student Login</h3>
                  <p className="login-card-description">
                    Enter your credentials to access the voting portal
                  </p>
                </div>

                {err && <div className="login-alert">{err}</div>}
                
                <form onSubmit={handleLogin} className={formClass}>
                  <div className="login-field">
                    <label className="login-label">Student ID or Email</label>
                    <div className="login-input-container">
                      <IconMail className="login-input-icon" />
                      <input
                        className="login-input login-input-with-icon"
                        type="text"
                        placeholder="Enter your student ID or email"
                        value={u}
                        onChange={(e) => setU(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="login-field">
                    <label className="login-label">Password</label>
                    <div className="login-input-container">
                      <IconLock className="login-input-icon" />
                      <input
                        className="login-input login-input-with-icon login-input-with-eye"
                        type={showLoginPwd ? "text" : "password"}
                        placeholder="Enter your password"
                        value={p}
                        onChange={(e) => setP(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowLoginPwd(v => !v)}
                      >
                        {showLoginPwd ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <div className="login-forgot">
                    <Link to="/forgot">Forgot your password?</Link>
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? (
                      <span className="login-loading">
                        <span className="login-spin" /> Signing In...
                      </span>
                    ) : (
                      <>
                        <IconShield />
                        Access Voting Portal
                      </>
                    )}
                  </button>
                </form>

                <div className="login-switch">
                  <p>Don't have an account? <button onClick={() => setActiveTab("signup")}>Sign Up</button></p>
                </div>
              </div>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <div className={cardClass}>
                {submitted ? (
                  <div className="login-success-screen">
                    <div className="login-success-icon">âœ…</div>
                    <h3 className="login-success-title">Registration Submitted</h3>
                    <p className="login-success-text">
                      Please wait for admin approval. You'll be able to log in once your account is activated.
                    </p>
                    <button
                      type="button"
                      className="login-btn"
                      onClick={() => { setSubmitted(false); setActiveTab("login"); }}
                    >
                      Go to Login
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={cardHeaderClass}>
                      <div className="login-badge">
                        <IconUser />
                      </div>
                      <h3 className="login-card-title">Create Account</h3>
                      <p className="login-card-description">
                        Join the campus community and make your voice heard
                      </p>
                    </div>

                    {sErr && <div className="login-alert">{sErr}</div>}

                    <form onSubmit={handleSignup} className={formClass}>
                      <div className="login-field">
                        <label className="login-label">Index Number</label>
                        <div className="login-input-container">
                          <IconUser className="login-input-icon" />
                          <input
                            className={`login-input login-input-with-icon ${touched.indexNo && validations.indexNo ? "invalid" : ""}`}
                            placeholder="IT2410xxxx"
                            value={idx}
                            onChange={(e) => setIdx(e.target.value)}
                            onBlur={() => setTouched(t => ({ ...t, indexNo: true }))}
                            required
                          />
                        </div>
                        <div className="login-field-hint">
                          Format: IT2410xxxx (IT/it + 4 digits + 4 letters/digits/_)
                        </div>
                        {touched.indexNo && validations.indexNo && (
                          <div className="login-field-error">{validations.indexNo}</div>
                        )}
                      </div>

                      <div className="login-field">
                        <label className="login-label">Full Name</label>
                        <input
                          className={`login-input ${touched.fullName && validations.fullName ? "invalid" : ""}`}
                          placeholder="e.g., John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onBlur={() => setTouched(t => ({ ...t, fullName: true }))}
                          required
                        />
                        {touched.fullName && validations.fullName && (
                          <div className="login-field-error">{validations.fullName}</div>
                        )}
                      </div>

                      <div className="login-field">
                        <label className="login-label">University Email</label>
                        <div className="login-input-container">
                          <IconMail className="login-input-icon" />
                          <input
                            className={`login-input login-input-with-icon ${touched.email && validations.email ? "invalid" : ""}`}
                            type="email"
                            placeholder="your.email@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setTouched(t => ({ ...t, email: true }))}
                            required
                          />
                        </div>
                        {touched.email && validations.email && (
                          <div className="login-field-error">{validations.email}</div>
                        )}
                      </div>

                      <div className="login-field">
                        <label className="login-label">Gender</label>
                        <select
                          className="login-input"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="PREFER NOT TO SAY">Prefer not to say</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="login-field">
                        <label className="login-label">Password</label>
                        <div className="login-input-container">
                          <IconLock className="login-input-icon" />
                          <input
                            className={`login-input login-input-with-icon login-input-with-eye ${touched.password && validations.password ? "invalid" : ""}`}
                            type={showSpwd ? "text" : "password"}
                            placeholder="At least 6 characters"
                            value={spwd}
                            onChange={(e) => setSpwd(e.target.value)}
                            onBlur={() => setTouched(t => ({ ...t, password: true }))}
                            required
                          />
                          <button
                            type="button"
                            className="login-eye-btn"
                            aria-label="Toggle password visibility"
                            onClick={() => setShowSpwd(v => !v)}
                          >
                            {showSpwd ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                        {touched.password && validations.password && (
                          <div className="login-field-error">{validations.password}</div>
                        )}
                      </div>

                      <div className="login-field">
                        <label className="login-label">Confirm Password</label>
                        <div className="login-input-container">
                          <IconLock className="login-input-icon" />
                          <input
                            className={`login-input login-input-with-icon login-input-with-eye ${touched.confirm && validations.confirm ? "invalid" : ""}`}
                            type={showScp ? "text" : "password"}
                            placeholder="Re-enter password"
                            value={scp}
                            onChange={(e) => setScp(e.target.value)}
                            onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                            required
                          />
                          <button
                            type="button"
                            className="login-eye-btn"
                            aria-label="Toggle password visibility"
                            onClick={() => setShowScp(v => !v)}
                          >
                            {showScp ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                        {touched.confirm && validations.confirm && (
                          <div className="login-field-error">{validations.confirm}</div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="login-btn"
                        disabled={loading || formInvalid}
                      >
                        {loading ? (
                          <span className="login-loading">
                            <span className="login-spin" /> Creating Account...
                          </span>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </form>

                    <div className="login-switch">
                      <p>Already have an account? <button onClick={() => setActiveTab("login")}>Sign In</button></p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
