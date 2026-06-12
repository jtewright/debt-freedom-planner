import { comparePlans, validateInputs, debtFreeDate, round2 } from './engine.js';

const STORAGE_KEY = 'dfp.state.v1';
const DEBT_TYPES = ['Credit card', 'Overdraft', 'Personal loan', 'Car finance', 'Buy now pay later', 'Store card', 'Catalogue', 'Other'];

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbp0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

const $ = (sel) => document.querySelector(sel);
const rowsEl = $('#debt-rows');

let nextId = 1;
let lastComparison = null;
let lastDebts = null;
let lastWarnings = [];
let strategy = 'avalanche';

/* ---------- debt rows ---------- */

function addDebtRow(debt = {}) {
  const id = debt.id || `d${nextId++}`;
  const row = document.createElement('div');
  row.className = 'debt-row';
  row.dataset.id = id;
  row.innerHTML = `
    <label class="field-name">Name
      <input data-field="name" placeholder="e.g. Barclaycard" value="${escapeAttr(debt.name || '')}">
    </label>
    <label>Type
      <select data-field="type">${DEBT_TYPES.map(t => `<option${t === debt.type ? ' selected' : ''}>${t}</option>`).join('')}</select>
    </label>
    <label>Balance (£)
      <input data-field="balance" inputmode="decimal" placeholder="0.00" value="${debt.balance ?? ''}">
    </label>
    <label>APR (%)
      <input data-field="apr" inputmode="decimal" placeholder="e.g. 24.9" value="${debt.apr ?? ''}">
    </label>
    <label>Min payment (£)
      <input data-field="minPayment" inputmode="decimal" placeholder="0.00" value="${debt.minPayment ?? ''}">
    </label>
    <button type="button" class="remove-debt" aria-label="Remove this debt" title="Remove">×</button>
  `;
  row.querySelector('.remove-debt').addEventListener('click', () => { row.remove(); refreshMinHint(); save(); });
  row.addEventListener('input', () => { refreshMinHint(); save(); });
  rowsEl.appendChild(row);
}

function readDebts() {
  return [...rowsEl.querySelectorAll('.debt-row')].map((row, i) => ({
    id: row.dataset.id,
    name: row.querySelector('[data-field=name]').value.trim() || `Debt ${i + 1}`,
    type: row.querySelector('[data-field=type]').value,
    balance: num(row.querySelector('[data-field=balance]').value),
    apr: num(row.querySelector('[data-field=apr]').value),
    minPayment: num(row.querySelector('[data-field=minPayment]').value),
  })).filter(d => d.balance > 0);
}

function num(v) {
  const n = parseFloat(String(v).replace(/[£,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function refreshMinHint() {
  const debts = readDebts();
  const minTotal = round2(debts.reduce((s, d) => s + d.minPayment, 0));
  $('#min-hint').textContent = minTotal > 0
    ? ` — your minimum payments add up to ${gbp.format(minTotal)}, so enter at least that`
    : '';
}

/* ---------- persistence (local only) ---------- */

function save() {
  const state = {
    debts: [...rowsEl.querySelectorAll('.debt-row')].map(row => ({
      id: row.dataset.id,
      name: row.querySelector('[data-field=name]').value,
      type: row.querySelector('[data-field=type]').value,
      balance: row.querySelector('[data-field=balance]').value,
      apr: row.querySelector('[data-field=apr]').value,
      minPayment: row.querySelector('[data-field=minPayment]').value,
    })),
    budget: $('#budget').value,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode: fine */ }
}

function load() {
  let state = null;
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { /* ignore */ }
  if (state?.debts?.length) {
    state.debts.forEach(d => addDebtRow(d));
    $('#budget').value = state.budget || '';
  } else {
    addDebtRow();
    addDebtRow();
  }
  refreshMinHint();
}

/* ---------- example ---------- */

const EXAMPLE = [
  { name: 'Credit card', type: 'Credit card', balance: 2400, apr: 24.9, minPayment: 60 },
  { name: 'Overdraft', type: 'Overdraft', balance: 800, apr: 39.9, minPayment: 25 },
  { name: 'Car finance', type: 'Car finance', balance: 4200, apr: 9.9, minPayment: 150 },
  { name: 'Klarna', type: 'Buy now pay later', balance: 350, apr: 0, minPayment: 50 },
];

/* ---------- calculate & render ---------- */

function calculate() {
  const debts = readDebts();
  const budget = num($('#budget').value);
  const errBox = $('#form-errors');

  if (debts.length === 0) {
    return showError('Add at least one debt with a balance to get your plan.');
  }
  if (debts.some(d => d.minPayment <= 0)) {
    return showError('Each debt needs a minimum monthly payment (check your statement — even an estimate works).');
  }
  const v = validateInputs(debts, budget);
  if (v.errors.some(e => e.type === 'budget_too_low')) {
    return showError(`Your minimum payments add up to ${gbp.format(v.minTotal)} — enter at least that as your monthly amount. If you can't cover your minimums, please talk to one of the free debt advice services below; they can help in ways a calculator can't.`);
  }
  errBox.hidden = true;

  lastComparison = comparePlans(debts, budget);
  lastDebts = debts;
  lastWarnings = v.warnings;
  renderResults(debts, v.warnings);
  $('#results').hidden = false;
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  save();
}

function showError(msg) {
  const errBox = $('#form-errors');
  errBox.textContent = msg;
  errBox.hidden = false;
  errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderResults(debts, warnings) {
  const c = lastComparison;
  const plan = c[strategy];

  // Headline
  $('#freedom-date').textContent = plan.capped ? 'more than 50 years' : debtFreeDate(plan.months);
  const parts = [];
  if (c.monthsSaved > 0) parts.push(`<strong>${fmtMonths(c.monthsSaved)} sooner</strong>`);
  if (c.interestSaved > 0.5) parts.push(`<strong>${gbp0.format(c.interestSaved)} less interest</strong>`);
  $('#freedom-compare').innerHTML = parts.length
    ? `That's ${parts.join(' and ')} than paying only the minimums. Total interest on this plan: ${gbp0.format(plan.totalInterest)}.`
    : `Total interest on this plan: ${gbp0.format(plan.totalInterest)}.`;

  // Strategy cards
  $('#avalanche-stats').textContent = `${fmtMonths(c.avalanche.months)} · ${gbp0.format(c.avalanche.totalInterest)} interest`;
  $('#snowball-stats').textContent = `${fmtMonths(c.snowball.months)} · ${gbp0.format(c.snowball.totalInterest)} interest`;
  $('#opt-avalanche').setAttribute('aria-pressed', strategy === 'avalanche');
  $('#opt-snowball').setAttribute('aria-pressed', strategy === 'snowball');
  $('#strategy-note').textContent = c.snowballExtraInterest > 0.5
    ? `Cheapest-first saves ${gbp.format(c.snowballExtraInterest)} compared with smallest-first. Smallest-first clears your first debt sooner — pick whichever keeps you going.`
    : `Both orders cost about the same here — pick whichever keeps you motivated.`;

  // Warnings
  const wBox = $('#result-warnings');
  wBox.innerHTML = '';
  for (const w of warnings) {
    if (w.type !== 'never_clears') continue;
    const d = debts.find(x => x.id === w.debtId);
    const div = document.createElement('div');
    div.className = 'callout callout-warn';
    div.textContent = `Heads up: the minimum payment on "${d.name}" (${gbp.format(d.minPayment)}) barely covers its monthly interest (~${gbp.format(w.monthlyInterest)}). On minimums alone it would never clear — this plan fixes that by paying more than the minimum.`;
    wBox.appendChild(div);
  }

  // This month's payments
  const first = plan.schedule[0];
  const excess = (p) => p.amount - (debts.find(d => d.id === p.id)?.minPayment ?? 0);
  const focusId = first.payments.length > 1
    ? first.payments.reduce((a, b) => (excess(b) > excess(a) ? b : a)).id
    : null;
  $('#this-month').innerHTML = first.payments.map(p => `
    <div class="pay-item">
      <span>${escapeAttr(p.name)}${p.id === focusId && excess(p) > 0 ? '<span class="target-tag">Focus — extra goes here</span>' : ''}</span>
      <span class="amt">${gbp.format(p.amount)}</span>
    </div>`).join('');

  // Payoff order
  const orderNames = plan.debtFreeOrder.map(id => debts.find(d => d.id === id));
  const clearMonth = (id) => plan.schedule.findIndex(m => m.payments.some(p => p.id === id && p.balanceAfter === 0)) + 1;
  $('#payoff-order').innerHTML = orderNames.map(d => {
    const m = clearMonth(d.id);
    return `<li>${escapeAttr(d.name)} <span class="done-by">— cleared ${debtFreeDate(m)}</span></li>`;
  }).join('');

  // Schedule table
  renderSchedule(plan, debts);
}

function renderSchedule(plan, debts) {
  const table = $('#schedule-table');
  const cols = debts.map(d => d.id);
  const head = `<thead><tr><th>Month</th>${debts.map(d => `<th>${escapeAttr(d.name)}</th>`).join('')}<th>Total left</th></tr></thead>`;
  const rows = plan.schedule.map(m => {
    let totalLeft = 0;
    const cells = cols.map(id => {
      const p = m.payments.find(x => x.id === id);
      if (!p) return '<td>—</td>';
      totalLeft += p.balanceAfter;
      return `<td class="${p.balanceAfter === 0 ? 'cleared' : ''}">${p.amount > 0 ? gbp.format(p.amount) : '—'}</td>`;
    }).join('');
    return `<tr><td>${debtFreeDate(m.month)}</td>${cells}<td>${gbp0.format(totalLeft)}</td></tr>`;
  }).join('');
  table.innerHTML = head + `<tbody>${rows}</tbody>`;
}

function fmtMonths(m) {
  const y = Math.floor(m / 12), r = m % 12;
  if (y === 0) return `${m} month${m === 1 ? '' : 's'}`;
  if (r === 0) return `${y} year${y === 1 ? '' : 's'}`;
  return `${y} yr ${r} mo`;
}

/* ---------- share ---------- */

const SHARE_TEXT = 'I just worked out my debt-free date with this free calculator — no signup, no bank connection, your numbers stay on your device:';
const shareUrl = () => location.origin + location.pathname;

$('#share-btn').addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: 'Debt Freedom Planner', text: SHARE_TEXT, url: shareUrl() }); } catch { /* cancelled */ }
  } else {
    copyLink();
  }
});
$('#share-copy').addEventListener('click', copyLink);
$('#share-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + ' ' + shareUrl())}`;

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl());
    $('#share-copy').textContent = 'Copied ✓';
    setTimeout(() => { $('#share-copy').textContent = 'Copy link'; }, 1800);
  } catch { prompt('Copy this link:', shareUrl()); }
}

/* ---------- wiring ---------- */

$('#add-debt').addEventListener('click', () => addDebtRow());
$('#load-example').addEventListener('click', () => {
  rowsEl.innerHTML = '';
  EXAMPLE.forEach(d => addDebtRow(d));
  $('#budget').value = '400';
  refreshMinHint();
  save();
});
$('#budget').addEventListener('input', save);
$('#calculate').addEventListener('click', calculate);
$('#opt-avalanche').addEventListener('click', () => { strategy = 'avalanche'; if (lastComparison) renderResults(lastDebts, lastWarnings); });
$('#opt-snowball').addEventListener('click', () => { strategy = 'snowball'; if (lastComparison) renderResults(lastDebts, lastWarnings); });

load();
