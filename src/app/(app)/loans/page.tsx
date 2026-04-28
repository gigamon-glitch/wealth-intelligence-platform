"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

type Loan = {
  id: string;
  name: string;
  type: string;
  principalRemaining: string;
  interestRateAnnual: string;
  monthlyPayment: string;
  termMonths: number;
};

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [schedule, setSchedule] = useState<{ month: number; principal: number; interest: number; balance: number }[]>(
    []
  );
  const [extra, setExtra] = useState(200);

  useEffect(() => {
    fetch("/api/loans")
      .then((r) => r.json())
      .then((j) => setLoans(j.loans ?? []));
  }, []);

  useEffect(() => {
    if (loans[0]) loadSchedule(loans[0].id, extra);
  }, [loans, extra]);

  async function loadSchedule(id: string, e: number) {
    const res = await fetch(`/api/loans/${id}/schedule?extraPrincipal=${e}`);
    const j = await res.json();
    setSchedule(j.schedule ?? []);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Amortization preview with optional extra principal for early payoff simulation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loans.map((l) => (
          <button
            type="button"
            key={l.id}
            onClick={() => loadSchedule(l.id, extra)}
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="font-medium">{l.name}</p>
            <p className="text-xs text-zinc-500">{l.type}</p>
            <p className="mt-2 text-sm">
              Balance {formatMoney(Number(l.principalRemaining))} · Rate {Number(l.interestRateAnnual).toFixed(2)}%
            </p>
            <p className="text-sm">Payment {formatMoney(Number(l.monthlyPayment))} / mo</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm">Extra principal / month</label>
        <input
          type="number"
          className="w-32 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          value={extra}
          onChange={(e) => setExtra(parseFloat(e.target.value) || 0)}
        />
        {loans[0] && (
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
            onClick={() => loadSchedule(loans[0].id, extra)}
          >
            Recalculate
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Principal</th>
              <th className="px-4 py-3">Interest</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {schedule.slice(0, 12).map((r) => (
              <tr key={r.month} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">{r.month}</td>
                <td className="px-4 py-3">{formatMoney(r.principal)}</td>
                <td className="px-4 py-3">{formatMoney(r.interest)}</td>
                <td className="px-4 py-3">{formatMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
