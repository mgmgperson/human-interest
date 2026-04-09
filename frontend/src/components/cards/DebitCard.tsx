import type { Card } from '../../types';

interface DebitCardProps {
  card: Card;
  ownerName: string;
}

/**
 * Visual representation of a virtual HSA debit card.
 * Displays masked card number, expiry, and cardholder name.
 */
export default function DebitCard({ card, ownerName }: DebitCardProps) {
  return (
    <div className="relative w-full max-w-xs rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 text-white p-6 shadow-2xl select-none overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-8 w-40 h-40 rounded-full bg-white/5" />

      {/* Top row: brand label + network logo */}
      <div className="relative flex items-center justify-between mb-7">
        <span className="text-xs font-bold tracking-[0.25em] text-white/60 uppercase">HSA</span>
        <span className="text-sm font-semibold tracking-widest text-white/70">VISA</span>
      </div>

      {/* Chip */}
      <div className="relative mb-5">
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-400 shadow-inner grid grid-cols-3 gap-px p-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-sm bg-amber-500/40" />
          ))}
        </div>
      </div>

      {/* Masked card number */}
      <p className="relative font-mono text-lg tracking-[0.22em] text-white/90 mb-5">
        •••• •••• •••• {card.last_four}
      </p>

      {/* Cardholder + expiry */}
      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Card Holder</p>
          <p className="text-sm font-medium truncate max-w-[150px]">{ownerName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Expires</p>
          <p className="text-sm font-mono font-medium">{card.expiry}</p>
        </div>
      </div>
    </div>
  );
}
