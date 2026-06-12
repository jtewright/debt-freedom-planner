# Debt Freedom Planner — Design

**Date:** 2026-06-12
**Status:** Approved (decisions delegated; validated via Semilattice studies 4d51bac5, fad3e069)

## What it is

A free, single-page web tool for UK consumers. You list your debts (credit cards, overdrafts, loans, car finance, BNPL, store cards) and what you can afford each month. It instantly shows:

1. **Your debt-free date** (headline, above the fold of results)
2. **Interest saved and time saved** vs paying minimums only
3. **The payoff order** — cheapest-first (avalanche) vs smallest-first (snowball), compared, with a recommendation
4. **Exactly what to pay on each debt this month**, and a month-by-month plan

No signup. No bank connection. All data stays in the browser (localStorage). Works well on mobile.

## Why this product (evidence)

- Semilattice discovery (804 UK adults): budgeting #1 frustration, but tools fail on "advice not data"; 93.8% prefer no bank linking.
- Concept head-to-head: Debt Freedom Planner first choice for 45.8% (beat Money MOT 32.9%, Money Snapshot 21.3%); 67.6% would *definitely* recommend after use — strongest advocacy of the three.
- 84.3% would share a useful tool with friends/family → one-tap sharing is a core feature.
- Speed split (56% want <2 min, 31% will go deep) → instant headline result + collapsible depth.

## Scope

**In:** debt entry (name/type/balance/APR/min payment), monthly budget input, avalanche vs snowball simulation, minimums-only baseline, debt-free date, interest/time saved, this-month payment list, month-by-month schedule, share (Web Share API + WhatsApp + copy), localStorage persistence, "Why is this free?" explainer, not-advice disclaimer with StepChange / National Debtline / MoneyHelper signposting, example/demo data button.

**Out (YAGNI):** accounts, server/backend, bank connections, overpayment fees modelling, promotional-rate expiry schedules (flag as caveat), mortgages (excluded by design — different problem), currency other than GBP, PDF export.

## Architecture

Static site, no build step, no framework. Three files plus tests:

- `index.html` — landing section + planner + results (single page, progressive reveal)
- `css/style.css` — design system
- `js/engine.js` — pure calculation module (ES module, no DOM): simulate payoff given debts, budget, strategy. Unit-tested with `node --test`.
- `js/app.js` — DOM wiring, localStorage, share, rendering
- `test/engine.test.js`

Deploy: GitHub repo (account `jtewright`) + GitHub Pages.

## Calculation rules (engine)

- Monthly interest per debt = balance × APR/1200, applied before payment each month.
- Pay minimum on every debt; remaining budget ("surplus") goes to the target debt: avalanche = highest APR first; snowball = smallest balance first. When a debt clears, its payment rolls into the surplus.
- Baseline = minimums only (fixed £ as entered).
- Validation: budget must be ≥ sum of minimums (else prompt); if a min payment ≤ monthly interest, warn that the debt never shrinks; cap simulation at 50 years.
- Outputs: months to zero, debt-free date, total interest per strategy, baseline comparison, per-month payment schedule.

## Trust & compliance

- Prominent: "Free. No signup. No bank connection. Your numbers never leave your device."
- "Why is this free?" link → honest one-paragraph explainer (side project, no data collection, no affiliate links).
- Footer disclaimer: information tool, not regulated debt advice; if struggling, free help from StepChange, National Debtline, MoneyHelper (linked).
- No analytics that send personal data; at most a privacy-friendly hit counter (decide at ship time).

## Error handling

- Inline validation on numeric fields (no negative balances, APR 0–100, budget sanity check with helpful message showing sum of minimums).
- Never-clears warning surfaced per debt.
- Empty state: "Try an example" button loads realistic demo debts.

## Testing

- Engine: unit tests for interest math, payoff ordering, rollover ("snowball effect"), baseline comparison, never-clears detection, zero-APR debts.
- UX: Semilattice User Journey usability test against the deployed URL; iterate on comprehension issues.
- Messaging: Semilattice headline test (sim 916fc331) decides the landing H1.
