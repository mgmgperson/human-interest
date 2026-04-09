import * as AccountsRepo from './accounts.repository';
import * as TransactionsRepo from '../transactions/transactions.repository';
import type { Account, CreateAccountInput } from './accounts.types';
import type { Transaction } from '../transactions/transactions.types';

/** Custom error for not-found cases — routers map this to 404. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Return all accounts. */
export function listAccounts(): Account[] {
  return AccountsRepo.findAll();
}

/** Return a single account, throwing NotFoundError if it doesn't exist. */
export function getAccount(id: string): Account {
  const account = AccountsRepo.findById(id);
  if (!account) throw new NotFoundError(`Account ${id} not found`);
  return account;
}

/** Create and return a new account. */
export function createAccount(input: CreateAccountInput): Account {
  return AccountsRepo.create(input);
}

/**
 * Deposit funds into an account.
 * @param id          Account ID
 * @param amountCents Amount in cents (must be > 0, enforced by Zod schema upstream)
 */
export function deposit(id: string, amountCents: number): Transaction {
  // Confirm account exists before delegating to transactions repo
  const account = AccountsRepo.findById(id);
  if (!account) throw new NotFoundError(`Account ${id} not found`);

  return TransactionsRepo.deposit(id, amountCents);
}
