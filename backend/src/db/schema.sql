-- =============================================================================
-- HSA Platform — Reference Schema
-- This file is for documentation only. The schema is applied via migrations.ts.
-- =============================================================================

-- Core HSA account with balance stored in cents (avoids float rounding)
CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT    PRIMARY KEY,
  owner_name  TEXT    NOT NULL,
  owner_email TEXT    NOT NULL UNIQUE,
  balance     INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Virtual debit card; one card per account (enforced in service layer)
CREATE TABLE IF NOT EXISTS cards (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id),
  card_number TEXT NOT NULL,
  last_four   TEXT NOT NULL,
  expiry      TEXT NOT NULL,   -- stored as MM/YY
  cvv         TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK(status IN ('active', 'frozen', 'cancelled')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- All financial activity: deposits and card purchases
CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT    PRIMARY KEY,
  account_id     TEXT    NOT NULL REFERENCES accounts(id),
  card_id        TEXT    REFERENCES cards(id),   -- NULL for deposits
  type           TEXT    NOT NULL CHECK(type IN ('deposit', 'purchase')),
  amount         INTEGER NOT NULL CHECK(amount > 0),  -- cents
  merchant_name  TEXT,
  mcc_code       TEXT,                -- Merchant Category Code drives qualification
  qualified      INTEGER,             -- 1=qualified, 0=not, NULL=deposit (not applicable)
  status         TEXT    NOT NULL CHECK(status IN ('approved', 'declined')),
  decline_reason TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
