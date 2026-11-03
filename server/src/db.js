// Lapisan database: node:sqlite (WAL). Skema ditulis SQL standar dan dijaga
// portabel agar migrasi ke PostgreSQL nanti tinggal mengganti driver.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function openDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      faskes_code TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);
    -- Data aplikasi per klinik (cermin kunci data frontend), terisolasi per tenant.
    CREATE TABLE IF NOT EXISTS clinic_data (
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (clinic_id, key)
    );
    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens(token_hash);
    CREATE TABLE IF NOT EXISTS subscriptions (
      clinic_id TEXT PRIMARY KEY REFERENCES clinics(id),
      plan TEXT NOT NULL DEFAULT 'trial',
      status TEXT NOT NULL DEFAULT 'trialing',
      trial_ends_at TEXT,
      current_period_end TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS integration_credentials (
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      provider TEXT NOT NULL,
      enc_payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (clinic_id, provider)
    );
    CREATE TABLE IF NOT EXISTS mail_outbox (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sent_at TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_clinic ON audit_log(clinic_id, created_at);
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      plan TEXT NOT NULL,
      months INTEGER NOT NULL DEFAULT 1,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      gateway TEXT,
      gateway_ref TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT
    );
    CREATE TABLE IF NOT EXISTS platform_admins (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export const nowIso = () => new Date().toISOString();
