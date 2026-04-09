/** Raw account row as stored in the DB. Balance is in cents. */
export interface Account {
  id: string;
  owner_name: string;
  owner_email: string;
  balance: number; // cents
  created_at: string;
}

/** Input for creating a new account. */
export interface CreateAccountInput {
  owner_name: string;
  owner_email: string;
}

/** Input for depositing funds. Amount is in cents. */
export interface DepositInput {
  amount: number; // cents
}
