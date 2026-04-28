"use client";

import { useEffect, useState } from "react";
import { AllocationPie, NetWorthLine } from "@/components/charts/dashboard-charts";
import { formatMoney } from "@/lib/format";

type Summary = {
  totals: { totalAssets: number; totalDebts: number; netWorth: number; inflationAdjusted: number };
  allocation: { category: string; value: number; pct: number }[];
  health: { score: number; notes: string[] };
  burnSeries: { month: string; total: number }[];
  netWorthHistory: { date: string; net: number; inflationAdjusted: number }[];
  alerts: { type: string; message: string; severity: string }[];
  cpiAssumedAnnual: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch(() => setError("Failed to load"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-zinc-500">Loading dashboard…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Consolidated view with inflation-adjusted net worth (CPI assumption{" "}
          {(data.cpiAssumedAnnual * 100).toFixed(1)}% p.a. — replace with ABS series in production).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase text-zinc-500">Net worth</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(data.totals.netWorth)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase text-zinc-500">Inflation-adjusted (simple)</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(data.totals.inflationAdjusted)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase text-zinc-500">Health score</p>
          <p className="mt-2 text-2xl font-semibold">{data.health.score}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
            {data.health.notes.slice(0, 3).map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>

      {data.alerts?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Smart alerts</p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900/90 dark:text-amber-100/90">
            {data.alerts.map((a) => (
              <li key={a.message}>{a.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Asset allocation</h2>
          <AllocationPie data={data.allocation} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Net worth history</h2>
          <NetWorthLine data={data.netWorthHistory} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Burn rate (6 mo)</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {data.burnSeries.map((b) => (
            <div key={b.month} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/80">
              <div className="text-xs text-zinc-500">{b.month}</div>
              <div className="font-medium">{formatMoney(b.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
