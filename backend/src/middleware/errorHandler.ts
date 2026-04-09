import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../modules/accounts/accounts.service';
import { ConflictError } from '../modules/cards/cards.service';
import { TransactionDeclinedError } from '../modules/transactions/transactions.service';

/**
 * Central error handler — must be the last middleware registered.
 * Maps domain errors to appropriate HTTP status codes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err instanceof TransactionDeclinedError) {
    // 402 Payment Required — transaction was processed but declined
    res.status(402).json({
      error: err.message,
      transaction: err.transaction,
    });
    return;
  }

  // Unique constraint violation (e.g. duplicate email)
  if ((err as NodeJS.ErrnoException).message?.includes('UNIQUE constraint failed')) {
    res.status(409).json({ error: 'A record with that value already exists' });
    return;
  }

  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
