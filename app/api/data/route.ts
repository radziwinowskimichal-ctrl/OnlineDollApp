import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { initialTrailers } from '@/lib/store';

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');
  const trailers = db.prepare('SELECT data FROM trailers').all().map((r: any) => JSON.parse(r.data));
  const profiles = db.prepare('SELECT data FROM profiles').all().map((r: any) => JSON.parse(r.data));
  const workshopOrders = db.prepare('SELECT data FROM workshop_orders').all().map((r: any) => JSON.parse(r.data));
  const workshopNotifications = db.prepare('SELECT data FROM workshop_notifications').all().map((r: any) => JSON.parse(r.data));

  // STRICT RODO / GDPR ENFORCEMENT: Mechanics never receive customer PII or rental agreements
  if (role === 'mechanic') {
    return NextResponse.json({
      trailers,
      clients: [],
      reservations: [],
      profiles,
      backups: [],
      workshopOrders,
      workshopClientDetails: [],
      workshopNotifications: workshopNotifications.filter((n: any) => n.targetRole === 'mechanic'),
    });
  }

  const clients = db.prepare('SELECT data FROM clients').all().map((r: any) => JSON.parse(r.data));
  const reservations = db.prepare('SELECT data FROM reservations').all().map((r: any) => JSON.parse(r.data));
  const backups = db.prepare('SELECT data FROM backups').all().map((r: any) => JSON.parse(r.data));
  const workshopClientDetails = db.prepare('SELECT data FROM workshop_client_details').all().map((r: any) => JSON.parse(r.data));

  return NextResponse.json({
    trailers,
    clients,
    reservations,
    profiles,
    backups,
    workshopOrders,
    workshopClientDetails,
    workshopNotifications,
  });
}

export async function POST(req: Request) {
  const { action, payload } = await req.json();

  try {
    if (action === 'ADD_RESERVATION') {
      db.prepare('INSERT OR REPLACE INTO reservations (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'UPDATE_RESERVATION') {
      db.prepare('UPDATE reservations SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
    } else if (action === 'DELETE_RESERVATION') {
      db.prepare('DELETE FROM reservations WHERE id = ?').run(payload.id);
    } else if (action === 'ADD_TRAILER') {
      db.prepare('INSERT OR REPLACE INTO trailers (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'UPDATE_TRAILER') {
      db.prepare('UPDATE trailers SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
    } else if (action === 'DELETE_TRAILER') {
      db.prepare('DELETE FROM trailers WHERE id = ?').run(payload.id);
    } else if (action === 'RESET_TRAILERS') {
      db.prepare('DELETE FROM trailers').run();
      const insertTrailer = db.prepare('INSERT INTO trailers (id, data) VALUES (?, ?)');
      initialTrailers.forEach((t) => insertTrailer.run(t.id, JSON.stringify(t)));
    } else if (action === 'ADD_CLIENT') {
      db.prepare('INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'UPDATE_CLIENT') {
      db.prepare('UPDATE clients SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
    } else if (action === 'DELETE_CLIENT') {
      db.prepare('DELETE FROM clients WHERE id = ?').run(payload.id);
    } else if (action === 'UPDATE_PROFILE' || action === 'ADD_PROFILE') {
      db.prepare('INSERT OR REPLACE INTO profiles (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'DELETE_PROFILE') {
      db.prepare('DELETE FROM profiles WHERE id = ?').run(payload.id);
    } else if (action === 'SAVE_BACKUP') {
      db.prepare('INSERT OR REPLACE INTO backups (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'DELETE_BACKUP') {
      db.prepare('DELETE FROM backups WHERE id = ?').run(payload.id);
    } else if (action === 'SAVE_WORKSHOP_ORDER') {
      db.prepare('INSERT OR REPLACE INTO workshop_orders (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'DELETE_WORKSHOP_ORDER') {
      db.prepare('DELETE FROM workshop_orders WHERE id = ?').run(payload.id);
      db.prepare('DELETE FROM workshop_client_details WHERE id = ?').run(payload.id);
    } else if (action === 'SAVE_WORKSHOP_CLIENT_DETAILS') {
      db.prepare('INSERT OR REPLACE INTO workshop_client_details (id, data) VALUES (?, ?)').run(payload.orderId, JSON.stringify(payload));
    } else if (action === 'SAVE_WORKSHOP_NOTIFICATION') {
      db.prepare('INSERT OR REPLACE INTO workshop_notifications (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
    } else if (action === 'RESTORE_BACKUP') {
      const { reservations, clients, trailers, mode } = payload;
      const runRestore = db.transaction(() => {
        if (Array.isArray(reservations)) {
          if (mode === 'overwrite') {
            db.prepare('DELETE FROM reservations').run();
          }
          const stmt = db.prepare('INSERT OR REPLACE INTO reservations (id, data) VALUES (?, ?)');
          reservations.forEach((r: any) => stmt.run(r.id, JSON.stringify(r)));
        }
        if (Array.isArray(clients)) {
          if (mode === 'overwrite') {
            db.prepare('DELETE FROM clients').run();
          }
          const stmt = db.prepare('INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)');
          clients.forEach((c: any) => stmt.run(c.id, JSON.stringify(c)));
        }
        if (Array.isArray(trailers)) {
          if (mode === 'overwrite') {
            db.prepare('DELETE FROM trailers').run();
          }
          const stmt = db.prepare('INSERT OR REPLACE INTO trailers (id, data) VALUES (?, ?)');
          trailers.forEach((t: any) => stmt.run(t.id, JSON.stringify(t)));
        }
      });
      runRestore();
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
