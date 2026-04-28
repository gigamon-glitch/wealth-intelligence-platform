"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

type Expense = {
  id: string;
  amount: string;
  currency: string;
  category: string;
  description: string | null;
  date: string;
};

export default function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((j) => setRows(j.expenses ?? []));
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setStatus("Importing…");
    const res = await fetch("/api/import/expenses", {
      method: "POST",
      body: text,
      headers: { "Content-Type": "text/csv" },
    });
    const j = await res.json();
    setStatus(`Imported ${j.imported}. Errors: ${j.errors?.length ?? 0}`);
    const r = await fetch("/api/expenses").then((x) => x.json());
    setRows(r.expenses ?? []);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          CSV columns: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">date,amount,category,description,currency</code>
        </p>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        Upload CSV
      </label>
      {status && <p className="text-sm text-zinc-600">{status}</p>}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">{new Date(x.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{x.category}</td>
                <td className="px-4 py-3">{formatMoney(Number(x.amount), x.currency)}</td>
                <td className="px-4 py-3">{x.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
