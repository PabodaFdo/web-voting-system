import "./QuickAccess.css";

export default function QuickAccess({ context = "analytics", onRefresh, onExportCsv, onGoResults }) {
  const link = (path) => path;

  return (
    <div className="qa">
      <div className="qa__grid">
        <a className="qa__card" href={link("/admin/dashboard")}>
          <div className="qa__icon">📊</div>
          <div className="qa__title">Dashboard</div>
          <div className="qa__hint">Live metrics</div>
        </a>
        <a className="qa__card" href={link("/admin/students")}>
          <div className="qa__icon">👥</div>
          <div className="qa__title">Students</div>
          <div className="qa__hint">Manage records</div>
        </a>
        <button type="button" className="qa__card qa__action" onClick={onGoResults}>
          <div className="qa__icon">📝</div>
          <div className="qa__title">Result Sets</div>
          <div className="qa__hint">Publish winners</div>
        </button>
        <button type="button" className="qa__card qa__action" onClick={onRefresh}>
          <div className="qa__icon">🔄</div>
          <div className="qa__title">Refresh</div>
          <div className="qa__hint">Reload data</div>
        </button>
        {onExportCsv && (
          <button type="button" className="qa__card qa__action" onClick={onExportCsv}>
            <div className="qa__icon">📄</div>
            <div className="qa__title">Export CSV</div>
            <div className="qa__hint">Top leaders</div>
          </button>
        )}
      </div>
    </div>
  );
}
