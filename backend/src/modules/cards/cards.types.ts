/** Raw card row as stored in the DB. */
export interface Card {
  id: string;
  account_id: string;
  card_number: string; // full 16-digit number — never logged or exposed in lists
  last_four: string;
  expiry: string;      // MM/YY
  cvv: string;
  status: 'active' | 'frozen' | 'cancelled';
  created_at: string;
}

/** Input for issuing a new card. */
export interface IssueCardInput {
  account_id: string;
}
