import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#22c55e", "#eab308", "#a78bfa", "#fb7185",
];

// Try to produce a nice x-label if the backend sends dates/timestamps
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
    d?.name ??
    d?.nomineeName ??
    d?.label ??
    (dateish ? toLabelDate(dateish) : "");
  const value =
    typeof d?.value === "number"
      ? d.value
      : typeof d?.votes === "number"
      ? d.votes
      : typeof d?.count === "number"
      ? d.count
      : typeof d?.percent === "number"               // added
      ? d.percent
      : typeof d?.percentOfEligible === "number"     // kept for compatibility
      ? d.percentOfEligible
      : 0;

  return { name, value };
}

/**
 * Props:
 *  - chartType: "BAR" | "PIE" | "LINE"
 *  - data: array from your endpoints (leaders/genders/trend/etc.)
 *  - height: number (px)
 *  - showLegend: boolean
 *  - grid: boolean
 */
export default function ChartArea({
  chartType = "BAR",
  data = [],
  height = 300,
  showLegend = true,
  grid = true,
}) {
  const rows = Array.isArray(data) ? data.map(toRow) : [];

  if (!rows.length) {
    return (
      <div className="cvp-empty bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500">
        No data available
      </div>
    );
  }

  if (chartType === "PIE") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            outerRadius={Math.max(80, height / 2 - 30)}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
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

  if (chartType === "LINE") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows}>
          {grid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // default BAR
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
