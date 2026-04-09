import { v4 as uuidv4 } from 'uuid';
import db from './client';

/**
 * Inserts demo data on first run only.
 * Guard: exits immediately if any accounts already exist.
 *
 * Seed state:
 *   - Account 1 "Jane Smith"  — $350.00 balance, active card, 3 transactions
 *   - Account 2 "Bob Johnson" — $0.00 balance, no card (fresh account)
 */
export function seedDatabase(): void {
  const { count } = db
    .prepare('SELECT COUNT(*) as count FROM accounts')
    .get() as { count: number };

  if (count > 0) return;

  const account1Id = uuidv4();
  const account2Id = uuidv4();
  const cardId = uuidv4();

  // Seed is a single atomic transaction so partial state is never visible
  db.transaction(() => {
    // --- Accounts ---
    db.prepare(`
      INSERT INTO accounts (id, owner_name, owner_email, balance)
      VALUES (?, ?, ?, ?)
    `).run(account1Id, 'Jane Smith', 'jane.smith@example.com', 35000); // $350.00

    db.prepare(`
      INSERT INTO accounts (id, owner_name, owner_email, balance)
      VALUES (?, ?, ?, ?)
    `).run(account2Id, 'Bob Johnson', 'bob.johnson@example.com', 0);

    // --- Card for account 1 ---
    db.prepare(`
      INSERT INTO cards (id, account_id, card_number, last_four, expiry, cvv, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(cardId, account1Id, '4111111111111234', '1234', '12/28', '737', 'active');

    // --- Transactions for account 1 ---

    // 1. Initial deposit
    db.prepare(`
      INSERT INTO transactions
        (id, account_id, card_id, type, amount, merchant_name, mcc_code, qualified, status)
      VALUES (?, ?, NULL, 'deposit', ?, NULL, NULL, NULL, 'approved')
    `).run(uuidv4(), account1Id, 50000); // $500.00 deposit

    // 2. Approved purchase — pharmacy (MCC 5912 is a qualified medical expense)
    db.prepare(`
      INSERT INTO transactions
        (id, account_id, card_id, type, amount, merchant_name, mcc_code, qualified, status)
      VALUES (?, ?, ?, 'purchase', ?, ?, ?, ?, 'approved')
    `).run(uuidv4(), account1Id, cardId, 15000, 'CVS Pharmacy', '5912', 1); // $150.00

    // 3. Declined purchase — restaurant (MCC 5812 is not a qualified medical expense)
    db.prepare(`
      INSERT INTO transactions
        (id, account_id, card_id, type, amount, merchant_name, mcc_code, qualified, status, decline_reason)
      VALUES (?, ?, ?, 'purchase', ?, ?, ?, ?, 'declined', ?)
    `).run(
      uuidv4(), account1Id, cardId, 2500, 'The Cheesecake Factory', '5812', 0,
      'Not a qualified medical expense',
    );
  })();
}
