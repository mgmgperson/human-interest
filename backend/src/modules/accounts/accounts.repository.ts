import { v4 as uuidv4 } from 'uuid';
import db from '../../db/client';
import type { Account, CreateAccountInput } from './accounts.types';

// Statements are initialized on first use (lazy) so they don't compile at
// import time — migrations must run before db.prepare() is safe to call.
let stmtFindAll: ReturnType<typeof db.prepare<[], Account>>;
let stmtFindById: ReturnType<typeof db.prepare<[string], Account>>;
let stmtInsert: ReturnType<typeof db.prepare<[string, string, string], Account>>;
let stmtUpdateBalance: ReturnType<typeof db.prepare<[number, string]>>;

function init() {
  if (stmtFindAll) return;
  stmtFindAll = db.prepare<[], Account>('SELECT * FROM accounts ORDER BY created_at DESC');
  stmtFindById = db.prepare<[string], Account>('SELECT * FROM accounts WHERE id = ?');
  stmtInsert = db.prepare<[string, string, string], Account>(`
    INSERT INTO accounts (id, owner_name, owner_email)
    VALUES (?, ?, ?)
    RETURNING *
  `);
  stmtUpdateBalance = db.prepare<[number, string]>(
    'UPDATE accounts SET balance = ? WHERE id = ?',
  );
}

/** Return all accounts, newest first. */
export function findAll(): Account[] {
  init();
  return stmtFindAll.all();
}

/** Return a single account by ID, or undefined if not found. */
export function findById(id: string): Account | undefined {
  init();
  return stmtFindById.get(id);
}

/** Insert a new account and return the created row. */
export function create(input: CreateAccountInput): Account {
  init();
  return stmtInsert.get(uuidv4(), input.owner_name, input.owner_email) as Account;
}

/**
 * Overwrite the balance for an account.
 * Only call from within a BEGIN IMMEDIATE transaction in the transactions repository.
 */
export function updateBalance(id: string, newBalanceCents: number): void {
  init();
  stmtUpdateBalance.run(newBalanceCents, id);
}
