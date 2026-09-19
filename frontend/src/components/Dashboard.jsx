import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "../api.js";

/*
 * Dashboard is the operations view. It calls /api/stats and shows:
 *   - summary cards (utilization, GPUs in use, pending requests)
 *   - a bar chart of GPU demand by type, drawn with recharts
 *
 * recharts is a popular React charting library. You feed it an array of
 * objects and tell it which keys map to the X and Y axes — it handles the SVG.
 */

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="empty">Loading dashboard...</p>;

  const statusOrder = ["pending", "approved", "running", "completed", "denied"];

  return (
    <div className="stack">
      <div className="metric-row">
        <Metric
          label="Cluster utilization"
          value={`${stats.utilization_pct}%`}
          hint={`${stats.in_use} of ${stats.capacity} GPUs in use`}
        />
        <Metric label="GPUs in use" value={stats.in_use} hint="approved + running" />
        <Metric
          label="Pending requests"
          value={stats.pending_count}
          hint="awaiting approval"
        />
      </div>

      <section className="card">
        <h2 className="card-title">GPU demand by type</h2>
        <p className="card-subtitle">Total GPUs requested across all jobs.</p>
        <div className="chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.gpus_by_type}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e1da" vertical={false} />
              <XAxis dataKey="gpu_type" stroke="#6b6a64" tickLine={false} />
              <YAxis stroke="#6b6a64" tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e3e1da",
                  fontSize: 14,
                }}
              />
              <Bar dataKey="gpus" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Jobs by status</h2>
        <div className="status-grid">
          {statusOrder.map((s) => (
            <div key={s} className="status-cell">
              <span className="status-count">{stats.jobs_by_status[s] || 0}</span>
              <span className="status-label">{s}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-hint">{hint}</span>
    </div>
  );
}
