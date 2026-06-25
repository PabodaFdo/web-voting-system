import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell, Send, Users, Calendar, History, Archive, ArrowLeft, Search,
  Check, Clock, XCircle, Home as HomeIcon
} from "lucide-react";
import "./Compose.css";
import { sendNow, scheduleSend, listActive } from "../api/notifications";

const MAX_RECENT = 4;

export default function Compose() {
  const navigate = useNavigate();

  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendMode, setSendMode] = useState("now"); // "now" | "scheduled"
  const [scheduledTime, setScheduledTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // right panel: recent (rolling window of 4)
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const pollRef = useRef(null);

  /** Normalize API/response notification objects. */
  const normalize = (n, opts = {}) => {
    const nowIso = opts.fallbackNowIso || null;
    const scheduledIso = opts.scheduledIso || null;

    const createdAt =
      n.createdAt || n.created_at || nowIso || null;

    const sendAtUtc =
      n.sendAtUtc || n.scheduledFor || scheduledIso || null;

    const sentAt = n.sentAt || null;

    return {
      id: n.id ?? crypto.randomUUID(),
      subject: n.subject ?? "",
      body: n.body ?? "",
      recipient: n.recipient ?? (Array.isArray(n.recipients) ? n.recipients[0] : undefined),
      recipients: n.recipients,
      status: (n.status || "").toString().toUpperCase(),
      createdAt,
      sendAtUtc,
      sentAt,
    };
  };

  /** Sort by the most reliable timestamp first. */
  const getTs = (n) => {
    if (n.createdAt) return Date.parse(n.createdAt);
    if (n.sentAt)    return Date.parse(n.sentAt);
    if (n.sendAtUtc) return Date.parse(n.sendAtUtc);
    return 0;
  };

  /** Derive a display status if API didn’t supply one. */
  const deriveStatus = (n) => {
    const s = (n.status || "").toUpperCase();
    if (s === "SENT" || s === "FAILED" || s === "PENDING" || s === "SCHEDULED") {
      return s === "SCHEDULED" ? "PENDING" : s;
    }
    const now = Date.now();
    if (n.sentAt) return "SENT";
    if (n.sendAtUtc && Date.parse(n.sendAtUtc) > now) return "PENDING";
    return "SENT";
  };

  // sticky nav shadow
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY > 2;
      setIsScrolled(scrolled);
      document.querySelector(".compose-page")?.classList.toggle("is-scrolled", scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // initial load + polling (rolling window of 4)
  useEffect(() => {
    let abort = false;

    const load = async () => {
      try {
        const items = await listActive();
        if (abort) return;
        const normalized = (items || []).map((n) => normalize(n));
        normalized.sort((a, b) => getTs(b) - getTs(a)); // newest first
        setRecent((prev) => {
          // server snapshot should overwrite previous duplicates
          const map = new Map();
          [...prev, ...normalized].forEach((x) => map.set(x.id, x));
          const merged = Array.from(map.values()).sort((a, b) => getTs(b) - getTs(a));
          return merged.slice(0, MAX_RECENT);
        });
      } catch {
        /* keep page usable if recent fails */
      }
    };

    load();
    pollRef.current = setInterval(load, 8000);

    return () => {
      abort = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // filtered list (search within the 4-window)
  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((n) =>
      [n.subject, n.body, n.recipient, ...(n.recipients || [])]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [recent, search]);

  // counters based on the currently tracked (max 4) items
  const counters = useMemo(() => {
    return recent.reduce(
      (acc, n) => {
        const s = deriveStatus(n);
        if (s === "SENT") acc.sent += 1;
        else if (s === "FAILED") acc.failed += 1;
        else acc.pending += 1; // pending/scheduled
        return acc;
      },
      { sent: 0, pending: 0, failed: 0 }
    );
  }, [recent]);

  const backToDashboard = useCallback(() => {
    const url = import.meta.env.VITE_ADMIN_DASHBOARD_URL || "/admin";
    window.location.assign(url);
  }, []);

  const handleSend = async () => {
    if (!recipient || !subject || !body) {
      toast.error("Please fill recipient, subject and message");
      return;
    }
    if (sendMode === "scheduled" && !scheduledTime) {
      toast.error("Please choose a schedule time");
      return;
    }

    setIsLoading(true);
    try {
      const res =
        sendMode === "now"
          ? await sendNow({ recipients: recipient, subject, body })
          : await scheduleSend({ recipients: recipient, subject, body, localDateTime: scheduledTime });

      /** The API can return either one notification or an array. */
      const arr = Array.isArray(res) ? res : [res].filter(Boolean);
      const sent = arr.filter((x) => String(x.status || "").toUpperCase() === "SENT").length;
      const total = arr.length || 0;
      const remain = total - sent;

      if (sendMode === "now") {
        if (sent > 0 && remain === 0) toast.success(`Sent to ${sent} recipient(s)`);
        else if (sent > 0) toast.warning(`Partially sent: ${sent} ok, ${remain} pending/failed`);
        else toast.error("Failed to send");
      } else {
        toast.success(`Scheduled ${total || 1} notification(s)`);
      }

      // Optimistically add to Recent and keep only 4
      if (arr.length) {
        const nowIso = new Date().toISOString();
        const schIso =
          sendMode === "scheduled" && scheduledTime ? new Date(scheduledTime).toISOString() : undefined;

        const normalizedNew = arr
          .map((n) => normalize(n, { fallbackNowIso: nowIso, scheduledIso: schIso }))
          .sort((a, b) => getTs(b) - getTs(a));

        setRecent((prev) => {
          // put new first; de-dupe; keep 4; then sort by createdAt-first key
          const map = new Map();
          [...normalizedNew, ...prev].forEach((x) => map.set(x.id, x));
          const merged = Array.from(map.values()).sort((a, b) => getTs(b) - getTs(a));
          return merged.slice(0, MAX_RECENT);
        });
      }

      setRecipient("");
      setSubject("");
      setBody("");
      setScheduledTime("");
      navigate("/history"); // kept as-is per your file
    } catch (e) {
      toast.error(e?.message || "Email send failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="compose-page">
      {/* Top Nav */}
      <nav className={`top-nav ${isScrolled ? "with-shadow" : ""}`} role="navigation" aria-label="Notifications Navigation">
        <div className="nav-content">
          <div className="nav-brand">
            <div className="nav-logo"><Bell className="i" /></div>
            <span className="nav-title">Notification Center</span>
          </div>

          <div className="nav-links">
            <NavLink to="/admin/notifications" end className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <HomeIcon className="i sm" /><span className="nav-link-text">Home</span>
            </NavLink>

            <NavLink to="/admin/notifications/compose" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <Send className="i sm" /><span className="nav-link-text">Compose</span>
            </NavLink>

            <NavLink to="/admin/notifications/history" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <History className="i sm" /><span className="nav-link-text">History</span>
            </NavLink>
            <NavLink to="/admin/notifications/archived" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <Archive className="i sm" /><span className="nav-link-text">Archived</span>
            </NavLink>
          </div>

          <button type="button" className="nav-back-btn" onClick={backToDashboard}>
            <ArrowLeft className="i sm" /> <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      {/* Two-column layout */}
      <div className="compose-layout">
        {/* Left: Compose */}
        <div className="compose-card">
          <header className="compose-header">
            <div className="compose-badge"><Send className="i" /></div>
            <div className="compose-headings">
              <h2>Compose Notification</h2>
              <p>Create and send a new notification to your recipients</p>
            </div>
          </header>

          <div className="compose-body">
            <div className="field">
              <label className="label"><span>Recipient(s)</span></label>

              {/* Input with leading human icon */}
              <div className="input-with-icon">
                <Users className="i input-icon" aria-hidden="true" />
                <input
                  className="input"
                  placeholder="email@example.com or multiple separated by commas"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                />
              </div>

              <small className="help">Enter multiple emails separated by commas or spaces</small>
            </div>

            <div className="field">
              <label className="label">Subject</label>
              <input
                className="input"
                placeholder="Enter notification subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Message</label>
              <textarea
                className="textarea"
                rows={8}
                placeholder="Enter your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Send Mode</label>
              <div className="mode-row">
                <button
                  type="button"
                  onClick={() => setSendMode("now")}
                  className={`mode-btn ${sendMode === "now" ? "active" : ""}`}
                >
                  <Send className="i sm" /><span>Send Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode("scheduled")}
                  className={`mode-btn ${sendMode === "scheduled" ? "active" : ""}`}
                >
                  <Calendar className="i sm" /><span>Schedule Send</span>
                </button>
              </div>
            </div>

            {sendMode === "scheduled" && (
              <div className="schedule-panel">
                <label className="label tight">
                  <Calendar className="i sm primary" />
                  <span>Schedule For (Local Time)</span>
                </label>
                <input
                  type="datetime-local"
                  className="input strong-focus"
                  value={scheduledTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
                <p className="help">Converted to UTC for scheduling</p>
              </div>
            )}

            <button className="primary-cta" disabled={isLoading} onClick={handleSend}>
              <Send className="i sm" />
              {isLoading ? (sendMode === "now" ? "Sending..." : "Scheduling...") :
                (sendMode === "now" ? "Send Notification" : "Schedule Notification")}
            </button>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <aside className="activity-card">
          <h3 className="activity-title">Recent Activity</h3>

          <div className="activity-search">
            <Search className="activity-search-icon" />
            <input
              className="activity-search-input"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Counters */}
          <div className="activity-counters" aria-label="Recent activity counters">
            <div className="counter-chip sent">
              <Check className="i sm" />
              <span>{counters.sent} sent</span>
            </div>
            <div className="counter-chip pending">
              <Clock className="i sm" />
              <span>{counters.pending} scheduled</span>
            </div>
            <div className="counter-chip failed">
              <XCircle className="i sm" />
              <span>{counters.failed} failed</span>
            </div>
          </div>

          <div className="activity-list">
            {displayList.length === 0 ? (
              <div className="activity-empty">No notifications</div>
            ) : (
              displayList.map((n) => {
                const status = deriveStatus(n);
                const badgeClass =
                  status === "SENT" ? "is-sent" :
                  status === "FAILED" ? "is-failed" : "is-pending";
                return (
                  <div key={n.id} className="activity-item">
                    <div className="activity-item__head">
                      <h4 className="activity-item__title">{n.subject || "—"}</h4>
                      <span className={`activity-badge ${badgeClass}`}>{status}</span>
                    </div>
                    {n.body && <p className="activity-item__body">{n.body}</p>}
                    <div className="activity-item__meta">
                      {(n.recipient || (n.recipients?.length > 0)) && (
                        <span className="meta-inline">
                          <Users className="i meta" aria-hidden="true" />
                          {n.recipient || n.recipients[0]}
                        </span>
                      )}
                      {n.sendAtUtc && (
                        <span className="activity-item__time">
                          <Calendar className="i sm" />
                          {new Date(n.sendAtUtc).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
