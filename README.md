# Wealth Intelligence Platform

Production-oriented personal finance dashboard: multi-asset book (including gold/silver with purity and jewellery vs investment classification), cash-flow analytics, Australian tax estimation (educational), loan amortization with early payoff simulation, portfolio analytics hooks, and an OpenAI-powered advisor that receives structured financial context and long-term memory.

## Architecture (high level)

- **Frontend:** Next.js App Router, Tailwind CSS, Recharts, `next-themes` (dark/light).
- **Backend:** Next.js Route Handlers (`src/app/api/**`) — API-first modules under `src/lib/services`, `src/lib/tax`, `src/lib/finance`.
- **Data:** PostgreSQL + Prisma (`prisma/schema.prisma`). Type-specific fields use JSON `details` for extensibility (brokers, bank feeds later).
- **Auth:** NextAuth.js with Google OAuth; optional **demo credentials** when `DEMO_AUTH=true` (see seed).
- **Security:** No secrets in repo; optional AES-GCM for sensitive notes via `ENCRYPTION_KEY`; AI keys server-side only.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local Docker Compose file provided), or a hosted Postgres URL

## Setup

1. **Install dependencies**

   ```bash
   cd wealth-intelligence-platform
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Set at minimum:

   - `DATABASE_URL` — PostgreSQL connection string.
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000`
   - **Either** Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) **or** demo auth:
     - `DEMO_AUTH=true` (local only) and use seeded credentials after `db:seed`.

   Optional:

   - `OPENAI_API_KEY` — enables AI advisor.
   - `ENCRYPTION_KEY` — encrypts optional asset notes at rest.
   - `METALS_API_URL` / `METALS_API_KEY` — live precious-metal spot feeds (falls back to cached/fallback AUD/oz).

3. **Database**

   ```bash
   # Start Postgres (example)
   docker compose up -d

   npx prisma db push
   npm run db:seed
   ```

   To **browse data** (this app uses PostgreSQL, not SQLite): use [TablePlus](https://tableplus.com/), [DBeaver](https://dbeaver.io/), [Postico](https://eggerapps.at/postico/), or your host’s SQL console (e.g. Neon). **DB Browser for SQLite** only opens `.db` SQLite files and does not speak PostgreSQL.

4. **Run**

   ```bash
   npm run dev
   ```

   `npm run dev` first runs **`scripts/ensure-db.mjs`**: it starts PostgreSQL via **Docker Compose** (if needed), waits until port **5433** accepts connections, then runs **`prisma db push`**.

   - No Docker? Use a **hosted Postgres** URL in `DATABASE_URL`, run `npx prisma db push`, then `SKIP_DB_ENSURE=1 npm run dev`.
   - Open [http://localhost:3000](http://localhost:3000) — use **`localhost`**, not `127.0.0.1`, to match `NEXTAUTH_URL`.

   With `DEMO_AUTH=true`, sign in as `demo@wealth.local` / `demo123`.

### Google sign-in loops or fails

1. **PostgreSQL must be running** — OAuth uses the Prisma adapter to create/link your user. Start the DB (`docker compose up -d` or a hosted URL), then `npx prisma db push` (and `npm run db:seed` if you use demo data).
2. **`NEXTAUTH_URL` must match the browser URL** — If you open `http://127.0.0.1:3000`, set `NEXTAUTH_URL=http://127.0.0.1:3000` (not `localhost`). Mismatch breaks cookies and looks like a loop.
3. **Google Cloud redirect URI** — In [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials), add exactly:  
   `http://localhost:3000/api/auth/callback/google` (and the `127.0.0.1` variant if you use it). The OAuth client name (e.g. “Wealth Dashboard”) is the consent screen title, not this repo.
4. **Read the red error on the login card** — After a failed callback, NextAuth sends you back to `/` with `?error=...`. The app now shows what that code means.

## Scripts

| Script            | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Next.js dev server         |
| `npm run build`   | Prisma generate + production build |
| `npm run db:push` | Apply schema to database   |
| `npm run db:seed` | Seed demo data             |

## Key folders

| Path | Purpose |
| ---- | ------- |
| `prisma/schema.prisma` | Data model (assets, expenses, loans, tax profiles, snapshots, alerts, FX cache) |
| `src/lib/services/` | Dashboard, metals pricing, AI advisor orchestration |
| `src/lib/tax/` | AU resident tax estimation (simplified) |
| `src/lib/finance/` | Amortization, FX conversion |
| `src/app/api/` | REST-style API routes |
| `src/app/(app)/` | Authenticated UI (dashboard, assets, …) |

## API & prompts

- HTTP API reference: [`docs/API.md`](docs/API.md)
- Example advisor prompts: [`docs/example-prompts.md`](docs/example-prompts.md)

## Compliance & disclaimers

Tax and AI outputs are **educational** and **not** personal tax or financial advice. Wire a registered tax agent and licensed adviser for real decisions.

## Licence

Private / unlicensed — adjust for your deployment.
