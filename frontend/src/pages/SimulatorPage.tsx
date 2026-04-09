import { useState, useEffect } from 'react';
import type { Account, Card } from '../types';
import { api, ApiError, type PurchaseResult } from '../api/client';
import { formatCents } from '../utils';
import { MCC_OPTIONS } from '../constants';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

interface TxForm {
  merchant_name: string;
  mcc_code: string;
  amount: string;
}

/** Pre-filled defaults that demonstrate the race condition: two $250 purchases against a $350 balance. */
const DEFAULT_A: TxForm = { merchant_name: 'CVS Pharmacy', mcc_code: '5912', amount: '250' };
const DEFAULT_B: TxForm = { merchant_name: 'Walgreens',    mcc_code: '5912', amount: '250' };

interface TimedResult extends PurchaseResult {
  completedMs: number; // ms from start when this request completed
}

/**
 * Concurrent Transaction Simulator.
 * Fires two purchase requests in the same JS event loop tick via Promise.allSettled.
 * Demonstrates that SQLite's BEGIN IMMEDIATE prevents the double-spend race condition.
 */
export default function SimulatorPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [formA, setFormA] = useState<TxForm>({ ...DEFAULT_A });
  const [formB, setFormB] = useState<TxForm>({ ...DEFAULT_B });
  const [racing, setRacing] = useState(false);
  const [resultA, setResultA] = useState<TimedResult | null>(null);
  const [resultB, setResultB] = useState<TimedResult | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingCard, setLoadingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Load account list on mount
  useEffect(() => {
    api.accounts
      .list()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoadingAccounts(false));
  }, []);

  // Load selected account + its card whenever selection changes
  useEffect(() => {
    if (!selectedId) return;
    setCard(null);
    setCardError(null);
    setResultA(null);
    setResultB(null);
    setLoadingCard(true);

    Promise.all([
      api.accounts.get(selectedId),
      api.cards.getForAccount(selectedId).catch((err: ApiError) => {
        if (err.status === 404) return null;
        throw err;
      }),
    ])
      .then(([acct, c]) => {
        setSelectedAccount(acct);
        setCard(c);
        if (!c) {
          setCardError('This account has no active card. Issue one on the Account Detail page first.');
        }
      })
      .finally(() => setLoadingCard(false));
  }, [selectedId]);

  async function fireSimultaneously() {
    if (!selectedAccount || !card) return;

    const amountA = parseFloat(formA.amount);
    const amountB = parseFloat(formB.amount);
    if (isNaN(amountA) || amountA <= 0 || isNaN(amountB) || amountB <= 0) {
      alert('Please enter valid amounts for both transactions.');
      return;
    }

    setRacing(true);
    setResultA(null);
    setResultB(null);

    const start = performance.now();

    // Both requests fire in the same microtask — they hit the server simultaneously.
    const [resA, resB] = await Promise.allSettled([
      api.transactions
        .purchase({
          account_id: selectedAccount.id,
          card_id: card.id,
          amount: amountA,
          merchant_name: formA.merchant_name || 'Merchant A',
          mcc_code: formA.mcc_code,
        })
        .then((r): TimedResult => ({ ...r, completedMs: Math.round(performance.now() - start) })),
      api.transactions
        .purchase({
          account_id: selectedAccount.id,
          card_id: card.id,
          amount: amountB,
          merchant_name: formB.merchant_name || 'Merchant B',
          mcc_code: formB.mcc_code,
        })
        .then((r): TimedResult => ({ ...r, completedMs: Math.round(performance.now() - start) })),
    ]);

    if (resA.status === 'fulfilled') setResultA(resA.value);
    if (resB.status === 'fulfilled') setResultB(resB.value);

    // Refresh balance to show updated value
    api.accounts.get(selectedAccount.id).then(setSelectedAccount);

    setRacing(false);
  }

  function resetResults() {
    setResultA(null);
    setResultB(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Concurrent Transaction Simulator</h1>
        <p className="text-slate-500 text-sm mt-1.5 max-w-2xl">
          Fires two purchase requests simultaneously via{' '}
          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">Promise.allSettled</code>.
          SQLite's <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">BEGIN IMMEDIATE</code>{' '}
          serializes writes at the DB level, ensuring the balance never goes negative.
        </p>
      </div>

      {/* Account selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Account
            </label>
            {loadingAccounts ? (
              <Spinner size="sm" />
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.length === 0 && (
                  <option disabled>No accounts — create one first</option>
                )}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.owner_name} — {a.owner_email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedAccount && (
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Current Balance
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCents(selectedAccount.balance)}
              </p>
            </div>
          )}
        </div>

        {/* Card warning */}
        {!loadingCard && cardError && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-700">{cardError}</p>
          </div>
        )}
      </div>

      {/* Transaction forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {([
          { label: 'Transaction A', form: formA, setForm: setFormA },
          { label: 'Transaction B', form: formB, setForm: setFormB },
        ] as const).map(({ label, form, setForm }) => (
          <TxFormPanel
            key={label}
            label={label}
            form={form}
            onChange={setForm}
            disabled={racing}
          />
        ))}
      </div>

      {/* Fire button */}
      <div className="flex justify-center mb-8">
        <Button
          size="lg"
          onClick={fireSimultaneously}
          loading={racing}
          disabled={!card || !selectedAccount || loadingCard}
          className="px-10"
        >
          {!racing && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {racing ? 'Racing…' : 'Fire Both Simultaneously'}
        </Button>
      </div>

      {/* Results */}
      {(resultA || resultB) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Race Results</h2>
            <button
              onClick={resetResults}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <ResultCard label="Transaction A" result={resultA} />
            <ResultCard label="Transaction B" result={resultB} />
          </div>

          {/* Explanation banner */}
          {selectedAccount && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-indigo-900 mb-1">How concurrency was handled</p>
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    Both requests arrived at the server nearly simultaneously. SQLite's{' '}
                    <code className="font-mono bg-indigo-100 px-1 rounded text-xs">BEGIN IMMEDIATE</code>{' '}
                    acquired an exclusive write lock for the first transaction that was processed,
                    forcing the second to wait. When the second ran, it read the{' '}
                    <strong>committed</strong> balance — not the stale pre-transaction value —
                    and made the correct approval/decline decision.
                    Updated balance: <strong>{formatCents(selectedAccount.balance)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TxFormPanelProps {
  label: string;
  form: TxForm;
  onChange: (form: TxForm) => void;
  disabled: boolean;
}

/** One side of the side-by-side transaction form grid. */
function TxFormPanel({ label, form, onChange, disabled }: TxFormPanelProps) {
  const selectedMcc = MCC_OPTIONS.find((m) => m.code === form.mcc_code);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-4">{label}</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Merchant Name</label>
          <input
            type="text"
            value={form.merchant_name}
            onChange={(e) => onChange({ ...form, merchant_name: e.target.value })}
            placeholder="Merchant name"
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select
            value={form.mcc_code}
            onChange={(e) => onChange({ ...form, mcc_code: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
          >
            <optgroup label="✓ Qualified Medical">
              {MCC_OPTIONS.filter((m) => m.qualified).map((m) => (
                <option key={m.code} value={m.code}>{m.label} ({m.code})</option>
              ))}
            </optgroup>
            <optgroup label="✗ Not Qualified">
              {MCC_OPTIONS.filter((m) => !m.qualified).map((m) => (
                <option key={m.code} value={m.code}>{m.label} ({m.code})</option>
              ))}
            </optgroup>
          </select>
          {selectedMcc && (
            <p className={`text-xs mt-1 font-medium ${selectedMcc.qualified ? 'text-emerald-600' : 'text-rose-500'}`}>
              {selectedMcc.qualified ? '✓ Qualified' : '✗ Not qualified'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => onChange({ ...form, amount: e.target.value })}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              disabled={disabled}
              className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResultCardProps {
  label: string;
  result: TimedResult | null;
}

/** Displays the outcome of one transaction in the race. */
function ResultCard({ label, result }: ResultCardProps) {
  if (!result) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-center justify-center min-h-[140px]">
        <p className="text-sm text-slate-400">{label} — no result</p>
      </div>
    );
  }

  const { transaction: tx, approved, completedMs } = result;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        approved
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-rose-50 border-rose-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <Badge variant={tx.status} />
      </div>

      <p className="text-2xl font-bold text-slate-900 mb-1">{formatCents(tx.amount)}</p>
      <p className="text-sm text-slate-600 mb-1">{tx.merchant_name}</p>

      {tx.decline_reason && (
        <p className="text-sm text-rose-600 font-medium mb-2">{tx.decline_reason}</p>
      )}

      <p className="text-xs text-slate-400 mt-2">Completed in {completedMs} ms</p>
    </div>
  );
}
