import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Account, Card, Transaction } from '../types';
import { api, ApiError } from '../api/client';
import { formatCents } from '../utils';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DebitCard from '../components/cards/DebitCard';
import TransactionTable from '../components/transactions/TransactionTable';
import DepositModal from '../components/accounts/DepositModal';
import TransactionModal from '../components/transactions/TransactionModal';
import Spinner from '../components/ui/Spinner';

/** Shows account details, virtual card, deposit/purchase actions, and transaction history. */
export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuingCard, setIssuingCard] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);

  /** Fetch account, card, and transactions. Wrapped in useCallback so it can be called after mutations. */
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [acct, txns] = await Promise.all([
        api.accounts.get(id),
        api.transactions.list(id),
      ]);
      setAccount(acct);
      setTransactions(txns);
      // Card is optional — a 404 here just means none issued yet
      try {
        setCard(await api.cards.getForAccount(id));
      } catch {
        setCard(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleIssueCard() {
    if (!id) return;
    setIssuingCard(true);
    try {
      setCard(await api.cards.issue(id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to issue card');
    } finally {
      setIssuingCard(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="text-center py-24">
        <p className="text-rose-600 mb-4">{error ?? 'Account not found'}</p>
        <Button variant="ghost" onClick={() => navigate('/accounts')}>
          ← Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/accounts')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Accounts
      </button>

      {/* Account header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-indigo-700 font-bold text-xl">
              {account.owner_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{account.owner_name}</h1>
            <p className="text-slate-500">{account.owner_email}</p>
          </div>
        </div>
        <Button onClick={() => setShowDeposit(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Deposit
        </Button>
      </div>

      {/* Balance + Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Balance panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">
            Available Balance
          </p>
          <p className="text-4xl font-bold text-slate-900 mb-2">{formatCents(account.balance)}</p>
          <p className="text-xs text-slate-400 font-mono">
            ID: {account.id.slice(0, 8)}…
          </p>
        </div>

        {/* Card panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Virtual Debit Card
            </p>
            {card && <Badge variant="active" />}
          </div>

          {card ? (
            <div className="flex flex-col items-center gap-4">
              <DebitCard card={card} ownerName={account.owner_name} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTransaction(true)}
                className="w-full"
              >
                Process Transaction
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 mb-4">No card issued yet</p>
              <Button size="sm" loading={issuingCard} onClick={handleIssueCard}>
                Issue Virtual Card
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-400 mt-0.5">{transactions.length} transactions</p>
          </div>
        </div>
        <TransactionTable transactions={transactions} />
      </div>

      {/* Modals */}
      <DepositModal
        open={showDeposit}
        onClose={() => setShowDeposit(false)}
        accountId={account.id}
        onDeposited={load}
      />
      {card && (
        <TransactionModal
          open={showTransaction}
          onClose={() => setShowTransaction(false)}
          accountId={account.id}
          cardId={card.id}
          onProcessed={load}
        />
      )}
    </div>
  );
}
