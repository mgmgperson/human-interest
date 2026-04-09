import * as TransactionsRepo from './transactions.repository';
import * as CardsRepo from '../cards/cards.repository';
import * as AccountsRepo from '../accounts/accounts.repository';
import { NotFoundError } from '../accounts/accounts.service';
import type { Transaction, PurchaseInput } from './transactions.types';

/** Custom error for declined transactions. Routers map this to 402. */
export class TransactionDeclinedError extends Error {
  constructor(
    message: string,
    public readonly transaction: Transaction,
  ) {
    super(message);
    this.name = 'TransactionDeclinedError';
  }
}

/** Return all transactions for an account, newest first. */
export function listTransactions(accountId: string): Transaction[] {
  const account = AccountsRepo.findById(accountId);
  if (!account) throw new NotFoundError(`Account ${accountId} not found`);

  return TransactionsRepo.findByAccountId(accountId);
}

/**
 * Process a purchase transaction.
 * Returns the transaction record regardless of approval/decline.
 * Throws TransactionDeclinedError if declined (so routers can respond with 402).
 */
export function processPurchase(input: PurchaseInput): Transaction {
  // Validate card belongs to account (repository also checks, but fail fast here)
  const card = CardsRepo.findById(input.card_id);
  if (!card) throw new NotFoundError(`Card ${input.card_id} not found`);
  if (card.account_id !== input.account_id) {
    throw new NotFoundError(`Card ${input.card_id} does not belong to account ${input.account_id}`);
  }

  const tx = TransactionsRepo.purchase(input);

  if (tx.status === 'declined') {
    throw new TransactionDeclinedError(tx.decline_reason ?? 'Transaction declined', tx);
  }

  return tx;
}
