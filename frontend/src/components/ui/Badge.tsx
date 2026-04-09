type BadgeVariant =
  | 'approved' | 'declined'
  | 'active'   | 'frozen' | 'cancelled'
  | 'deposit'  | 'purchase';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const styles: Record<BadgeVariant, string> = {
  approved:  'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  declined:  'bg-rose-50    text-rose-700    ring-rose-600/20',
  active:    'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  frozen:    'bg-amber-50   text-amber-700   ring-amber-600/20',
  cancelled: 'bg-slate-100  text-slate-600   ring-slate-500/20',
  deposit:   'bg-blue-50    text-blue-700    ring-blue-600/20',
  purchase:  'bg-indigo-50  text-indigo-700  ring-indigo-600/20',
};

const defaultLabels: Record<BadgeVariant, string> = {
  approved:  'Approved',
  declined:  'Declined',
  active:    'Active',
  frozen:    'Frozen',
  cancelled: 'Cancelled',
  deposit:   'Deposit',
  purchase:  'Purchase',
};

/** Small pill badge for status and type indicators. */
export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[variant]}`}
    >
      {label ?? defaultLabels[variant]}
    </span>
  );
}
