# Architecture
(file formatted by AI for markdown syntax and clarity)

## System Architecture

The HSA platform is a two-service application running locally:

- **Backend** — Node.js + Express + TypeScript REST API on port 3001
- **Frontend** — React + TypeScript + Vite on port 5173
- **Database** — SQLite file (`backend/hsa.db`) accessed synchronously via `better-sqlite3`

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│         Frontend (5173)         │       │          Backend (3001)          │
│                                 │       │                                  │
│  React + Vite + Tailwind        │──────▶│  Express + TypeScript            │
│  Pages: Accounts, Detail,       │  HTTP │  Modules: accounts, cards,       │
│         Simulator               │◀──────│           transactions           │
└─────────────────────────────────┘  JSON └──────────────┬───────────────────┘
                                                         │
                                                         ▼
                                              ┌───────────────────────┐
                                              │   SQLite (hsa.db)     │
                                              └───────────────────────┘
```

### Why this architecture?

Several alternatives were considered:

| Option | Why rejected |
|---|---|
| **Monolithic (Express + server-rendered HTML)** | Harder to demonstrate clean API boundaries, not scalable|
| **Microservices** | Significant operational overhead for a local simulation, too much "overengineering" |
| **Event bus / message queue** | Solves distributed concurrency, but adds infrastructure (redis) that isn't needed at this scale |
| **3-tier with separate DB server (Postgres)** | Honestly this is fine, but it did need Postgres server setup, which is a pain |

The two-service split is pretty classic, keeping the API and UI separated in code, where if one breaks, the other will still be functional. Definitely the best for this specific use case of having little time but also having to make a system that is understandable yet solves all these constraints.

---

## Request Flow

```
User → React UI
             │
             │  fetch() to localhost:3001
             │  (proxied by Vite server)
             ▼
        Express Router
             │
             ├── /api/accounts      → AccountsService   → AccountsRepository   → SQLite
             ├── /api/cards         → CardsService       → CardsRepository       → SQLite
             └── /api/transactions  → TransactionsService → TransactionsRepository
                                                               │
                                                               ├── MCC qualification check
                                                               ├── BEGIN IMMEDIATE transaction
                                                               ├── Balance check
                                                               └── Write result → SQLite
```

On the backend, there are a few layers for logic separation:

- **Router** — parses HTTP request, validates, calls service, shapes response
- **Service** — owns business rules and errors
- **Repository** — all SQL lives here

Validation errors return `400`. Domain errors (`NotFound`, `Conflict`) map to `404`/`409` via a central error handler middleware. Declined transactions return `402` with the transaction record included in the body — the frontend handles `402` as a non-error so the result is still displayed.

---

## Data Model

Three tables with have a foreign key chain: `transactions → cards → accounts`.

```sql
accounts
  id          TEXT PRIMARY KEY         -- UUID
  owner_name  TEXT NOT NULL
  owner_email TEXT NOT NULL UNIQUE
  balance     INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0)  -- stored in cents
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))

cards
  id          TEXT PRIMARY KEY
  account_id  TEXT NOT NULL REFERENCES accounts(id)
  card_number TEXT NOT NULL            -- full 16-digit number
  last_four   TEXT NOT NULL
  expiry      TEXT NOT NULL            -- MM/YY
  cvv         TEXT NOT NULL
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK(status IN ('active', 'frozen', 'cancelled'))
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))

transactions
  id             TEXT PRIMARY KEY
  account_id     TEXT NOT NULL REFERENCES accounts(id)
  card_id        TEXT REFERENCES cards(id)   -- NULL for deposits
  type           TEXT NOT NULL CHECK(type IN ('deposit', 'purchase'))
  amount         INTEGER NOT NULL CHECK(amount > 0)  -- cents
  merchant_name  TEXT
  mcc_code       TEXT                        -- Merchant Category Code
  qualified      INTEGER                     -- 1=qualified, 0=not, NULL=deposit
  status         TEXT NOT NULL CHECK(status IN ('approved', 'declined'))
  decline_reason TEXT
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
```

**Some key decisions:**

- **Balance in cents (INTEGER), not DECIMAL/FLOAT.** Floating point arithmetic is bad for transactions, so we did it in cents.
- **MCC codes drive qualification**, not merchant name strings. Didn't know this at first, but there are "Merchant Category Codes", how actual card networks use to classify purchases. A pharmacy is `5912`, for example, allowing for real-world mapping. See `mcc.ts` for the full list.
- **Schema lives in `migrations.ts`**, which runs at server startup using `CREATE TABLE IF NOT EXISTS`. There is a `schema.sql` file, only for reference.

---

## Concurrency Handling

`better-sqlite3` transactions expose a `.immediate()` method, which issues `BEGIN IMMEDIATE` before reading the balance. This lets us use SQLite's write lock upfront, before any reads happen. Thus, if two requests arrive at the same time, one gets the lock and the other waits (up to the `busy_timeout` of 5 seconds). 

```
POST /api/transactions
  │
  ▼
BEGIN IMMEDIATE  ← SQLite acquires write lock here, requests can queue
  │
  ├─ SELECT balance FROM accounts WHERE id = ?
  │
  ├─ Is MCC a qualified medical expense?
  │    └─ NO  → INSERT transaction (status=declined, reason='Not a qualified medical expense')
  │             COMMIT, return 402
  │
  ├─ Is card status = 'active'?
  │    └─ NO  → INSERT transaction (status=declined, reason='Card is frozen/cancelled')
  │             COMMIT, return 402
  │
  ├─ balance >= amount?
  │    └─ NO  → INSERT transaction (status=declined, reason='Insufficient balance')
  │             COMMIT, return 402
  │
  └─ YES → UPDATE accounts SET balance = balance - amount
           INSERT transaction (status=approved)
           COMMIT, return 201
```

All declined transactions (even concurrent) are still written to the database for record-keeping.

---

## Design Tradeoffs

**SQLite vs. Postgres**

SQLite's serialized writes are sufficient for a local simulation. In production, the correct approach would be Postgres with `SELECT ... FOR UPDATE` row-level locking, which serializes only the rows being written rather than the entire database. Postgres would be better for scalability, but for this purpose, a SQLite sufficed for easy setup.

**Prepared statements initialized lazily**

`better-sqlite3`'s `db.prepare()` compiles SQL against the live schema at the moment it's called. Because Node.js resolves all `import` statements before running any module body code, `db.prepare()` calls would fire before `runMigrations()` has had a chance to create the tables. Thus, we've used a lazy `init()` pattern to compile on first function call. If we were to set up a databaase server (not on `npm run dev`), this would be completely different.

**One card per account**

The schema allows multiple cards (to preserve history if a card is cancelled and reissued), but the service layer enforces a maximum of one active card at a time. Took the liberty of mirroring how IRL cards would work.

**402 for declined transactions**

HTTP `402 Payment Required` is returned for declined purchases. The transaction record is included in the response body. The frontend treats `402` as a non-error, and the result is displayed to the user (with decline reason) rather than thrown as an exception. Another design issue for more clarity on the UI.
