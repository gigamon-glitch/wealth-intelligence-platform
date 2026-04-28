"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#059669", "#0ea5e9", "#a855f7", "#f97316", "#64748b", "#eab308", "#ec4899"];

type Allocation = { category: string; value: number; pct: number };
type History = { date: string; net: number; inflationAdjusted: number };

export function AllocationPie({ data }: { data: Allocation[] }) {
  const chart = data.map((d) => ({ name: d.category, value: d.value }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={chart} dataKey="value" nameKey="name" outerRadius={100} label>
            {chart.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) =>
              Number(v ?? 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetWorthLine({ data }: { data: History[] }) {
  if (data.length === 0) return <p className="text-sm text-zinc-500">No snapshots yet — record monthly from the API or cron.</p>;
  const chart = data.map((d) => ({
    date: d.date,
    net: d.net,
    real: d.inflationAdjusted,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) =>
              Number(v ?? 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
            }
          />
          <Line type="monotone" dataKey="net" stroke="#059669" strokeWidth={2} dot={false} name="Nominal" />
          <Line type="monotone" dataKey="real" stroke="#64748b" strokeWidth={1.5} dot={false} name="Stored real" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
