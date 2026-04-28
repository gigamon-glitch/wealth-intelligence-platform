"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

type Goal = {
  id: string;
  name: string;
  type: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((j) => setGoals(j.goals ?? []));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Goals</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Track deposits, FIRE targets, and major purchases — tie funding to cash flow over time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100);
          return (
            <div key={g.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-medium">{g.name}</p>
              <p className="text-xs text-zinc-500">{g.type}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm">
                {formatMoney(Number(g.currentAmount))} / {formatMoney(Number(g.targetAmount))} (
                {pct.toFixed(0)}%)
              </p>
              {g.targetDate && (
                <p className="text-xs text-zinc-500">Target {new Date(g.targetDate).toLocaleDateString()}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
