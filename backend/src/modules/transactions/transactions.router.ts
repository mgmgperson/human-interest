import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as TransactionsService from './transactions.service';

export const transactionsRouter = Router();

// Amount is in dollars on the wire; converted to cents in the handler
const purchaseSchema = z.object({
  account_id: z.string().min(1, 'Account ID is required'),
  card_id: z.string().min(1, 'Card ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  merchant_name: z.string().min(1, 'Merchant name is required'),
  mcc_code: z
    .string()
    .length(4, 'MCC code must be 4 digits')
    .regex(/^\d{4}$/, 'MCC code must be 4 digits'),
});

/** GET /api/transactions/:accountId — list all transactions for an account */
transactionsRouter.get('/:accountId', (req, res, next) => {
  try {
    res.json(TransactionsService.listTransactions(req.params.accountId));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/transactions
 * Process a purchase. Returns 201 on approval, 402 on decline (transaction still recorded).
 */
transactionsRouter.post('/', validate(purchaseSchema), (req, res, next) => {
  try {
    const amountCents = Math.round(req.body.amount * 100);
    const transaction = TransactionsService.processPurchase({
      ...req.body,
      amount: amountCents,
    });
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});
