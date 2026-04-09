import { v4 as uuidv4 } from 'uuid';
import db from '../../db/client';
import type { Card } from './cards.types';

// Lazy-initialized — see accounts.repository.ts for rationale
let stmtFindByAccount: ReturnType<typeof db.prepare<[string], Card>>;
let stmtFindById: ReturnType<typeof db.prepare<[string], Card>>;
let stmtInsert: ReturnType<typeof db.prepare<[string, string, string, string, string, string], Card>>;
let stmtCountActive: ReturnType<typeof db.prepare<[string], { count: number }>>;

function init() {
  if (stmtFindByAccount) return;
  stmtFindByAccount = db.prepare<[string], Card>(
    'SELECT * FROM cards WHERE account_id = ? ORDER BY created_at DESC',
  );
  stmtFindById = db.prepare<[string], Card>('SELECT * FROM cards WHERE id = ?');
  // 6 bind params: id, account_id, card_number, last_four, expiry, cvv — status is hardcoded
  stmtInsert = db.prepare<[string, string, string, string, string, string], Card>(`
    INSERT INTO cards (id, account_id, card_number, last_four, expiry, cvv, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
    RETURNING *
  `);
  stmtCountActive = db.prepare<[string], { count: number }>(
    "SELECT COUNT(*) as count FROM cards WHERE account_id = ? AND status = 'active'",
  );
}

/** Return all cards for an account, newest first. */
export function findByAccountId(accountId: string): Card[] {
  init();
  return stmtFindByAccount.all(accountId);
}

/** Return a single card by ID, or undefined if not found. */
export function findById(id: string): Card | undefined {
  init();
  return stmtFindById.get(id);
}

/** Count active cards for an account (used to enforce one-card-per-account). */
export function countActive(accountId: string): number {
  init();
  return stmtCountActive.get(accountId)!.count;
}

/** Insert a new card and return the created row. */
export function create(
  accountId: string,
  cardNumber: string,
  lastFour: string,
  expiry: string,
  cvv: string,
): Card {
  init();
  return stmtInsert.get(uuidv4(), accountId, cardNumber, lastFour, expiry, cvv) as Card;
}
