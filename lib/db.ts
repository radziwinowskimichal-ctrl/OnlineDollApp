import Database from 'better-sqlite3';
import { initialTrailers, initialClients, initialReservations, initialProfiles } from './store';
import {
  initialWorkshopOrders,
  initialWorkshopClientDetails,
  initialWorkshopNotifications,
} from './workshop-types';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

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

  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workshop_orders (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workshop_client_details (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workshop_notifications (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

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

const existingProfiles = db.prepare('SELECT id FROM profiles').all() as Array<{ id: string }>;
const existingProfileIds = new Set(existingProfiles.map((p) => p.id));
const insertProfile = db.prepare('INSERT OR IGNORE INTO profiles (id, data) VALUES (?, ?)');
initialProfiles.forEach((p) => {
  if (!existingProfileIds.has(p.id)) {
    insertProfile.run(p.id, JSON.stringify(p));
  }
});

const countWorkshopOrders = (db.prepare('SELECT COUNT(*) as count FROM workshop_orders').get() as { count: number }).count;
if (countWorkshopOrders === 0) {
  const insertWO = db.prepare('INSERT INTO workshop_orders (id, data) VALUES (?, ?)');
  initialWorkshopOrders.forEach((o) => insertWO.run(o.id, JSON.stringify(o)));

  const insertWCD = db.prepare('INSERT INTO workshop_client_details (id, data) VALUES (?, ?)');
  initialWorkshopClientDetails.forEach((d) => insertWCD.run(d.orderId, JSON.stringify(d)));

  const insertWN = db.prepare('INSERT INTO workshop_notifications (id, data) VALUES (?, ?)');
  initialWorkshopNotifications.forEach((n) => insertWN.run(n.id, JSON.stringify(n)));
}

export default db;
