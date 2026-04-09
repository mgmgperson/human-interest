import { v4 as uuidv4 } from 'uuid';
import db from '../../db/client';
import { updateBalance, findById as findAccountById } from '../accounts/accounts.repository';
import { findById as findCardById } from '../cards/cards.repository';
import { isQualifiedMedicalExpense } from './mcc';
import type { Transaction, PurchaseInput } from './transactions.types';

// Lazy-initialized — see accounts.repository.ts for rationale
let stmtFindByAccount: ReturnType<typeof db.prepare<[string], Transaction>>;
let stmtInsertDeposit: ReturnType<typeof db.prepare<[string, string, number], Transaction>>;
let stmtInsertPurchase: ReturnType<
  typeof db.prepare<[string, string, string, number, string, string, number, string, string | null], Transaction>
>;

function init() {
  if (stmtFindByAccount) return;
  stmtFindByAccount = db.prepare<[string], Transaction>(
    'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC',
  );
  stmtInsertDeposit = db.prepare<[string, string, number], Transaction>(`
    INSERT INTO transactions (id, account_id, type, amount, status)
    VALUES (?, ?, 'deposit', ?, 'approved')
    RETURNING *
  `);
  stmtInsertPurchase = db.prepare<
    [string, string, string, number, string, string, number, string, string | null],
    Transaction
  >(`
    INSERT INTO transactions
      (id, account_id, card_id, type, amount, merchant_name, mcc_code, qualified, status, decline_reason)
    VALUES (?, ?, ?, 'purchase', ?, ?, ?, ?, ?, ?)
    RETURNING *
  `);
}

/** Return all transactions for an account, newest first. */
export function findByAccountId(accountId: string): Transaction[] {
  init();
  return stmtFindByAccount.all(accountId);
}

/**
 * Credit the account balance and record an approved deposit.
 * Runs inside a single atomic transaction.
 */
export function deposit(accountId: string, amountCents: number): Transaction {
  init();
  return db.transaction(() => {
    const account = findAccountById(accountId);
    if (!account) throw new Error('Account not found');

    updateBalance(accountId, account.balance + amountCents);
    return stmtInsertDeposit.get(uuidv4(), accountId, amountCents) as Transaction;
  })();
}

/**
 * Process a purchase against the account balance.
 *
 * Uses BEGIN IMMEDIATE so the balance read + write is atomic.
 * If two purchases race, SQLite queues the second until the first commits —
 * this prevents the $100 balance from going negative with concurrent $80/$50 purchases.
 *
 * Decline reasons (checked in order):
 *   1. Account not found
 *   2. Card not found or doesn't belong to account
 *   3. MCC not a qualified medical expense
 *   4. Card not active
 *   5. Insufficient balance
 */
export function purchase(input: PurchaseInput): Transaction {
  init();

  const txFn = db.transaction(() => {
    const account = findAccountById(input.account_id);
    if (!account) throw new Error('Account not found');

    const card = findCardById(input.card_id);
    if (!card || card.account_id !== input.account_id) throw new Error('Card not found');

    const qualified = isQualifiedMedicalExpense(input.mcc_code);
    const hasFunds = account.balance >= input.amount;

    let declineReason: string | null = null;
    if (!qualified) {
      declineReason = 'Not a qualified medical expense';
    } else if (card.status !== 'active') {
      declineReason = `Card is ${card.status}`;
    } else if (!hasFunds) {
      declineReason = 'Insufficient balance';
    }

    const approved = declineReason === null;

    if (approved) {
      updateBalance(input.account_id, account.balance - input.amount);
    }

    return stmtInsertPurchase.get(
      uuidv4(),
      input.account_id,
      input.card_id,
      input.amount,
      input.merchant_name,
      input.mcc_code,
      qualified ? 1 : 0,
      approved ? 'approved' : 'declined',
      declineReason,
    ) as Transaction;
  });

  // .immediate() issues BEGIN IMMEDIATE — acquires the write lock upfront so
  // concurrent purchases are serialized at the DB level, not application level.
  return txFn.immediate();
}
