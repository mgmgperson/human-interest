import { useNavigate } from 'react-router-dom';
import type { Account } from '../../types';
import { formatCents } from '../../utils';

interface AccountCardProps {
  account: Account;
}

/** Clickable card displaying account summary. Navigates to detail on click. */
export default function AccountCard({ account }: AccountCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/accounts/${account.id}`)}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      {/* Avatar + arrow */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
          <span className="text-indigo-700 font-semibold text-sm">
            {account.owner_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors mt-1"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Name + email */}
      <div className="mb-4">
        <p className="font-semibold text-slate-900 truncate">{account.owner_name}</p>
        <p className="text-sm text-slate-500 truncate">{account.owner_email}</p>
      </div>

      {/* Balance */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Balance</p>
        <p className="text-2xl font-bold text-slate-900">{formatCents(account.balance)}</p>
      </div>
    </button>
  );
}
