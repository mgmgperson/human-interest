import * as CardsRepo from './cards.repository';
import * as AccountsRepo from '../accounts/accounts.repository';
import { NotFoundError } from '../accounts/accounts.service';
import type { Card, IssueCardInput } from './cards.types';

/** Custom error for business rule violations. Routers map this to 409. */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/** Generates a random 16-digit card number (Luhn-valid format not required for simulation). */
function generateCardNumber(): string {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10));
  return digits.join('');
}

/** Generates a 3-digit CVV. */
function generateCvv(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

/** Generates an expiry date 4 years from now in MM/YY format. */
function generateExpiry(): string {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 4);
  const mm = String(future.getMonth() + 1).padStart(2, '0');
  const yy = String(future.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

/** Return the active card for an account, or undefined if none. */
export function getCardForAccount(accountId: string): Card | undefined {
  return CardsRepo.findByAccountId(accountId).find((c) => c.status === 'active');
}

/**
 * Issue a virtual debit card for an account.
 * Enforces: account must exist, account must not already have an active card.
 */
export function issueCard(input: IssueCardInput): Card {
  const account = AccountsRepo.findById(input.account_id);
  if (!account) throw new NotFoundError(`Account ${input.account_id} not found`);

  const activeCount = CardsRepo.countActive(input.account_id);
  if (activeCount > 0) throw new ConflictError('Account already has an active card');

  const cardNumber = generateCardNumber();
  const lastFour = cardNumber.slice(-4);

  return CardsRepo.create(input.account_id, cardNumber, lastFour, generateExpiry(), generateCvv());
}
