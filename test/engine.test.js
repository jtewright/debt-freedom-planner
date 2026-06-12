import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulatePayoff, comparePlans, validateInputs } from '../js/engine.js';

const card = (over = {}) => ({
  id: 'c1', name: 'Credit card', balance: 1200, apr: 22.9, minPayment: 30, ...over,
});

test('single zero-APR debt clears in balance/payment months', () => {
  const r = simulatePayoff([card({ apr: 0, balance: 300, minPayment: 30 })], 100, 'avalanche');
  assert.equal(r.months, 3);
  assert.equal(r.totalInterest, 0);
});

test('interest accrues monthly at APR/12', () => {
  // 1200 @ 12% APR -> 1% monthly: first month interest is 12.00
  const r = simulatePayoff([card({ apr: 12, balance: 1200, minPayment: 1212 })], 1212, 'avalanche');
  assert.equal(r.months, 1);
  assert.ok(Math.abs(r.totalInterest - 12) < 0.01);
});

test('avalanche targets highest APR with surplus', () => {
  const debts = [
    card({ id: 'a', name: 'Low APR', balance: 1000, apr: 5, minPayment: 25 }),
    card({ id: 'b', name: 'High APR', balance: 1000, apr: 30, minPayment: 25 }),
  ];
  const r = simulatePayoff(debts, 300, 'avalanche');
  const firstMonth = r.schedule[0];
  const high = firstMonth.payments.find(p => p.id === 'b');
  const low = firstMonth.payments.find(p => p.id === 'a');
  assert.ok(high.amount > low.amount, 'high-APR debt gets the surplus');
});

test('snowball targets smallest balance with surplus', () => {
  const debts = [
    card({ id: 'a', name: 'Big', balance: 5000, apr: 30, minPayment: 100 }),
    card({ id: 'b', name: 'Small', balance: 400, apr: 5, minPayment: 20 }),
  ];
  const r = simulatePayoff(debts, 400, 'snowball');
  const firstMonth = r.schedule[0];
  const small = firstMonth.payments.find(p => p.id === 'b');
  assert.ok(small.amount > 20, 'small debt gets the surplus');
});

test('cleared debt payment rolls into surplus', () => {
  const debts = [
    card({ id: 'a', balance: 100, apr: 0, minPayment: 50 }),
    card({ id: 'b', balance: 1000, apr: 0, minPayment: 50 }),
  ];
  const r = simulatePayoff(debts, 200, 'avalanche');
  // After debt a clears, full £200 goes to b. Total 1100/200 -> 6 months.
  assert.equal(r.months, 6);
});

test('avalanche never costs more interest than snowball', () => {
  const debts = [
    card({ id: 'a', balance: 3000, apr: 29.9, minPayment: 70 }),
    card({ id: 'b', balance: 800, apr: 6.9, minPayment: 20 }),
    card({ id: 'c', balance: 1500, apr: 19.9, minPayment: 40 }),
  ];
  const av = simulatePayoff(debts, 250, 'avalanche');
  const sn = simulatePayoff(debts, 250, 'snowball');
  assert.ok(av.totalInterest <= sn.totalInterest + 0.01);
});

test('comparePlans reports baseline savings', () => {
  const debts = [card({ balance: 2000, apr: 24, minPayment: 60 })];
  const c = comparePlans(debts, 200);
  assert.ok(c.avalanche.months < c.baseline.months);
  assert.ok(c.avalanche.totalInterest < c.baseline.totalInterest);
  assert.ok(c.interestSaved > 0);
  assert.ok(c.monthsSaved > 0);
});

test('never-clears detection when min payment <= monthly interest', () => {
  const debts = [card({ balance: 1000, apr: 24, minPayment: 10 })]; // interest £20/mo
  const v = validateInputs(debts, 10);
  assert.ok(v.warnings.some(w => w.debtId === 'c1' && w.type === 'never_clears'));
});

test('budget below sum of minimums is an error', () => {
  const debts = [card({ minPayment: 50 }), card({ id: 'c2', minPayment: 60 })];
  const v = validateInputs(debts, 100);
  assert.ok(v.errors.some(e => e.type === 'budget_too_low'));
  assert.equal(v.minTotal, 110);
});

test('simulation caps at 600 months and flags it', () => {
  const debts = [card({ balance: 100000, apr: 35, minPayment: 10 })];
  const r = simulatePayoff(debts, 10, 'avalanche');
  assert.equal(r.capped, true);
});

test('final month pays only what is owed, never negative balances', () => {
  const debts = [card({ balance: 95, apr: 0, minPayment: 50 })];
  const r = simulatePayoff(debts, 50, 'avalanche');
  assert.equal(r.months, 2);
  const last = r.schedule[r.schedule.length - 1];
  assert.ok(Math.abs(last.payments[0].amount - 45) < 0.01);
  assert.ok(r.totalPaid > 94.99 && r.totalPaid < 95.01);
});
