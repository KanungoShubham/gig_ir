# Income Reconciler

A small, production-minded feature: freelancers/gig workers earn from multiple
platforms (Upwork, Fiverr, direct/UPI clients) with different fee structures
and currencies. This app reconciles all of it into one dashboard — net income
after platform fees, and a recommended "safe to spend" amount after setting
aside money for tax.

Built in **Next.js (App Router) + TypeScript + Tailwind**, per the take-home
brief's stack options. The scope is deliberately narrow — one well-tested
feature rather than a full app — to fit the intended 2–3 hour effort.

## What it does

- **Demo login/signup** gate (see "Assumptions" — this is not real auth).
- Lists income entries per platform, with description, amount, currency, and
  date.
- **Reconciles** each entry: converts to INR, applies a per-platform fee rate,
  and computes net income.
- Dashboard shows four live metrics: **gross income**, **platform fees**,
  **net income**, and **safe to spend** (net income minus a tax set-aside).
- **Add entry** form with validation (description required, amount must be
  > 0).
- **Remove entry** per row.
- Seeded with sample entries on first login so the dashboard isn't empty.
- Two data visualizations: a **net income by platform** bar chart and a
  **cumulative net income over time** line chart, both with hover tooltips
  and a "view as table" toggle for accessibility (see "Key technical
  decisions").
- A demo account (`demo@incomereconciler.app` / `demo1234`) is shown directly
  on the login screen with one-click copy/fill, so a reviewer doesn't have to
  sign up to see the app with data.

## Setup & run

Requires Node 18+.

```bash
npm install
npm run dev        # starts the app at http://localhost:3000
npm run build      # type-checks and produces a production build
```

## Running the tests

```bash
npm test           # runs the full Jest suite once
npm run test:watch # watch mode
```

37 tests, split into three layers:

- `lib/reconciliation.test.ts` — unit tests for the pure business logic
  (currency conversion, per-platform fee rates, tax set-aside, floating point
  rounding on money sums, invalid-input handling, the platform-breakdown and
  trend aggregations that feed the charts).
- `lib/auth.test.ts` — unit tests for the demo auth logic (signup/login
  validation, duplicate accounts, wrong password, email normalization).
- `components/EntryForm.test.tsx` — integration test for the add-entry form
  (happy path + two validation edge cases), using Testing Library.

## Assumptions

Since the brief was intentionally open-ended, I made these calls and want to
flag them explicitly:

1. **Platform fee rates are flat approximations**: Upwork 10%, Fiverr 20%,
   direct/UPI 0%, anything else 5%. Real platforms use tiered rates (e.g.
   Upwork's fee depends on lifetime billings with a specific client). A flat
   rate keeps the demo's logic simple and testable; the rate table
   (`PLATFORM_FEE_RATES` in `lib/reconciliation.ts`) is the one place you'd
   update for real rates.
2. **Currency conversion uses a fixed demo rate** (1 USD = ₹83), not a live
   FX API. This is clearly a placeholder — a real version would call a rates
   service and cache/refresh it periodically.
3. **"Safe to spend" = net income × (1 − 30%)**. The 30% is a simplified
   buffer for tax + irregular-income safety margin, not a literal
   computation of Indian presumptive-taxation rules (Section 44ADA etc.). I
   deliberately avoided presenting this as tax advice — it's a configurable
   parameter (`summarize(entries, taxSetAsideRate)`), not a hardcoded law.
4. **No backend / no real auth**: there's no server. "Accounts" and income
   entries are stored in the browser's `localStorage`, and passwords are
   hashed client-side with a fast, non-cryptographic hash (FNV-1a) — this
   exists only so a plaintext password never sits in `localStorage` during
   the demo. **This is not production security.** A real version would do
   password hashing (bcrypt/argon2) and session issuance server-side, and
   store entries in a real database scoped to the authenticated user.
5. **Per-user data isolation**: entries are keyed by email in `localStorage`
   so switching between demo accounts in the same browser doesn't mix data,
   mimicking how a real multi-tenant backend would scope data per user.
6. **New accounts are seeded with 4 sample entries** so the dashboard has
   something to show immediately, rather than starting empty. This was a
   product decision to make the demo self-explanatory without manual data
   entry first.
7. **Money rounding**: every INR amount is rounded to 2 decimal places on
   computation (`round2`) to avoid floating-point drift when summing many
   entries — treated as a financial-ledger requirement, not just display
   formatting.

## Key technical decisions

- **Business logic is pure and framework-free** (`lib/reconciliation.ts`).
  Fee calculation, currency conversion, and the tax set-aside math don't
  import React or Next.js APIs, so they're trivial to unit test and would
  drop into a real backend unchanged if this logic ever needs to run
  server-side.
- **Auth and entry storage are isolated in their own modules**
  (`lib/auth.ts`, `lib/entriesStore.ts`) behind a small function-based API
  (`signUp`, `logIn`, `loadEntries`, `addEntry`, ...). The `localStorage`
  usage is the one seam you'd replace with real API calls to point this at
  an actual backend — nothing else in the app knows or cares that it's
  mocked.
- **Reconciliation runs on every render from raw entries** (`summarize()`
  is called in the dashboard page, not cached) — the entry list is small
  enough that recomputing is simpler and less bug-prone than maintaining
  derived state.
- **App Router with two routes**: `/` (login/signup) and `/dashboard`
  (protected). Route protection is a client-side check (`currentUser()` on
  mount, redirect if absent) since there's no server session — documented
  as a limitation below.
- **Tailwind for styling** to keep the UI clean without hand-rolling CSS or
  pulling in a component library for an exercise this size.
- **Charts are hand-rolled inline SVG, not a charting library** (`components/
  charts/`). For two small, fixed-shape charts, a library was more weight
  than value. They follow a fixed data-viz methodology rather than ad hoc
  styling: a validated colorblind-safe categorical palette (checked with an
  automated Delta-E/contrast validator, not eyeballed), one fixed hue order
  so a platform's color never changes between charts, direct labels instead
  of a legend box, hover tooltips backed by a keyboard-reachable table view
  (so no value is hover-only), and a single y-axis on the trend chart (never
  dual-axis).

## Limitations & what I'd do with more time

- Wire up a real backend (Node/Express or a Laravel API, matching the
  "either stack" option in the brief) with real password hashing, session
  cookies, and a database — instead of the `localStorage` mock.
- Server-side route protection (middleware checking a real session) instead
  of a client-side redirect, which currently flashes the dashboard shell
  before checking auth.
- Live FX rates instead of the fixed USD→INR conversion constant.
- Configurable per-platform fee rates and tax set-aside rate exposed in the
  UI (currently constants in code).
- Edit an existing entry (currently only add/remove).
- CSV import for bulk-adding entries from platform payout exports, which is
  how most freelancers would actually get data in.
- Pagination/sorting/filtering on the entries table for users with a long
  history.
- An end-to-end test (Playwright) covering the real login → add entry →
  see updated totals flow, on top of the current unit + integration tests.
