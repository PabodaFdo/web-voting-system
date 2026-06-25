import { useMemo } from "react";
import "./SetDataCategoryDash.css";

const Icon = {
  Award: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}>
      <circle cx="12" cy="8" r="6" fill="currentColor"/>
      <path fill="currentColor" d="M15.75 8l1.5 8-5.25-3-5.25 3 1.5-8"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
};

/**
 * Dashboard panel for the Set Data page.
 * Props:
 *  - categories: [{ id, name }]
 *  - nominees:   [{ id, name, categoryId }]
 *  - items:      [{ id, categoryId, nomineeId, position, displayName }]
 */
export default function SetDataCategoryDash({ categories = [], nominees = [], items = [] }) {
  const stats = useMemo(() => {
    const nomsByCat = new Map();
    nominees.forEach(n => {
      const arr = nomsByCat.get(n.categoryId) || [];
      arr.push(n);
      nomsByCat.set(n.categoryId, arr);
    });

    const itemsByCat = new Map();
    items.forEach(it => {
      const arr = itemsByCat.get(it.categoryId) || [];
      arr.push(it);
      itemsByCat.set(it.categoryId, arr);
    });

    const rows = categories.map(c => {
      const noms = nomsByCat.get(c.id) || [];
      const its  = (itemsByCat.get(c.id) || []).sort(
        (a, b) => (a.position ?? 99) - (b.position ?? 99)
      );
      return {
        id: c.id,
        name: c.name,
        nominees: noms.length,
        winners: its.length,
        top: its[0]?.displayName || its[0]?.nomineeName || "—",
        hasWinner: its.length > 0
      };
    });

    return {
      rows,
      totals: {
        categories: categories.length,
        withWinner: rows.filter(r => r.hasWinner).length,
        withoutWinner: rows.filter(r => !r.hasWinner).length,
        nominees: nominees.length,
        items: items.length
      }
    };
  }, [categories, nominees, items]);

  return (
    <section className="catdash-card">
      <div className="catdash-card-header">
        <h2 className="catdash-card-title">
          <Icon.Award />
          Category Overview
        </h2>
      </div>
      <div className="catdash-card-body">
        {/* KPI Grid */}
        <div className="catdash-kpi-grid">
          <Kpi 
            title="Total Categories" 
            value={stats.totals.categories} 
            color="primary"
          />
          <Kpi 
            title="With Winners" 
            value={stats.totals.withWinner} 
            color="success"
            icon={<Icon.Check />}
          />
          <Kpi 
            title="Pending" 
            value={stats.totals.withoutWinner} 
            color="warning"
            icon={<Icon.X />}
          />
          <Kpi 
            title="Total Nominees" 
            value={stats.totals.nominees} 
            color="info"
          />
        </div>

        {/* Progress Summary */}
        <div className="catdash-progress-summary">
          <div className="catdash-progress-label">
            Overall Completion
          </div>
          <div className="catdash-progress-bar-wrapper">
            <div 
              className="catdash-progress-bar" 
              style={{ 
                width: `${stats.totals.categories > 0 ? (stats.totals.withWinner / stats.totals.categories * 100) : 0}%` 
              }}
            />
          </div>
          <div className="catdash-progress-text">
            {stats.totals.withWinner} of {stats.totals.categories} categories complete
          </div>
        </div>

        {/* Table */}
        {stats.rows.length === 0 ? (
          <div className="catdash-empty">
            <Icon.Award style={{ width: 48, height: 48, opacity: 0.3 }} />
            <p>No categories found.</p>
          </div>
        ) : (
          <div className="catdash-table-wrapper">
            <table className="catdash-table">
              <thead>
                <tr>
                  <th className="catdash-th-left">Category</th>
                  <th className="catdash-th-center">Nominees</th>
                  <th className="catdash-th-center">Winners</th>
                  <th className="catdash-th-left">Top Winner</th>
                  <th className="catdash-th-center">Status</th>
                  <th className="catdash-th-right">Progress</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map(r => {
                  const pct = r.hasWinner ? 100 : 0;
                  return (
                    <tr key={r.id} className={r.hasWinner ? 'catdash-row-complete' : 'catdash-row-pending'}>
                      <td className="catdash-td-category">{r.name}</td>
                      <td className="catdash-td-center catdash-td-count">{r.nominees}</td>
                      <td className="catdash-td-center catdash-td-winners">{r.winners}</td>
                      <td className="catdash-td-top">{r.top}</td>
                      <td className="catdash-td-center">
                        {r.hasWinner ? (
                          <span className="catdash-badge catdash-badge-success">
                            <Icon.Check />
                            Complete
                          </span>
                        ) : (
                          <span className="catdash-badge catdash-badge-warning">
                            <Icon.X />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="catdash-td-progress">
                        <div className="catdash-progress-mini-wrapper">
                          <div 
                            className={`catdash-progress-mini ${r.hasWinner ? 'complete' : 'pending'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Kpi({ title, value, color = "primary", icon = null }) {
  return (
    <div className={`catdash-kpi catdash-kpi-${color}`}>
      {icon && <div className="catdash-kpi-icon">{icon}</div>}
      <div className="catdash-kpi-content">
        <div className="catdash-kpi-title">{title}</div>
        <div className="catdash-kpi-value">{value}</div>
      </div>
    </div>
  );
}