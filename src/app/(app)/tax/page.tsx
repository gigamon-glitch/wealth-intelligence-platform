"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

export default function TaxPage() {
  const [fy, setFy] = useState("2024-25");
  const [form, setForm] = useState({
    salaryIncome: 110000,
    rentalIncome: 26000,
    rentalDeductions: 31000,
    otherIncome: 1200,
    workDeductions: 2500,
    investmentDeductions: 800,
  });
  const [cg, setCg] = useState([{ proceeds: 12000, costBase: 9000, heldDays: 400 }]);
  const [result, setResult] = useState<{
    result: {
      taxableIncome: number;
      totalTax: number;
      grossIncomeTax: number;
      litoApplied: number;
      incomeTax: number;
      medicareLevy: number;
      marginalRateApprox: number;
      explanations: string[];
    };
    optimizationChecklist?: { priority: string; action: string; why: string }[];
    disclaimer: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/tax/profile")
      .then((r) => r.json())
      .then((j) => {
        const p = j.profiles?.[0];
        if (p) {
          setFy(p.financialYear);
          setForm({
            salaryIncome: Number(p.salaryIncome),
            rentalIncome: Number(p.rentalIncome),
            rentalDeductions: Number(p.rentalDeductions),
            otherIncome: Number(p.otherIncome),
            workDeductions: Number(p.workDeductions),
            investmentDeductions: Number(p.investmentDeductions),
          });
          if (Array.isArray(p.capitalGains)) setCg(p.capitalGains);
        }
      });
  }, []);

  async function save() {
    await fetch("/api/tax/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financialYear: fy, ...form, capitalGains: cg }),
    });
  }

  async function calculate() {
    const res = await fetch("/api/tax/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financialYear: fy, ...form, capitalGains: cg }),
    });
    const j = await res.json();
    setResult(j);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Tax Agent (AU)</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Advanced resident estimator (marginal tax, simplified LITO, Medicare shading, CGT discount) — educational
          only. Does not replace a registered tax agent for lodgement or personal advice.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-zinc-500">Financial year</span>
        <input
          className="mt-1 w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          value={fy}
          onChange={(e) => setFy(e.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(form).map(([k, v]) => (
          <label key={k} className="text-sm">
            <span className="text-zinc-500">{k}</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              value={v}
              onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) })}
            />
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">Capital gains (stocks, crypto, property, metals)</p>
        {cg.map((row, i) => (
          <div key={i} className="mt-2 grid grid-cols-3 gap-2">
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="Proceeds"
              value={row.proceeds}
              onChange={(e) => {
                const n = [...cg];
                n[i].proceeds = parseFloat(e.target.value);
                setCg(n);
              }}
            />
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="Cost base"
              value={row.costBase}
              onChange={(e) => {
                const n = [...cg];
                n[i].costBase = parseFloat(e.target.value);
                setCg(n);
              }}
            />
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="Held days"
              value={row.heldDays}
              onChange={(e) => {
                const n = [...cg];
                n[i].heldDays = parseInt(e.target.value, 10);
                setCg(n);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="mt-2 text-sm text-emerald-700"
          onClick={() => setCg([...cg, { proceeds: 0, costBase: 0, heldDays: 0 }])}
        >
          + Add lot
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={save}
        >
          Save profile
        </button>
        <button
          type="button"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white"
          onClick={calculate}
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold">Estimated tax payable</p>
          <p className="text-2xl font-bold">{formatMoney(result.result.totalTax)}</p>
          <p className="text-sm text-zinc-600">
            Taxable income {formatMoney(result.result.taxableIncome)} · Marginal rate (approx){" "}
            {(result.result.marginalRateApprox * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-zinc-600">
            Gross tax (scales) {formatMoney(result.result.grossIncomeTax)} · LITO (model) −
            {formatMoney(result.result.litoApplied)} · Income tax after LITO {formatMoney(result.result.incomeTax)} ·
            Medicare {formatMoney(result.result.medicareLevy)}
          </p>
          {result.optimizationChecklist && result.optimizationChecklist.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Optimisation checklist</p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-900/90 dark:text-emerald-100/90">
                {result.optimizationChecklist.map((o) => (
                  <li key={o.action}>
                    <span className="font-medium">[{o.priority}]</span> {o.action}
                    <span className="block text-xs text-emerald-800/80 dark:text-emerald-200/80">{o.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
            {result.result.explanations.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
