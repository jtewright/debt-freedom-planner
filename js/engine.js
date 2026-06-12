// Pure debt payoff calculation engine. No DOM, no side effects.
// Money is handled in pounds as floats but rounded to pennies at each step
// to keep totals stable over long simulations.

const MAX_MONTHS = 600; // 50-year hard cap

const toPence = (x) => Math.round(x * 100);
const fromPence = (p) => p / 100;

/**
 * Simulate paying off `debts` with a fixed total monthly `budget`.
 * strategy: 'avalanche' (highest APR first) | 'snowball' (smallest balance first)
 * Returns { months, totalInterest, totalPaid, schedule, capped, debtFreeOrder }
 * schedule: [{ month, payments: [{id, amount, interest, balanceAfter}] }]
 */
export function simulatePayoff(debts, budget, strategy) {
  let balances = new Map(debts.map(d => [d.id, toPence(d.balance)]));
  const order = [...debts];
  const schedule = [];
  const debtFreeOrder = [];
  let totalInterest = 0; // pence
  let totalPaid = 0; // pence
  let month = 0;
  let capped = false;
  const budgetP = toPence(budget);

  while ([...balances.values()].some(b => b > 0)) {
    if (month >= MAX_MONTHS) { capped = true; break; }
    month += 1;

    // 1. Accrue interest
    const monthInterest = new Map();
    for (const d of order) {
      const bal = balances.get(d.id);
      if (bal <= 0) continue;
      const interest = Math.round(bal * (d.apr / 1200));
      monthInterest.set(d.id, interest);
      balances.set(d.id, bal + interest);
      totalInterest += interest;
    }

    // 2. Minimum payments on all open debts
    const payments = new Map();
    let remaining = budgetP;
    for (const d of order) {
      const bal = balances.get(d.id);
      if (bal <= 0) continue;
      const pay = Math.min(toPence(d.minPayment), bal, remaining);
      payments.set(d.id, pay);
      remaining -= pay;
    }

    // 3. Surplus to target debt(s) per strategy, rolling over as debts clear
    while (remaining > 0) {
      const open = order.filter(d => balances.get(d.id) - (payments.get(d.id) || 0) > 0);
      if (open.length === 0) break;
      const target = open.sort((a, b) => strategy === 'avalanche'
        ? (b.apr - a.apr) || (balances.get(a.id) - balances.get(b.id))
        : (balances.get(a.id) - balances.get(b.id)) || (b.apr - a.apr)
      )[0];
      const owed = balances.get(target.id) - (payments.get(target.id) || 0);
      const extra = Math.min(owed, remaining);
      payments.set(target.id, (payments.get(target.id) || 0) + extra);
      remaining -= extra;
    }

    // 4. Apply payments
    const monthRow = { month, payments: [] };
    for (const d of order) {
      const pay = payments.get(d.id) || 0;
      if (pay <= 0 && (balances.get(d.id) ?? 0) <= 0) continue;
      const newBal = balances.get(d.id) - pay;
      balances.set(d.id, newBal);
      totalPaid += pay;
      monthRow.payments.push({
        id: d.id,
        name: d.name,
        amount: fromPence(pay),
        interest: fromPence(monthInterest.get(d.id) || 0),
        balanceAfter: fromPence(Math.max(0, newBal)),
      });
      if (newBal <= 0 && !debtFreeOrder.includes(d.id)) debtFreeOrder.push(d.id);
    }
    schedule.push(monthRow);

    // Safety: if nothing was paid this month, balances can never fall.
    if ([...payments.values()].every(p => p === 0)) { capped = true; break; }
  }

  return {
    months: month - (capped ? 0 : 0),
    totalInterest: fromPence(totalInterest),
    totalPaid: fromPence(totalPaid),
    schedule,
    capped,
    debtFreeOrder,
  };
}

/**
 * Compare avalanche and snowball against a minimums-only baseline.
 */
export function comparePlans(debts, budget) {
  const minTotal = debts.reduce((s, d) => s + d.minPayment, 0);
  const baseline = simulatePayoff(debts, minTotal, 'avalanche');
  const avalanche = simulatePayoff(debts, budget, 'avalanche');
  const snowball = simulatePayoff(debts, budget, 'snowball');
  return {
    baseline,
    avalanche,
    snowball,
    interestSaved: round2(baseline.totalInterest - avalanche.totalInterest),
    monthsSaved: baseline.months - avalanche.months,
    snowballExtraInterest: round2(snowball.totalInterest - avalanche.totalInterest),
  };
}

/**
 * Validate inputs. Returns { errors: [], warnings: [], minTotal }.
 * error types: 'budget_too_low'
 * warning types: 'never_clears' (with debtId)
 */
export function validateInputs(debts, budget) {
  const errors = [];
  const warnings = [];
  const minTotal = round2(debts.reduce((s, d) => s + d.minPayment, 0));
  if (budget < minTotal) {
    errors.push({ type: 'budget_too_low', minTotal });
  }
  for (const d of debts) {
    const monthlyInterest = d.balance * (d.apr / 1200);
    if (d.minPayment <= monthlyInterest) {
      warnings.push({ type: 'never_clears', debtId: d.id, monthlyInterest: round2(monthlyInterest) });
    }
  }
  return { errors, warnings, minTotal };
}

export function round2(x) {
  return Math.round(x * 100) / 100;
}

/** Debt-free calendar date from a month count, e.g. "March 2028". */
export function debtFreeDate(months, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth() + months, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
