import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { api, ApiError } from '../../api/client';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  onDeposited: () => void;
}

/** Modal form for depositing funds into an account. */
export default function DepositModal({ open, onClose, accountId, onDeposited }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setAmount('');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dollars = parseFloat(amount);
    if (isNaN(dollars) || dollars <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.accounts.deposit(accountId, dollars);
      onDeposited();
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Deposit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Deposit Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Deposit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
