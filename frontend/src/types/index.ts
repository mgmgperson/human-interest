/** Mirrors the backend Account row. Balance is always in cents. */
export interface Account {
  id: string;
  owner_name: string;
  owner_email: string;
  balance: number; // cents
  created_at: string;
}

/** Mirrors the backend Card row. */
export interface Card {
  id: string;
  account_id: string;
  card_number: string;
  last_four: string;
  expiry: string; // MM/YY
  cvv: string;
  status: 'active' | 'frozen' | 'cancelled';
  created_at: string;
}

/** Mirrors the backend Transaction row. Amount is always in cents. */
export interface Transaction {
  id: string;
  account_id: string;
  card_id: string | null;
  type: 'deposit' | 'purchase';
  amount: number; // cents
  merchant_name: string | null;
  mcc_code: string | null;
  qualified: number | null; // 1 = qualified, 0 = not, null = deposit
  status: 'approved' | 'declined';
  decline_reason: string | null;
  created_at: string;
}
