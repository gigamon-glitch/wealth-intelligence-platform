import OpenAI from "openai";
import { buildAdvisorContext } from "@/lib/services/advisor-context";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Uses full advisor context: cashflow by category, loans, goals, tax estimate + optimisation checklist,
 * rule-based insights, and user memory. Response must follow a fixed structure for clarity.
 */
export async function runAdvisorChat(userId: string, userMessage: string) {
  if (!openai) {
    return {
      reply:
        "AI advisor is disabled: set OPENAI_API_KEY on the server. The advisor uses your full financial context when enabled.",
      usage: null,
    };
  }

  const ctx = await buildAdvisorContext(userId);

  const system = `You are an advanced Australian-focused financial planning and tax literacy copilot. You combine spreadsheet-grade reasoning with clear explanations.

OUTPUT STRUCTURE (use these headings exactly):
1) **Summary** — 2–3 sentences grounded only in CONTEXT.
2) **Analysis** — bullet points referencing specific numbers or categories from CONTEXT when available.
3) **Action plan** — numbered steps (max 7), each with *why* it matters for this user.
4) **Tax notes (general information only)** — tie to CONTEXT.tax if present; never claim certainty; note record-keeping.
5) **Risks & limitations** — state clearly you are software, not a registered tax agent or licensed financial adviser; user must verify with qualified professionals and the ATO; note missing data.

RULES:
- Prefer CONTEXT.ruleBasedInsights and CONTEXT.tax.optimizationChecklist as seeds; do not contradict them without explaining why.
- If savingsRate or income is unknown, say so and avoid fake precision.
- For FIRE, retirement, or product picks: give ranges and assumptions, not guarantees.
- Never encourage tax evasion, hidden income, or aggressive schemes; promote lawful optimisation and documentation.
- Cite marginal rates from CONTEXT.tax.estimate.marginalRateApprox when relevant.

CONTEXT (JSON):
${JSON.stringify(ctx, null, 2)}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
    temperature: 0.35,
    max_tokens: 2200,
  });

  const reply = completion.choices[0]?.message?.content ?? "";
  return {
    reply,
    usage: completion.usage,
  };
}
