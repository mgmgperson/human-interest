/** Raw transaction row as stored in the DB. Amount is in cents. */
export interface Transaction {
  id: string;
  account_id: string;
  card_id: string | null;     // NULL for deposits
  type: 'deposit' | 'purchase';
  amount: number;             // cents
  merchant_name: string | null;
  mcc_code: string | null;    // Merchant Category Code
  qualified: number | null;   // 1=qualified, 0=not, NULL=deposit
  status: 'approved' | 'declined';
  decline_reason: string | null;
  created_at: string;
}

/** Input for processing a purchase transaction. Amount is in cents. */
export interface PurchaseInput {
  account_id: string;
  card_id: string;
  amount: number;         // cents
  merchant_name: string;
  mcc_code: string;
}
