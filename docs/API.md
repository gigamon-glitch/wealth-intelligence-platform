# Wealth Intelligence Platform — HTTP API

All endpoints expect a session cookie from NextAuth unless noted. Responses are JSON.

Base URL: same origin as the app (e.g. `http://localhost:3000`).

## Auth

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` / `POST` | `/api/auth/[...nextauth]` | NextAuth (Google OAuth, optional demo credentials) |

## Dashboard & intelligence

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/dashboard/summary` | Net worth, allocation, health score, burn series, net worth history, smart alerts |

## Assets

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/assets` | List assets |
| `POST` | `/api/assets` | Create asset (body validated with `assetCreateSchema`) |
| `PATCH` | `/api/assets/:id` | Partial update |
| `DELETE` | `/api/assets/:id` | Delete |

**Precious metals:** use `category` `GOLD` or `SILVER`; put `weightGrams`, `purityKarats`, `classification` (`JEWELLERY` \| `INVESTMENT`), and `metal` inside `details`.

## Expenses & import

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/expenses?from=&to=` | List expenses (optional date filters) |
| `POST` | `/api/expenses` | Create expense |
| `POST` | `/api/import/expenses` | Raw CSV body: `date,amount,category,description,currency` |

## Loans

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/loans` | List loans |
| `POST` | `/api/loans` | Create loan; returns amortization preview |
| `GET` | `/api/loans/:id/schedule?extraPrincipal=` | Full amortization schedule with optional extra principal |

## Goals

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/goals` | List goals |
| `POST` | `/api/goals` | Create goal |

## Tax (Australia — educational)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/tax/profile` | List saved tax year profiles |
| `PUT` | `/api/tax/profile` | Upsert profile for a financial year |
| `POST` | `/api/tax/calculate` | Body: full profile + `capitalGains[]`, **or** `?financialYear=2024-25` to use saved profile. Returns `result` (incl. gross tax, LITO, Medicare, marginal rate) + `optimizationChecklist` |

## AI advisor & memory

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/advisor/insights` | Rule-based insights + tax checklist snapshot (no OpenAI call) |
| `POST` | `/api/ai/chat` | Body `{ "message": string }` — OpenAI advisor with full `buildAdvisorContext` (cashflow, loans, goals, tax model, optimisations, memory) |
| `GET` | `/api/memory` | Get long-term advisor memory |
| `PUT` | `/api/memory` | Body `{ "content": string }` |

## Market data

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/prices/metals` | Gold/silver spot (AUD/oz) with caching |

## Portfolio analytics

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/portfolio/analytics` | Sector mix, diversification score, placeholder benchmarks |

## Net worth snapshots

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/networth/snapshot` | Upsert today’s snapshot from live aggregates (cron-friendly) |

## Error shape

Validation errors return `400` with `{ error: Zod flattened fields }`. Unauthorized returns `401`.
