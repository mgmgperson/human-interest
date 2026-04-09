import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import * as CardsService from './cards.service';

export const cardsRouter = Router();

const issueCardSchema = z.object({
  account_id: z.string().min(1, 'Account ID is required'),
});

/** GET /api/cards/:accountId — get the active card for an account */
cardsRouter.get('/:accountId', (req, res, next) => {
  try {
    const card = CardsService.getCardForAccount(req.params.accountId);
    if (!card) {
      res.status(404).json({ error: 'No active card for this account' });
      return;
    }
    res.json(card);
  } catch (err) {
    next(err);
  }
});

/** POST /api/cards — issue a new virtual debit card */
cardsRouter.post('/', validate(issueCardSchema), (req, res, next) => {
  try {
    const card = CardsService.issueCard(req.body);
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
});
