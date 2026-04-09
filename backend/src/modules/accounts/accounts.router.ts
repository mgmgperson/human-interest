import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as AccountsService from './accounts.service';

export const accountsRouter = Router();

const createAccountSchema = z.object({
  owner_name: z.string().min(1, 'Owner name is required'),
  owner_email: z.string().email('Must be a valid email'),
});

// Amount sent over the wire is in dollars (user-facing); convert to cents here
const depositSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
});

/** GET /api/accounts — list all accounts */
accountsRouter.get('/', (_req, res, next) => {
  try {
    res.json(AccountsService.listAccounts());
  } catch (err) {
    next(err);
  }
});

/** GET /api/accounts/:id — get a single account */
accountsRouter.get<{ id: string }>('/:id', (req, res, next) => {
  try {
    res.json(AccountsService.getAccount(req.params.id));
  } catch (err) {
    next(err);
  }
});

/** POST /api/accounts — create a new account */
accountsRouter.post('/', validate(createAccountSchema), (req, res, next) => {
  try {
    const account = AccountsService.createAccount(req.body);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/accounts/:id/deposit
 * Body: { amount: number } — dollars (converted to cents in this handler)
 */
accountsRouter.post<{ id: string }>('/:id/deposit', validate(depositSchema), (req, res, next) => {
  try {
    const amountCents = Math.round(req.body.amount * 100);
    const transaction = AccountsService.deposit(req.params.id, amountCents);
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});
