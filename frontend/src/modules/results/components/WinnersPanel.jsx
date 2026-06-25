import { useEffect, useState } from "react";
import { getPublishedWinners } from "../api";
import "./WinnersPanel.css";

const Icon = {
  Trophy: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
      <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v2c0 3.31 2.69 6 6 6h.31c.42 1.37 1.44 2.47 2.76 2.91L10 19H8v2h8v-2h-2l-1.07-4.09c1.32-.44 2.34-1.54 2.76-2.91H16c3.31 0 6-2.69 6-6V4c0-1.1-.9-2-2-2zm0 4c0 2.21-1.79 4-4 4h-.34c-.41-1.35-1.44-2.43-2.76-2.87L13.93 3H20v3zM4 3h6.07l1.03 4.13c-1.32.44-2.35 1.52-2.76 2.87H8c-2.21 0-4-1.79-4-4V3z"/>
    </svg>
  ),
  Award: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <circle cx="12" cy="8" r="6" fill="currentColor"/>
      <path fill="currentColor" d="M15.75 8l1.5 8-5.25-3-5.25 3 1.5-8"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V9h14v9z"/>
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
};

export default function WinnersPanel({ eventId }) {
  const [state, setState] = useState({ loading: true, data: null, err: "" });

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await getPublishedWinners(eventId);
        if (on) setState({ loading: false, data, err: "" });
      } catch (err) {
        console.error("Failed to load winners:", err);
        if (on) setState({ loading: false, data: null, err: "Failed to load winners" });
      }
    })();
    return () => { on = false; };
  }, [eventId]);

  if (state.loading) {
    return (
      <div className="winners-panel">
        <div className="winners-card">
          <div className="winners-loading">
            <div className="winners-spinner"></div>
            <p>Loading winners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.err) {
    return (
      <div className="winners-panel">
        <div className="winners-card winners-card-error">
          <div className="winners-error">
            <span className="winners-error-icon">⚠️</span>
            <p>{state.err}</p>
          </div>
        </div>
      </div>
    );
  }

  const d = state.data;
  if (!d || d.published === false || !d.categories || d.categories.length === 0) {
    return (
      <div className="winners-panel">
        <div className="winners-card winners-card-warning">
          <div className="winners-warning">
            <Icon.Trophy style={{ opacity: 0.5 }} />
            <h3>No Published Results Yet</h3>
            <p>Winners will appear here once the results are published.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="winners-panel">
      <div className="winners-card">
        <div className="winners-header">
          <div className="winners-header-content">
            <div className="winners-header-icon">
              <Icon.Trophy />
            </div>
            <div>
              <h2 className="winners-title">🏆 Event Winners</h2>
              <div className="winners-meta">
                <span className="winners-meta-item">
                  <Icon.Calendar />
                  Published {new Date(d.publishedAt).toLocaleDateString()}
                </span>
                <span className="winners-meta-item">
                  <Icon.Award />
                  {d.categories.length} Categories
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="winners-body">
          <div className="winners-grid">
            {d.categories.map((c) => (
              <div key={c.categoryId} className="winners-category-card">
                <div className="winners-category-header">
                  <h3 className="winners-category-title">
                    <Icon.Award />
                    {c.categoryName}
                  </h3>
                  {c.tie && (
                    <span className="winners-tie-badge">
                      <Icon.Users />
                      Tie
                    </span>
                  )}
                </div>

                <div className="winners-list">
                  {c.winners.map((w, idx) => (
                    <div key={w.nomineeId} className={`winners-item ${idx === 0 ? 'winners-item-first' : ''}`}>
                      <div className="winners-item-content">
                        {w.photoUrl ? (
                          <img
                            src={w.photoUrl}
                            alt={w.nomineeName}
                            className="winners-avatar"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="winners-avatar-placeholder">
                            {w.nomineeName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="winners-item-info">
                          <div className="winners-item-name">{w.nomineeName}</div>
                          <div className="winners-item-votes">
                            {w.votes.toLocaleString()} votes
                          </div>
                        </div>
                      </div>
                      
                      {idx === 0 && (
                        <div className="winners-first-badge">
                          🥇
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}