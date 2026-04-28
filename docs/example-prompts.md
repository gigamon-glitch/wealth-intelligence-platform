# Example AI Advisor Prompts

Use these with `/api/ai/chat` or the **AI Advisor** page. The server injects your dashboard aggregates, optional tax estimate, and **Financial memory** — answers stay grounded when data exists.

1. **Savings rate**

   > Given my last three months of income and expenses in context, what is a realistic savings rate target for the next quarter, and which spending categories should I tackle first?

2. **Asset allocation**

   > My allocation JSON shows concentration in property and Australian equities. What are three ways to diversify without ignoring currency and home bias, and what are the trade-offs?

3. **Debt vs invest**

   > Compare applying an extra $500/month to my home loan versus investing it in a broad ETF, using my current loan rate and risk tolerance from memory. Show reasoning, not a single number.

4. **FIRE / retirement**

   > Estimate years to financial independence using my net worth, savings rate, and a conservative real return assumption. List the sensitive assumptions explicitly.

5. **Tax (AU, educational)**

   > Explain how negative gearing on my rental inputs affects taxable income in the model, and what items I should verify with a tax agent before acting.

6. **Precious metals**

   > How should I think about jewellery versus investment bullion for reporting and portfolio risk, given my gold/silver positions?

7. **Rebalancing**

   > Using my sector allocation, propose a rebalancing sequence that minimises transaction costs and tax friction in Australia.

8. **Risk & limitations**

   > What are the top risks in following AI-generated financial suggestions, and how should I validate them?

**Tip:** Keep **Financial memory** (`/advisor`) updated with goals, horizon, and constraints so answers stay personal without storing full account numbers in chat.
