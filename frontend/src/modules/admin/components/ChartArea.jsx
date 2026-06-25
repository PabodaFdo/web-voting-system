import React from "react";
import "./ChartArea.css";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#22c55e", "#eab308", "#a78bfa", "#fb7185",
];

function toLabelDate(v) {
  try {
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch {}
  return String(v ?? "");
}

function toRow(d) {
  const dateish = d?.ts ?? d?.date ?? d?.day ?? d?.when;
  const name =
    d?.name ?? d?.nomineeName ?? d?.label ?? (dateish ? toLabelDate(dateish) : "");
  const value =
    typeof d?.value === "number" ? d.value :
    typeof d?.votes === "number" ? d.votes :
    typeof d?.count === "number" ? d.count :
    typeof d?.percent === "number" ? d.percent :
    typeof d?.percentOfEligible === "number" ? d.percentOfEligible : 0;
  return { name, value };
}

function ChartBox({ type = "BAR", data = [], height = 300, showLegend = false, grid = true }) {
  const rows = Array.isArray(data) ? data.map(toRow) : [];
  if (!rows.length) {
    return (
      <div className="cvp-empty chart-card text-center" style={{ color: "#6b7280" }}>
        No data available
      </div>
    );
  }

  if (type === "PIE") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            outerRadius={Math.max(80, height / 2 - 30)}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "LINE") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows}>
          {grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows}>
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {showLegend && <Legend />}
        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Pass pairs=[{ chartType, data, title }] to show up to two charts with titles
 * or single: <ChartArea title="My Chart" chartType="BAR" data={...}/>
 */
export default function ChartArea({
  chartType = "BAR",
  data = [],
  height = 300,
  showLegend = false,
  grid = true,
  pairs = null,
  title = "",
}) {
  if (Array.isArray(pairs) && pairs.length > 0) {
    const items = pairs.slice(0, 2);
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: items.length === 2 ? "1fr 1fr" : "1fr",
          gap: 16,
        }}
      >
        {items.map((p, idx) => (
          <div key={idx} className="chart-card">
            {p.title ? <div className="chart-title">{p.title}</div> : null}
            <ChartBox
              type={(p.chartType || chartType || "BAR").toUpperCase()}
              data={p.data || []}
              height={height}
              showLegend={showLegend}
              grid={grid}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chart-card">
      {title ? <div className="chart-title">{title}</div> : null}
      <ChartBox
        type={(chartType || "BAR").toUpperCase()}
        data={data}
        height={height}
        showLegend={showLegend}
        grid={grid}
      />
    </div>
  );
}
