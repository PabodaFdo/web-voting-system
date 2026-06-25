import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import VotingHome from "./pages/VotingHome.jsx";
import EventVote from "./pages/EventVote.jsx";
import Bridge from "./pages/Bridge.jsx";
import MyVote from "./pages/MyVote.jsx";

/* ---- Guard: require student auth ---- */
function RequireStudent({ children }) {
  const loc = useLocation();
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem("auth") || "null"); } catch {}

  // Accept token in token or accessToken; role must be STUDENT
  const hasToken = !!(auth?.token || auth?.accessToken);
  const role = (auth?.role || auth?.user?.role || (Array.isArray(auth?.roles) ? auth.roles[0] : null) || "")
    .toString()
    .toUpperCase();

  if (!hasToken || role !== "STUDENT") {
    return <Navigate to={`/bridge?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  return children;
}

/* ---- Legacy global nav (hidden on pages that use VoteHeader) ---- */
function Nav() {
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem("auth") || "null"); } catch {}
  const role = auth?.role;

  const logout = () => {
    ["auth","token","accessToken","refreshToken","role","user"].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  };

  return (
    <nav className="nav">
      <div className="nav__left">
        <Link to="/">Voting</Link>
      </div>
      <div className="nav__right">
        {role === "STUDENT" && <Link to="/voting">My Voting</Link>}
        {!role && <Link to="/bridge">Login</Link>}
        {role && <button onClick={logout} className="btn">Logout</button>}
      </div>
    </nav>
  );
}

/* ---- Public home / gate ---- */
function HomeGate() {
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem("auth") || "null"); } catch {}
  if (auth?.role === "STUDENT") return <Navigate to="/voting" replace />;
  return (
    <div className="container">
      <h1>Welcome</h1>
      <p className="muted">This is the student voting frontend.</p>
      <p><Link to="/bridge" className="btn">Login</Link></p>
    </div>
  );
}

/* ---- App ---- */
export default function App() {
  const loc = useLocation();

  // Hide legacy <Nav /> on pages that use <VoteHeader /> (voting and my-vote)
  const isVotingRoute = /^\/(voting(\/|$)|my-vote(\/|$))/.test(loc.pathname);

  return (
    <>
      {!isVotingRoute && <Nav />}{/* hide legacy top bar on pages using VoteHeader */}
      <Routes>
        <Route path="/" element={<HomeGate />} />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
