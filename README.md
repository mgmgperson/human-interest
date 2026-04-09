# HSA Platform

A Health Savings Account (HSA) simulation platform with account management, virtual debit cards, and concurrent transaction processing.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Start both servers concurrently
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

> The frontend Vite dev server proxies `/api` requests to the backend automatically — no CORS configuration needed during development.

## Project Structure

```
hsa-platform/
├── backend/          # Express + TypeScript API
│   └── src/
│       ├── db/           # SQLite client + migrations
│       ├── modules/      # accounts, cards, transactions
│       └── middleware/   # error handling, Zod validation
├── frontend/         # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── api/          # Typed fetch client
│       ├── pages/        # AccountsPage, AccountDetailPage, SimulatorPage
│       └── components/   # Reusable UI components
├── architecture.md   # System design, data model, concurrency
└── ai-usage.md       # AI tool documentation
```

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/accounts` | Create a new HSA account |
| `GET` | `/api/accounts` | List all accounts |
| `GET` | `/api/accounts/:id` | Get account + balance |
| `POST` | `/api/accounts/:id/deposit` | Deposit funds |
| `POST` | `/api/cards` | Issue a virtual debit card |
| `GET` | `/api/cards/:accountId` | Get card for an account |
| `POST` | `/api/transactions` | Process a purchase transaction |
| `GET` | `/api/transactions/:accountId` | List transactions for an account |

## Key Design Decisions

- **Balances stored in cents (integers):** avoids floating-point rounding errors
- **MCC codes for qualification:** uses real-world Merchant Category Codes to classify medical vs. non-medical purchases
- **SQLite `BEGIN IMMEDIATE`:** serializes concurrent writes, preventing double-spend race conditions without external infrastructure

See [architecture.md](architecture.md) for full details.
