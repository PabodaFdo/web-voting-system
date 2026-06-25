import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import "./VoteHeader.css";

const readAuth = () => {
  try { return JSON.parse(localStorage.getItem("auth") || "null"); }
  catch { return null; }
};
const isAuthed = () => !!readAuth()?.token;
const currentRole = () => readAuth()?.role || null;

export default function VoteHeader({
  brandText = "University Voting",
  badgeText = "Voting Portal",
  showAuth = true,
  leftBackTo,
  leftBackLabel = "Back",
}) {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(isAuthed());
  const [role, setRole] = useState(currentRole());

  useEffect(() => {
    const onStorage = () => {
      setAuthed(isAuthed());
      setRole(currentRole());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logoutHere = useCallback(() => {
    ["auth","student_auth","admin_auth","token","accessToken","refreshToken","nominee_auth","user","role"]
      .forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    setAuthed(false);
    setRole(null);
    const url = import.meta.env.VITE_PUBLIC_HOME || "/";
    window.location.assign(url);
  }, []);

  const goToMyVote = useCallback(() => { nav("/my-vote"); }, [nav]);

  return (
    <header className="vote-header">
      <div className="vote-header__glow" />
      <div className="vote-header__container">
        <div className="vote-header__left">
          {leftBackTo ? (
            <Link to={leftBackTo} className="vote-header__back">
              <span className="vote-header__btn-icon">←</span>{leftBackLabel}
            </Link>
          ) : <span className="vote-header__spacer" />}
        </div>

        <div className="vote-header__brand">
          <Link to="/" className="vote-header__logo">
            <div className="vote-header__logo-icon">🗳️</div>
            <span className="vote-header__logo-text">{brandText}</span>
            {badgeText && <span className="vote-header__logo-badge">{badgeText}</span>}
          </Link>
        </div>

        <nav className="vote-header__nav">
          {!showAuth ? null : !authed ? (
            <Link to="/bridge" className="vote-header__login-btn">
              <span className="vote-header__btn-icon">🔐</span>
              Admin Login
            </Link>
          ) : (
            <div className="vote-header__auth-buttons">
              {role === "STUDENT" && (
                <button type="button" onClick={goToMyVote} className="vote-header__myvote-btn">
                  <span className="vote-header__btn-icon">📊</span>
                  My Vote
                </button>
              )}
              <button type="button" onClick={logoutHere} className="vote-header__logout-btn">
                <span className="vote-header__btn-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
