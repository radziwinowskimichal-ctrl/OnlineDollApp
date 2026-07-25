import Database from 'better-sqlite3';
import { initialTrailers, initialClients, initialReservations, initialProfiles } from './store';
import path from 'path';

// Define database location
const dbPath = path.join(process.cwd(), 'database.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema if empty
db.exec(`
  CREATE TABLE IF NOT EXISTS trailers (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

// Insert initial data if tables are empty
const countTrailer = (db.prepare('SELECT COUNT(*) as count FROM trailers').get() as { count: number }).count;
if (countTrailer === 0) {
  const insertTrailer = db.prepare('INSERT INTO trailers (id, data) VALUES (?, ?)');
  initialTrailers.forEach(t => insertTrailer.run(t.id, JSON.stringify(t)));
}

const countClient = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number }).count;
if (countClient === 0) {
  const insertClient = db.prepare('INSERT INTO clients (id, data) VALUES (?, ?)');
  initialClients.forEach(c => insertClient.run(c.id, JSON.stringify(c)));
}

const countRes = (db.prepare('SELECT COUNT(*) as count FROM reservations').get() as { count: number }).count;
if (countRes === 0) {
  const insertRes = db.prepare('INSERT INTO reservations (id, data) VALUES (?, ?)');
  initialReservations.forEach(r => insertRes.run(r.id, JSON.stringify(r)));
}

const countProfile = (db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number }).count;
if (countProfile === 0) {
  const insertProfile = db.prepare('INSERT INTO profiles (id, data) VALUES (?, ?)');
  initialProfiles.forEach(p => insertProfile.run(p.id, JSON.stringify(p)));
}

export default db;
