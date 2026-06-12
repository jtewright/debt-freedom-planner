# Decision Inheritance Graph

How the product evolved through Semilattice simulations. Every simulation node lists the
decisions it produced; every decision lists where it flowed (next simulation, spec, build).
Sim IDs are real Semilattice simulation IDs (first 8 chars).

```mermaid
graph TD
    C0[Constraints fixed up-front:<br/>free web app, no Open Banking,<br/>value in first session, no signup]

    S1["S1 · Discovery survey<br/>understand_users · UK Consumer Finance n=804<br/>sim 4d51bac5 · 2026-06-12"]
    C0 --> S1

    S1 -->|"budgeting #1 pain 46.6%<br/>'advice not dashboards' 39.7%"| D1[D1: Product must give specific<br/>personalised actions, not charts]
    S1 -->|"93.8% prefer no bank link"| D2[D2: Manual input only —<br/>no bank connection, confirmed]
    S1 -->|"85.5% abandon over data sharing<br/>22.8% trust 'explains why free'"| D3[D3: Data stays on device;<br/>'Why is this free?' on page;<br/>never claim FCA approval]
    S1 -->|"first-visit pull: budget 29.9%,<br/>debt 22.3%, check-up 19.9%"| D4[D4: Shortlist 3 concepts:<br/>Money Snapshot, Debt Freedom<br/>Planner, Money MOT]

    D1 --> S2
    D4 --> S2
    S2["S2 · Concept head-to-head<br/>prioritise_features · same audience n=804<br/>sim fad3e069 · 2026-06-12"]

    S2 -->|"45.8% try-first, 67.6% definite<br/>recommend — both highest"| D5[D5: BUILD DEBT FREEDOM PLANNER<br/>kill Snapshot & MOT as v1]
    S2 -->|"84.3% would send link to a friend;<br/>95.6% trust personal recs"| D6[D6: One-tap share on results<br/>screen is a core feature]
    S2 -->|"63% want 'clarity', 29% 'a plan',<br/>score only 6.9%"| D7[D7: Copy = clarity + plan language;<br/>no score gimmick]
    S2 -->|"56% want value &lt;2 min,<br/>31% will go deep"| D8[D8: Two-layer UX: instant<br/>debt-free date, depth below]

    D5 --> SPEC
    D6 --> SPEC
    D7 --> S3
    D8 --> SPEC
    D2 --> SPEC
    D3 --> SPEC

    S3["S3 · Landing headline test<br/>test_messaging · same audience n=804<br/>sim 916fc331 · 2026-06-12"]
    S3 -->|"46.7% forced-choice win,<br/>46.9% definite click"| D9["D9: H1 = 'Stop guessing. See exactly<br/>when you'll be debt-free and how<br/>to get there faster — free.'"]
    S3 -->|"62.7% disbelieve '60 seconds';<br/>speed matters to 0.1%"| D10[D10: Remove ALL speed claims]
    S3 -->|"privacy reassures 79% but<br/>makes 20.5% suspicious"| D11[D11: Trust strip calm + explained,<br/>not in headline]
    S3 -->|"52.4% decide on source trust;<br/>MSE first stop for 50.4%"| D12[D12: Launch via trusted communities,<br/>not cold ads]
    D9 --> SPEC
    D10 --> SPEC
    D11 --> SPEC
    D12 --> LAUNCH["LAUNCH PLAN (post-build)"]

    SPEC["SPEC v1<br/>docs/superpowers/specs/<br/>2026-06-12-debt-freedom-planner-design.md"]

    SPEC --> BUILD["BUILD: engine.js + tests (11 pass),<br/>UI, GitHub Pages deploy"]
    BUILD --> S4["S4 · Usability journey test (planned)<br/>journey mode on deployed URL"]
    S4 -.->|comprehension fixes| BUILD
```

## Decision register

| ID | Decision | Evidence (sim → data point) | Flows into |
|----|----------|------------------------------|-----------|
| D1 | Give specific personalised actions, not dashboards | S1: 39.7% biggest complaint = "no advice, just data" | S2 concept wording, SPEC results design |
| D2 | Manual input; no bank connection | S1: 93.8% prefer/insist no bank link | SPEC, landing trust strip |
| D3 | Local-only data; "why free" transparency; no FCA claims | S1: 85.5% abandon over data sharing; FCA trust 39.3% (unclaimable); revenue transparency 22.8% | SPEC trust section, footer |
| D4 | Shortlist Snapshot / Debt Planner / Money MOT | S1: first-visit pull rankings (29.9 / 22.3 / 19.9%) | S2 inputs (the three concepts tested) |
| D5 | **Build Debt Freedom Planner** | S2: 45.8% try-first AND 67.6% definite-recommend (both #1) | SPEC scope |
| D6 | One-tap sharing on results | S2: 84.3% would send link; 95.6% trust personal recs | SPEC scope, growth plan |
| D7 | Clarity + plan copy; no score | S2: clarity 63%, plan 29.4%, score 6.9% | S3 headline candidates (all 5 use date/plan/clarity framing) |
| D8 | Instant headline result + optional depth | S2: 56% want <2 min, 31% want depth | SPEC UX (two-layer results) |
| D9 | H1 = "Stop guessing…" | S3: 46.7% forced-choice (2x runner-up), 46.9% definite click | index.html hero |
| D10 | No speed claims ("60 seconds" etc.) | S3: 62.7% find claim unbelievable; speed = 0.1% importance | All copy |
| D11 | Privacy/trust strip calm + explained, not headline | S3: reassures 79% but makes 20.5% suspicious | index.html trust strip + "Why free?" |
| D12 | Distribute via trusted communities (MSE-adjacent, Reddit), not ads | S3: 52.4% decide on source trust; MSE first stop for 50.4% | Launch plan |

## Versioning notes

- **SPEC v1** (2026-06-12): written after S1+S2; D9 placeholder pending S3.
- Each future simulation gets a node (S5, S6…) and its decisions get register rows; superseded decisions will be struck through, not deleted, so the evolution stays visible.
