"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

type Asset = {
  id: string;
  category: string;
  name: string;
  currency: string;
  value: string;
  costBasis: string | null;
  details: unknown;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [spots, setSpots] = useState<{ gold: { audPerOz: number }; silver: { audPerOz: number } } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((j) => setAssets(j.assets ?? []));
    fetch("/api/prices/metals")
      .then((r) => r.json())
      .then((j) => {
        if (!j.error) setSpots(j);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Assets</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Multi-asset book — metals include weight, purity, and jewellery vs investment classification in
          JSON details.
        </p>
      </div>

      {spots && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">Spot reference (AUD/oz)</p>
          <p className="mt-1 text-emerald-800 dark:text-emerald-100/90">
            Gold: {formatMoney(spots.gold.audPerOz)} · Silver: {formatMoney(spots.silver.audPerOz)}
          </p>
          <p className="text-xs text-emerald-800/80">Configure METALS_API_URL + METALS_API_KEY for live feeds.</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Cost basis</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3">{a.category}</td>
                <td className="px-4 py-3">{formatMoney(Number(a.value), a.currency)}</td>
                <td className="px-4 py-3">{a.costBasis ? formatMoney(Number(a.costBasis), a.currency) : "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-zinc-500">
                  {JSON.stringify(a.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
