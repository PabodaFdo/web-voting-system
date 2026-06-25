import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAllEvents, getEventReport, getEvents } from "../api";
import { exportSimpleEventReportToPDF } from "../utils/simplePdfExport";
import { exportEventReportToCSV } from "../utils/simpleCsvExport";
import "./Analytics.css";

/* ---- Tiny toast system (local to this page) ---- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);
  return { toasts, push, dismiss };
}
function Toasts({ toasts, dismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          onClick={() => dismiss(t.id)}
          title="Click to dismiss"
        >
          {t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}{" "}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Inline SVG icons - Updated to match Students/Results pages ---- */
const Icon = {
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Home: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 3l9 8h-3v10h-5V14H11v7H6V11H3l9-8z" />
    </svg>
  ),
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  ),
  Chart: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 3h2v18H3V3zm16 18h2V9h-2v12zM7 21h2V13H7v8zm8 0h2V5h-2v16z" />
    </svg>
  ),
  Award: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M17 4a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4l-2-2 2-2V6a2 2 0 0 1 2-2h10zm-5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
};

function adminLink(path = "/admin") {
  return path;
}

export default function Analytics() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // validation
  const [selectTouched, setSelectTouched] = useState(false);

  // toasts
  const { toasts, push: pushToast, dismiss } = useToasts();

  useEffect(() => {
    (async () => {
      try {
        let list = [];
        try { list = await getAllEvents(); }
        catch { list = await getEvents(); }
        setEvents(list || []);
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || "Failed to load events";
        setErr(msg);
        pushToast(msg, "error");
      }
    })();
  }, [pushToast]);

  const onPick = async (id) => {
    setSelectTouched(true);
    setEventId(id);
    if (!id) { setReport(null); return; }

    setLoading(true); setErr("");
    try {
      const r = await getEventReport(id);
      setReport(r);
      pushToast(`Loaded report for “${r?.eventName ?? "selected event"}”.`, "success");
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed to load report";
      setErr(msg);
      pushToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) { pushToast("Select an event first.", "error"); return; }
    try { exportSimpleEventReportToPDF(report); pushToast("PDF exported.", "success"); }
    catch { pushToast("PDF export failed.", "error"); }
  };

  const handleExportCSV = () => {
    if (!report) { pushToast("Select an event first.", "error"); return; }
    try { exportEventReportToCSV(report); pushToast("CSV exported.", "success"); }
    catch { pushToast("CSV export failed.", "error"); }
  };

  const maxDaily = Math.max(...(report?.dailyVoteCounts || []).map(d => d.votes || 0), 1);
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString() : "—";
  const fmtDateTime = (s) => s ? new Date(s).toLocaleString() : "—";

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  return (
    <div className="event-results">
      <div className="bg-gradient"></div>
      <Toasts toasts={toasts} dismiss={dismiss} />

      <div className="centered-container">
        {/* Top Navigation — scrolls with page (non-sticky) */}
        <nav className="analytics-top-nav" role="navigation" aria-label="Analytics Navigation">
          <div className="analytics-nav-content">
            <div className="analytics-nav-brand">
              <div className="analytics-nav-logo"><Icon.Star /></div>
              <span className="analytics-nav-title">Voting Admin</span>
            </div>

            <div className="analytics-nav-links">
              <a className="analytics-nav-link" href={adminLink("/admin")}>
                <Icon.Home style={{ display: 'block' }} />
                <span className="analytics-nav-link-text">Home</span>
              </a>
              <a className="analytics-nav-link" href={adminLink("/admin/dashboard")}>
                <Icon.Dashboard style={{ display: 'block' }} />
                <span className="analytics-nav-link-text">Dashboard</span>
              </a>
              <span className="analytics-nav-link" aria-current="page" title="You're here">
                <Icon.Chart style={{ display: 'block' }} />
                <span className="analytics-nav-link-text">Analytics</span>
              </span>
              <Link className="analytics-nav-link" to="/admin/results">
                <Icon.Award style={{ display: 'block' }} />
                <span className="analytics-nav-link-text">Publish Winners</span>
              </Link>
              <a className="analytics-nav-link" href={adminLink("/admin/students")}>
                <Icon.User style={{ display: 'block' }} />
                <span className="analytics-nav-link-text">Students</span>
              </a>
            </div>

            <button type="button" className="analytics-nav-back-btn" onClick={backToDashboard}>
              <Icon.ArrowLeft style={{ display: 'block' }} />
              <span className="analytics-nav-back-text">Back to Dashboard</span>
            </button>
          </div>
        </nav>

        <div className="event-results__header">
          <div className="event-results__title-section">
            <h1 className="event-results__title">
              📊 <span className="event-results__title-text">Event Results</span> 📈
            </h1>
            <p className="event-results__subtitle">
              Generate a downloadable report (PDF & CSV) for selected events.
            </p>
          </div>
          <div className="event-results__actions">
            <button
              className="event-results__export-btn event-results__export-btn--success"
              disabled={!report}
              onClick={handleExportPDF}
              title="Download PDF report"
            >
              📄 Export PDF
            </button>

            <button
              className="event-results__export-btn"
              disabled={!report}
              onClick={handleExportCSV}
              title="Download CSV summary"
            >
              🧾 Export CSV
            </button>
          </div>
        </div>

        <div className="event-results__controls">
          <label className="event-results__label">Select Event:</label>
          <select
            className={`event-results__select ${selectTouched && !eventId ? "is-invalid" : ""}`}
            value={eventId}
            onChange={(e) => onPick(e.target.value)}
            onBlur={() => setSelectTouched(true)}
            aria-invalid={selectTouched && !eventId}
            required
          >
            <option value="">— Choose an Event —</option>
            {events.map((ev) => (
              <option key={ev.id ?? ev.eventId ?? ev.name} value={ev.id ?? ev.eventId}>
                {ev.name}
              </option>
            ))}
          </select>
          {selectTouched && !eventId && (
            <p className="field-error">Please choose an event to load the report.</p>
          )}
        </div>

        {err && <div className="event-results__error">⚠️ {err}</div>}
        {loading && <div className="event-results__loading">🔄 Loading report…</div>}

        {!!report && !loading && (
          <div className="event-results__report">
            <section className="report-section">
              <div className="section-title">📋 Event Details</div>
              <div className="report-card">
                <div className="report-row">
                  <span className="report-label">ID:</span>
                  <span className="report-value">{report.eventId}</span>
                </div>
                <div className="report-row">
                  <span className="report-label">Name:</span>
                  <span className="report-value">{report.eventName}</span>
                </div>
                <div className="report-row">
                  <span className="report-label">Description:</span>
                  <span className="report-value">{report.eventDescription || "N/A"}</span>
                </div>
                <div className="report-row">
                  <span className="report-label">Start Date:</span>
                  <span className="report-value">{fmtDateTime(report.startDate)}</span>
                </div>
                <div className="report-row">
                  <span className="report-label">End Date:</span>
                  <span className="report-value">{fmtDateTime(report.endDate)}</span>
                </div>
              </div>
            </section>

            <section className="report-section">
              <div className="section-title">🏆 Categories</div>
              <div className="report-card">
                <div className="report-chips">
                  {report.categories.map((category) => (
                    <span key={category.id} className="report-chip">{category.name}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="report-section">
              <div className="section-title">🏅 Winners</div>
              <div className="report-card">
                <h3 className="subsection-title">Winners for Each Category</h3>
                <div className="winners-grid">
                  {report.winners.map((winner) => (
                    <div key={winner.categoryId} className="winner-card">
                      <div className="winner-category">{winner.categoryName}</div>
                      <div className="winner-name">🏆 {winner.winnerName}</div>
                      <div className="winner-votes">{winner.votes} votes</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="report-section">
              <div className="section-title">📊 Category Vote Counts</div>
              <div className="report-card">
                <div className="vote-counts">
                  {report.categoryVoteCounts.map((category) => (
                    <div key={category.categoryId} className="vote-count-row">
                      <span className="vote-count-row__cat">{category.categoryName}</span>
                      <span className="vote-count-row__v">{category.totalVotes} votes</span>
                    </div>
                  ))}
                </div>
                <div className="report-total">
                  <div className="report-total__label">Total Votes Collected</div>
                  <div className="report-total__value">{report.totalVotes ?? 0}</div>
                </div>
              </div>
            </section>

            <section className="report-section">
              <div className="section-title">🔍 Detailed Vote Breakdown</div>
              <div className="report-card">
                {report.nomineeVotesByCategory.map((category) => (
                  <div key={category.categoryId} className="breakdown-block">
                    <div className="breakdown-block__title">{category.categoryName}</div>
                    <div className="breakdown-list">
                      {category.nomineeVotes.map((nominee) => (
                        <div key={nominee.nomineeId} className="breakdown-row">
                          <span className="breakdown-row__name">{nominee.nomineeName}</span>
                          <span className="breakdown-row__v">{nominee.votes} votes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="report-section">
              <div className="section-title">📈 Daily Vote Timeline</div>
              <div className="report-card">
                <div className="timeline">
                  {report.dailyVoteCounts.map((d, index) => (
                    <div key={index} className="timeline-row">
                      <span className="timeline-row__date">{fmtDate(d.date)}</span>
                      <div className="timeline-barwrap">
                        <div className="timeline-bar" style={{ width: `${(d.votes / maxDaily) * 100}%` }} />
                      </div>
                      <span className="timeline-row__v">{d.votes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
