import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { api, ApiError, type PurchaseResult } from '../../api/client';
import { MCC_OPTIONS } from '../../constants';
import { formatCents } from '../../utils';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  cardId: string;
  /** Called after any completed transaction (approved or declined). */
  onProcessed: () => void;
}

/** Modal form for processing a single card purchase against an account. */
export default function TransactionModal({
  open,
  onClose,
  accountId,
  cardId,
  onProcessed,
}: TransactionModalProps) {
  const [merchantName, setMerchantName] = useState('');
  const [mccCode, setMccCode] = useState<string>(MCC_OPTIONS[0].code);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  function reset() {
    setMerchantName('');
    setMccCode(MCC_OPTIONS[0].code);
    setAmount('');
    setError(null);
    setResult(null);
  }

  function handleClose() {
    reset();
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
      const res = await api.transactions.purchase({
        account_id: accountId,
        card_id: cardId,
        amount: dollars,
        merchant_name: merchantName,
        mcc_code: mccCode,
      });
      setResult(res);
      onProcessed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  }

  const selectedMcc = MCC_OPTIONS.find((m) => m.code === mccCode);

  return (
    <Modal open={open} onClose={handleClose} title="Process Transaction">
      {result ? (
        // Result confirmation screen
        <div className="text-center py-2 space-y-4">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              result.approved ? 'bg-emerald-100' : 'bg-rose-100'
            }`}
          >
            {result.approved ? (
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-slate-900">
              {result.approved ? 'Transaction Approved' : 'Transaction Declined'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {formatCents(result.transaction.amount)} at {result.transaction.merchant_name}
            </p>
            {result.transaction.decline_reason && (
              <p className="text-rose-500 text-sm mt-2">{result.transaction.decline_reason}</p>
            )}
          </div>

          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </div>
      ) : (
        // Transaction form
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Merchant Name
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="CVS Pharmacy"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Merchant Category
            </label>
            <select
              value={mccCode}
              onChange={(e) => setMccCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <optgroup label="✓ Qualified Medical Expenses">
                {MCC_OPTIONS.filter((m) => m.qualified).map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label} (MCC {m.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="✗ Not Qualified">
                {MCC_OPTIONS.filter((m) => !m.qualified).map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label} (MCC {m.code})
                  </option>
                ))}
              </optgroup>
            </select>
            {selectedMcc && (
              <p className={`text-xs mt-1.5 font-medium ${selectedMcc.qualified ? 'text-emerald-600' : 'text-rose-500'}`}>
                {selectedMcc.qualified
                  ? '✓ Qualified HSA medical expense'
                  : '✗ Not a qualified HSA expense — will be declined'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
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
              Process
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
