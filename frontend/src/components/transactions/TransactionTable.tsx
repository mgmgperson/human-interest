import type { Transaction } from '../../types';
import Badge from '../ui/Badge';
import { formatCents, formatDate } from '../../utils';
import { MCC_OPTIONS } from '../../constants';

interface TransactionTableProps {
  transactions: Transaction[];
}

/** Look up a human-readable category label for an MCC code. */
function getMccLabel(code: string | null): string {
  if (!code) return '—';
  return MCC_OPTIONS.find((m) => m.code === code)?.label ?? code;
}

/** Full transaction history table with status badges and decline reasons. */
export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-14">
        <svg
          className="w-10 h-10 mx-auto mb-3 text-slate-300"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm text-slate-400">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Date', 'Type', 'Merchant', 'Category', 'Amount', 'Status'].map((h) => (
              <th
                key={h}
                className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                {formatDate(tx.created_at)}
              </td>
              <td className="py-3.5 px-4">
                <Badge variant={tx.type} />
              </td>
              <td className="py-3.5 px-4 text-slate-900 font-medium">
                {tx.merchant_name ?? 'Direct Deposit'}
              </td>
              <td className="py-3.5 px-4 text-slate-500">
                {getMccLabel(tx.mcc_code)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                {tx.type === 'deposit' && (
                  <span className="text-emerald-600">+</span>
                )}
                {formatCents(tx.amount)}
              </td>
              <td className="py-3.5 px-4">
                <Badge variant={tx.status} />
                {tx.decline_reason && (
                  <p className="text-xs text-slate-400 mt-1 max-w-[160px]">{tx.decline_reason}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
