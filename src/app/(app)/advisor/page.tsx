"use client";

import { useEffect, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

type Insight = {
  id: string;
  severity: "info" | "warn" | "opportunity";
  title: string;
  detail: string;
};

const SUGGESTED = [
  "Given my savings rate and goals, what should I prioritise for the next 90 days?",
  "How does negative gearing in my tax profile interact with my marginal rate — in plain English?",
  "What are the top three risks in my current asset allocation and how do I mitigate them?",
  "Walk me through a FIRE sanity check using my recent spending and net worth.",
];

export default function AdvisorPage() {
  const [memory, setMemory] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(SUGGESTED[0]);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightDisclaimer, setInsightDisclaimer] = useState("");

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((j) => setMemory(j.memory?.content ?? ""));
    fetch("/api/advisor/insights")
      .then((r) => r.json())
      .then((j) => {
        setInsights(j.ruleBasedInsights ?? []);
        setInsightDisclaimer(j.disclaimer ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveMemory() {
    await fetch("/api/memory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: memory }),
    });
  }

  async function send(text?: string) {
    const msg = text ?? input;
    if (!msg.trim()) return;
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const j = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: j.reply ?? j.error ?? "No response" }]);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">AI Advisor</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Deep context from your dashboard, cash flow, loans, goals, tax model, and memory — structured answers
          with explicit limitations.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Important</p>
        <p className="mt-1">
          This tool cannot lawfully replace a <strong>registered tax agent</strong> for preparing or lodging your
          return, or an Australian <strong>licensed financial adviser</strong> for personal advice on financial
          products. Use it to learn, plan, and prepare questions — then confirm with qualified professionals.
        </p>
      </div>

      {insights.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium">Algorithmic insights</p>
          <p className="mt-1 text-xs text-zinc-500">{insightDisclaimer}</p>
          <ul className="mt-3 space-y-3">
            {insights.map((i) => (
              <li
                key={i.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  i.severity === "warn"
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                    : i.severity === "opportunity"
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40"
                }`}
              >
                <span className="font-medium">{i.title}</span>
                <span className="mt-1 block text-zinc-600 dark:text-zinc-400">{i.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">Financial memory</p>
        <p className="text-xs text-zinc-500">
          Stable facts (risk tolerance, horizon, constraints) — improves answer quality without repeating each chat.
        </p>
        <textarea
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          rows={4}
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={saveMemory}
        >
          Save memory
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setInput(s);
              void send(s);
            }}
            disabled={loading}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {s.slice(0, 52)}…
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="max-h-[480px] space-y-3 overflow-y-auto text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 ${
                m.role === "user" ? "ml-8 bg-emerald-50 dark:bg-emerald-950/40" : "mr-8 bg-zinc-50 dark:bg-zinc-800/80"
              }`}
            >
              <p className="text-xs uppercase text-zinc-500">{m.role}</p>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <textarea
            className="flex-1 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => send()}
            className="self-end rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
