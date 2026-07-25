import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { initialTrailers } from '@/lib/store';

export async function GET() {
  const trailers = db.prepare('SELECT data FROM trailers').all().map((r: any) => JSON.parse(r.data));
  const clients = db.prepare('SELECT data FROM clients').all().map((r: any) => JSON.parse(r.data));
  const reservations = db.prepare('SELECT data FROM reservations').all().map((r: any) => JSON.parse(r.data));
  const profiles = db.prepare('SELECT data FROM profiles').all().map((r: any) => JSON.parse(r.data));

  return NextResponse.json({ trailers, clients, reservations, profiles });
}

export async function POST(req: Request) {
  const { action, payload } = await req.json();
  
  try {
      if (action === 'ADD_RESERVATION') {
          db.prepare('INSERT INTO reservations (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
      } else if (action === 'UPDATE_RESERVATION') {
          db.prepare('UPDATE reservations SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
      } else if (action === 'DELETE_RESERVATION') {
          db.prepare('DELETE FROM reservations WHERE id = ?').run(payload.id);
      } else if (action === 'ADD_TRAILER') {
          db.prepare('INSERT INTO trailers (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
      } else if (action === 'UPDATE_TRAILER') {
          db.prepare('UPDATE trailers SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
      } else if (action === 'DELETE_TRAILER') {
          db.prepare('DELETE FROM trailers WHERE id = ?').run(payload.id);
      } else if (action === 'RESET_TRAILERS') {
          db.prepare('DELETE FROM trailers').run();
          const insertTrailer = db.prepare('INSERT INTO trailers (id, data) VALUES (?, ?)');
          initialTrailers.forEach(t => insertTrailer.run(t.id, JSON.stringify(t)));
      } else if (action === 'ADD_CLIENT') {
          db.prepare('INSERT INTO clients (id, data) VALUES (?, ?)').run(payload.id, JSON.stringify(payload));
      } else if (action === 'UPDATE_CLIENT') {
          db.prepare('UPDATE clients SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
      } else if (action === 'UPDATE_PROFILE') {
          db.prepare('UPDATE profiles SET data = ? WHERE id = ?').run(JSON.stringify(payload), payload.id);
      }
      return NextResponse.json({ success: true });
  } catch(e) {
      console.error(e);
      return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
