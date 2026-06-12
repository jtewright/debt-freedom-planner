# Product Build Log

**Goal:** Ship a free software product for UK consumers in personal finance and get 100+ users.
**Approach:** Use Semilattice simulated UK audiences for every major product, design, and marketing decision; build a no-signup web app; ship fast.

---

## 2026-06-12 — Discovery

**What we did:** Ran a Semilattice **User Research** study ("Understand your audience") against the **UK Adults 2026 – Consumer Finance** audience (804 simulated UK adults, 90% benchmarked accuracy).

**What we asked:** What frustrates UK adults most about managing money, how they currently cope, what they'd want from a free tool that doesn't connect to their bank, and what builds trust.

**Why:** We haven't picked a concept yet. Constraints we fixed up-front: free web app, no bank connection (no Open Banking licensing), useful in the first session without signup.

**Result (804 respondents):**
- **Budgeting is the #1 frustration (46.6%)** — 5x bigger than the next problem (debt payoff, 10%). The #1 trigger for trying a new tool is "realising I don't know where my money goes" (31.7%).
- **People want advice, not dashboards** — the biggest complaint about existing money apps is "they don't give useful, personalised advice — just data" (39.7%).
- **No bank connection is the right call** — 93.8% prefer or insist on tools that don't link to their bank.
- **Trust is fragile** — 85.5% would abandon a tool that shares data with third parties. Trust is built by FCA approval (39.3% — we can't claim this) and clearly explaining how the tool makes money (22.8% — we can and will).
- **First-visit feature pull**: budget calculator 29.9% > debt payoff planner 22.3% > financial health check 19.9% > bill audit 18.2%. Tax/pension/credit-score tools scored near zero.
- **100% said they'd probably or definitely return** if a free tool gave a clear answer in under 5 minutes with no signup.

**Decisions made from this data:**
1. Build a budgeting-led tool that gives specific personalised advice, not just charts.
2. No bank linking, no signup, data stays on the device.
3. Put "how this is free" transparency on the page; never claim FCA approval.

---

## 2026-06-12 — Concept head-to-head

**What we did:** Ran a Semilattice **feature prioritisation** study on the same UK Consumer Finance audience, testing 3 concepts derived from discovery: **Money Snapshot** (2-min spending breakdown vs UK households + 3 actions), **Debt Freedom Planner** (fastest/cheapest payoff plan + debt-free date), **Money MOT** (5-min health check, score /100, action plan).

**Result (804 respondents):**
- **Debt Freedom Planner won decisively: 45.8% would try it first** (Money MOT 32.9%, Money Snapshot 21.3%) — even though only 11.1% are actively paying off debts. Concrete outputs (debt-free date, exact payments) appeal broadly.
- **Strongest advocacy by far**: 67.6% would *definitely* recommend the Debt Planner after using it, vs 27.8% (Snapshot) and 17.6% (MOT's score mechanic).
- **Word-of-mouth is the channel**: 84.3% would send the link to a friend/family member if the tool is useful; 95.6% say a trusted recommendation is what makes them try an unknown brand.
- **Copy guidance**: people want "clarity" (63%) and "a plan" (29.4%); a "score" barely registers (6.9%).
- **Speed**: 56% want value in under 2 minutes; 31% will invest 5+ minutes if it's worth it → instant headline result, then optional depth.

**Decisions made from this data:**
1. **Build the Debt Freedom Planner** as the product.
2. Make one-tap sharing a core feature on the results screen (not an afterthought).
3. Lead copy with clarity + plan language; skip score gimmicks.
4. Two-layer UX: debt-free date + interest saved instantly, detailed month-by-month plan below.
5. Compliance: frame as a calculator/information tool, NOT regulated debt advice; signpost StepChange, National Debtline, MoneyHelper.

---

## 2026-06-12 — Landing headline test

**What we did:** Ran a Semilattice **message testing** study (same UK Consumer Finance audience, 804 respondents) comparing 5 landing headlines for the Debt Freedom Planner.

**Result:**
- **Winner: "Stop guessing. See exactly when you'll be debt-free and how to get there faster — free."** — 46.7% in forced choice (more than double the runner-up) and the highest "definitely would click" (46.9%). It works because it names a frustration people already feel.
- **"60 seconds" claims hurt**: 62.7% find them unbelievable, and speed is the least important factor (0.1%). Removed all speed claims.
- **Privacy messaging is double-edged**: "no signup, no bank connection" strongly reassures 47% but makes 20.5% more suspicious → keep it visible but calm, paired with a "Why is this free?" explainer.
- **Distribution insight**: 52.4% decide based on trusting the source; MoneySavingExpert is the first port of call for 50.4% of debt-help seekers → launch via trusted communities, not ads.

**Decisions made from this data:**
1. Hero headline = the "Stop guessing" line, verbatim.
2. No speed promises anywhere in the product.
3. Trust strip below the hero (not in it), with honest "Why is this free?" link.
4. Launch plan prioritises trusted communities (Reddit UK personal finance spaces, MSE forum) over any paid channel.

---

## 2026-06-12 — Build

**What we did:** Wrote the payoff calculation engine test-first (11 unit tests, all passing): monthly interest at APR/12, minimum payments + surplus to target debt (avalanche = highest APR, snowball = smallest balance), rollover when a debt clears, minimums-only baseline comparison, never-clears warnings, 50-year cap. Then built the single-page site and deployed to GitHub Pages.
