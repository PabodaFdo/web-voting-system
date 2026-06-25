import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

import { Vote, Trophy, Users, TrendingUp, CheckCircle, Sparkles, Calendar } from "lucide-react";

/* API base is configurable through VITE_API_BASE. */
const BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8080";

async function tryJson(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function tryCountFromArrays(possibleUrls) {
  for (const u of possibleUrls) {
    try {
      const data = await tryJson(`${BASE}${u}`);
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.content)) return data.content.length;
      if (Array.isArray(data?.items)) return data.items.length;
      if (typeof data?.count === "number") return data.count;
      if (typeof data === "number") return data;
    } catch (_e) { /* try next */ }
  }
  return null;
}

export default function Landing() {
  const [counts, setCounts] = useState({
    events: "—",
    categories: "—",
    nominees: "—",
    votes: "—",
  });

  const [navScrolled, setNavScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  /* Scroll header */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setNavScrolled(true);
      } else {
        setNavScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  /* Toast handoff from login and logout redirects */
  const [toast, setToast] = useState(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("toast");
    const msg = params.get("msg");
    if (t) {
      const defaults = { 
        logout: "Logged out successfully.", 
        login: "Logged in successfully." 
      };
      setToast({ message: msg || defaults[t] || "Done.", kind: "success" });
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
      try { sessionStorage.removeItem("nav_toast"); } catch {}
      return;
    }

    try {
      const raw = sessionStorage.getItem("nav_toast");
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.message && Date.now() - (s.ts || 0) < 15000) {
          setToast({ message: s.message, kind: s.kind || "success" });
        }
      }
    } catch {}
    sessionStorage.removeItem("nav_toast");
  }, []);

  // Auto-dismiss the landing toast after a short delay.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Fetch stats from the public API, then fall back to module endpoints.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await tryJson(`${BASE}/api/public/stats`);
        const next = {
          events: j.activeEvents ?? j.eventsActive ?? j.events ?? null,
          categories: j.categories ?? j.categoryCount ?? null,
          nominees: j.nominees ?? j.nomineeCount ?? null,
          votes: j.votes ?? j.totalVotes ?? null,
        };
        if (!cancelled) {
          setCounts({
            events: next.events ?? "—",
            categories: next.categories ?? "—",
            nominees: next.nominees ?? "—",
            votes: next.votes ?? "—",
          });
        }
        return;
      } catch (_e) {}

      const [events, categories, nominees, votes] = await Promise.all([
        tryCountFromArrays([
          "/api/public/events/active",
          "/api/public/events",
          "/api/events?status=ACTIVE",
          "/api/events/active",
          "/api/events",
        ]),
        tryCountFromArrays([
          "/api/public/categories",
          "/api/categories",
          "/api/category",
        ]),
        tryCountFromArrays([
          "/api/public/nominees",
          "/api/nominees",
          "/api/nominee",
        ]),
        tryCountFromArrays([
          "/api/public/votes/count",
          "/api/votes/count",
          "/api/votes",
        ]),
      ]);

      if (!cancelled) {
        setCounts({
          events: events ?? "—",
          categories: categories ?? "—",
          nominees: nominees ?? "—",
          votes: votes ?? "—",
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const features = [
    { 
      icon: <Vote className="w-6 h-6" />, 
      title: "Event & Category Ballots", 
      text: "Students vote inside an event, per category, selecting one nominee in each.",
      iconClass: "landing__feature-icon--blue"
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      title: "Live Leaderboard", 
      text: "Organizers view leaders and participation on the admin dashboard in real time.",
      iconClass: "landing__feature-icon--cyan"
    },
    { 
      icon: <CheckCircle className="w-6 h-6" />, 
      title: "Secure Voting", 
      text: "Student login + server-side checks ensure each student votes only once per category.",
      iconClass: "landing__feature-icon--teal"
    },
  ];

  const steps = [
    { 
      n: 1, 
      t: "Sign in as Student", 
      d: "Use your student account to access eligible events.", 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      n: 2, 
      t: "Pick Event & Category", 
      d: "Open an active event and choose a category to vote.", 
      icon: <Trophy className="w-5 h-5" /> 
    },
    { 
      n: 3, 
      t: "Select & Submit", 
      d: "Confirm your choice. Your vote is recorded instantly.", 
      icon: <Vote className="w-5 h-5" /> 
    },
  ];

  const testimonials = [
    { 
      name: "Organizing Committee", 
      role: "Event Admins", 
      content: "Setup was straightforward. The category-based ballots and results view made our awards smooth." 
    },
    { 
      name: "Student Affairs", 
      role: "Faculty", 
      content: "Clear eligibility rules and single-vote checks gave us confidence in the outcome." 
    },
    { 
      name: "Final-year Students", 
      role: "Voters", 
      content: "Fast, simple, and transparent. Casting votes for each category took just a minute." 
    },
  ];

  // Static examples used by the landing page preview.
  const sampleEvents = [
    {
      id: 1,
      title: "Bright Future Annual Awards",
      description: "Celebrating outstanding achievements across all faculties",
      status: "active",
      date: "2024-03-15",
      categories: 12,
      nominees: 45
    },
    {
      id: 2,
      title: "Student Leadership Summit",
      description: "Recognizing exceptional student leaders and initiatives",
      status: "upcoming",
      date: "2024-04-20",
      categories: 8,
      nominees: 32
    },
    {
      id: 3,
      title: "Research Excellence Awards",
      description: "Honoring groundbreaking research and innovation",
      status: "completed",
      date: "2024-02-10",
      categories: 6,
      nominees: 28
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'landing__event-badge landing__event-badge--active';
      case 'upcoming': return 'landing__event-badge landing__event-badge--upcoming';
      case 'completed': return 'landing__event-badge landing__event-badge--completed';
      default: return 'landing__event-badge landing__event-badge--upcoming';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="landing">
      {/* Navigation with Scroll Effect */}
      <nav className={`landing__nav ${navScrolled ? 'scrolled' : ''} ${navHidden ? 'hidden' : ''}`}>
        <div className="landing__nav-container">
          <div className="landing__nav-inner">
            <Link to="/" className="landing__brand">
              <div className="landing__brand-icon">
                <Vote />
              </div>
              <span className="landing__brand-text">Bright Future</span>
            </Link>

            <div className="landing__nav-actions">
              <Link to="/events" className="landing__nav-link">
                View Polls
              </Link>
              <Link to="/login" className="landing__nav-btn">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="landing__hero">
        <div className="landing__hero-container">
          <div className="landing__badge">
            <Sparkles />
            University Award Nominations
          </div>

          <h1 className="landing__title">
            <span className="landing__title-main">Bright Future</span>
            <span className="landing__title-gradient">Student Awards Portal</span>
          </h1>

          <p className="landing__subtitle">
            A secure university portal where <strong>students vote once per category</strong> in
            each event. Organizers monitor <strong>leaders and participation</strong> live.
          </p>

          <div className="landing__cta-group">
            <Link to="/events" className="landing__btn landing__btn--primary">
              Explore Events
            </Link>
            <Link to="/login" className="landing__btn landing__btn--secondary">
              Student Login
            </Link>
          </div>

          <div className="landing__features-badge">
            <span className="landing__features-badge-item">
              <CheckCircle className="icon-green" />
              Secure
            </span>
            <span className="landing__features-badge-item">
              <TrendingUp className="icon-blue" />
              Real-time
            </span>
            <span className="landing__features-badge-item">
              <Vote className="icon-cyan" />
              One vote per category
            </span>
          </div>
        </div>
      </header>

      {/* Featured Events Section */}
      <section className="landing__events-section">
        <div className="landing__container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">Featured Events</h2>
            <p className="landing__section-subtitle">
              Join ongoing awards and make your voice heard
            </p>
          </div>

          <div className="landing__events-grid">
            {sampleEvents.map((event) => (
              <div key={event.id} className="landing__event-card">
                <div className="landing__event-header">
                  <h3 className="landing__event-title">{event.title}</h3>
                  <span className={getStatusBadge(event.status)}>
                    {getStatusText(event.status)}
                  </span>
                </div>
                
                <p className="landing__event-desc">{event.description}</p>
                
                <div className="landing__event-meta">
                  <Calendar size={18} />
                  <span>{new Date(event.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>

                <div className="landing__event-stats">
                  <div className="landing__event-stat">
                    <Trophy size={18} />
                    <span>{event.categories} Categories</span>
                  </div>
                  <div className="landing__event-stat">
                    <Users size={18} />
                    <span>{event.nominees} Nominees</span>
                  </div>
                </div>

                <Link to="/events" className="landing__event-btn">
                  View Event Details
                  <TrendingUp size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing__section">
        <div className="landing__container">
          <div className="landing__stats-grid">
            <div className="landing__stat-card">
              <div className="landing__stat-value">{counts.events}</div>
              <div className="landing__stat-label">Active Events</div>
            </div>
            <div className="landing__stat-card">
              <div className="landing__stat-value landing__stat-value--cyan">{counts.categories}</div>
              <div className="landing__stat-label">Categories</div>
            </div>
            <div className="landing__stat-card">
              <div className="landing__stat-value landing__stat-value--teal">{counts.nominees}</div>
              <div className="landing__stat-label">Nominees</div>
            </div>
            <div className="landing__stat-card">
              <div className="landing__stat-value landing__stat-value--sky">{counts.votes}</div>
              <div className="landing__stat-label">Votes Cast</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__section landing__section--alt">
        <div className="landing__container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">Built For Our Awards Workflow</h2>
            <p className="landing__section-subtitle">
              Events contain categories. Students select one nominee in each category they're eligible for.
              Admins view leaders and participation in real time.
            </p>
          </div>

          <div className="landing__features-grid">
            {features.map((f, i) => (
              <div key={i} className="landing__feature-card">
                <div className={`landing__feature-icon ${f.iconClass}`}>
                  {f.icon}
                </div>
                <h3 className="landing__feature-title">{f.title}</h3>
                <p className="landing__feature-text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="landing__section">
        <div className="landing__container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">How Voting Works</h2>
            <p className="landing__section-subtitle">
              Simple steps tailored to our project structure
            </p>
          </div>

          <div className="landing__steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="landing__step-card">
                <div className="landing__step-number">{s.n}</div>
                <div className="landing__step-header">
                  <div className="landing__step-icon">{s.icon}</div>
                  <h3 className="landing__step-title">{s.t}</h3>
                </div>
                <p className="landing__step-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing__section landing__section--alt">
        <div className="landing__container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">What Our Team Says</h2>
            <p className="landing__section-subtitle">
              Feedback from organizers and students
            </p>
          </div>

          <div className="landing__features-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="landing__testimonial-card">
                <div className="landing__testimonial-stars">
                  {[...Array(5)].map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>
                <p className="landing__testimonial-text">
                  "{t.content}"
                </p>
                <div className="landing__testimonial-author">
                  <div className="landing__testimonial-name">{t.name}</div>
                  <div className="landing__testimonial-role">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta-section">
        <div className="landing__cta-container">
          <h2 className="landing__cta-title">Run Your Event Smoothly</h2>
          <p className="landing__cta-text">
            Open an event, add categories and nominees, and let students vote in minutes.
          </p>
          <div className="landing__cta-group">
            <Link to="/login" className="landing__btn landing__btn--white">
              Organizer Login
            </Link>
            <Link to="/events" className="landing__btn landing__btn--outline">
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-brand">
            <div className="landing__footer-icon">
              <Vote />
            </div>
            <span className="landing__footer-name">University Voting</span>
          </div>
          <div className="landing__footer-copy">
            © {new Date().getFullYear()} University Voting Portal
          </div>
        </div>
      </footer>

      {/* Toast */}
      <Toast message={toast?.message} kind={toast?.kind} onClose={() => setToast(null)} />
    </div>
  );
}

/* ---- Toast component ---- */
function Toast({ message, kind = "info", onClose }) {
  if (!message) return null;
  
  const toastClass = 
    kind === "success" ? "landing__toast landing__toast--success" :
    kind === "error" ? "landing__toast landing__toast--error" :
    "landing__toast landing__toast--info";
  
  return (
    <div 
      className={toastClass}
      role="status" 
      aria-live="polite" 
      onClick={onClose}
    >
      <CheckCircle />
      <span className="landing__toast-text">{message}</span>
    </div>
  );
}
