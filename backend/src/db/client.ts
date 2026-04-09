import Database from 'better-sqlite3';
import path from 'path';

// DB path can be overridden via env var (useful for testing)
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../hsa.db');

const db = new Database(DB_PATH);

// WAL: readers don't block writers and vice versa — needed for concurrent transactions
db.pragma('journal_mode = WAL');

// Enforce FK constraints at the DB level as a safety net
db.pragma('foreign_keys = ON');

// Wait up to 5s on write lock contention before throwing SQLITE_BUSY
db.pragma('busy_timeout = 5000');

export default db;
