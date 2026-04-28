"use client";

import { useEffect, useState } from "react";

export default function InvestmentsPage() {
  const [data, setData] = useState<{
    diversificationScore: number;
    sectorAllocation: { sector: string; pct: number }[];
    rebalancingSuggestions: string[];
    benchmarks: Record<string, { ytdReturn: number; note: string }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/portfolio/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-zinc-500">Loading analytics…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Investment intelligence</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sector tags live on asset details — wire live benchmarks (ASX/S&P) via market data jobs next.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">Diversification score</p>
        <p className="mt-2 text-3xl font-semibold">{data.diversificationScore}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">Sector allocation (listed equities)</p>
        <ul className="mt-3 space-y-2 text-sm">
          {data.sectorAllocation.map((s) => (
            <li key={s.sector} className="flex justify-between">
              <span>{s.sector}</span>
              <span>{(s.pct * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">Benchmarks (illustrative)</p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
          {Object.entries(data.benchmarks).map(([k, v]) => (
            <li key={k}>
              {k}: {(v.ytdReturn * 100).toFixed(1)}% YTD — {v.note}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="font-medium text-emerald-900 dark:text-emerald-200">Rebalancing ideas</p>
        <ul className="mt-2 list-inside list-disc">
          {data.rebalancingSuggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
