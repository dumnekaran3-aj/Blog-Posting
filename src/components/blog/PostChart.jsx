import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Same 7-color family as the text-color presets (src/utils/textFormatting.js)
// so charts visually match the rest of the editor's palette.
const CHART_COLORS = ["#2563EB", "#DC2626", "#16A34A", "#EA580C", "#9333EA", "#CA8A04", "#0F172A"];

const MAX_ROWS = 20;

export default function PostChart({ type, rows }) {
  // Re-validate here (not just at insert time) — content could have been
  // edited directly via the API, bypassing the chart builder UI entirely.
  const cleanRows = rows
    .map((r) => ({ label: String(r.label).slice(0, 40), value: Number(r.value) }))
    .filter((r) => r.label && Number.isFinite(r.value))
    .slice(0, MAX_ROWS);

  if (cleanRows.length === 0) return null;

  return (
    <div className="w-full h-72 my-3 border border-borderClr rounded-md p-3 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        {type === "pie" ? (
          <PieChart>
            <Pie data={cleanRows} dataKey="value" nameKey="label" outerRadius="80%" label>
              {cleanRows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : type === "line" ? (
          <LineChart data={cleanRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} />
          </LineChart>
        ) : (
          <BarChart data={cleanRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}