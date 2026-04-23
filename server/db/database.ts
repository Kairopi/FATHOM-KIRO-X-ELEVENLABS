import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, '..', 'fathom.db');
const schemaPath = path.join(__dirname, 'schema.sql');

let db: Database;

/**
 * Initialize the sql.js database. Must be called before any queries.
 * Loads existing DB file if present, otherwise creates a new one.
 */
export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  // Load existing database file if it exists
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON;');

  // Run schema on startup (CREATE IF NOT EXISTS is safe to re-run)
  // Use exec() for multiple statements
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Persist initial state
  saveDatabase();
}

/**
 * Persist the in-memory database to disk.
 */
export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);
}

/**
 * Get the database instance. Throws if not initialized.
 */
export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export default { getDb, initDatabase, saveDatabase };
