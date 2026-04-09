import express from 'express';
import cors from 'cors';
import { runMigrations, seedDatabase } from './db';
import { accountsRouter } from './modules/accounts/accounts.router';
import { cardsRouter } from './modules/cards/cards.router';
import { transactionsRouter } from './modules/transactions/transactions.router';
import { errorHandler } from './middleware/errorHandler';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/accounts', accountsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/transactions', transactionsRouter);

// Health check — useful for verifying the server is up
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Central error handler — must be registered after all routes
app.use(errorHandler);

// --- Startup ---
runMigrations();

if (process.env.NODE_ENV !== 'production') {
  seedDatabase();
}

app.listen(PORT, () => {
  console.log(`HSA API running on http://localhost:${PORT}`);
});

export default app;
