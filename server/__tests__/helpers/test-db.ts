import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

export async function createTestDb(): Promise<Database> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.run(schema);
  return db;
}
