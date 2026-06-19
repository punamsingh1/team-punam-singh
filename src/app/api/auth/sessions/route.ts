import { NextResponse } from 'next/server';
import { sessionDb } from '@/lib/couchdb';
import { MaybeDocument } from 'nano';

// 1. Define what a Session looks like so the 'find' result is typed
interface SessionDocument extends MaybeDocument {
  type: 'session';
  userId: string;
  deviceInfo: string;
  isValid: boolean;
  expiresAt: number;
}

// GET: List all active devices
export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in headers' }, { status: 400 });
    }

    // Use a type-safe find
    const result = await sessionDb.find({
      selector: { 
        type: 'session', 
        userId: userId, 
        isValid: true 
      }
    });

    // Cast the docs to our Session interface
    const sessions = result.docs as unknown as SessionDocument[];
    
    return NextResponse.json(sessions);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch sessions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Revoke a specific device (Logout)
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const { sessionId } = body;

    // 1. Get the current session document
    let session: SessionDocument;
    try {
      session = (await sessionDb.get(sessionId)) as unknown as SessionDocument;
    } catch {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Update it to be invalid (Soft Logout)
    // We cast to any/MaybeDocument to bypass the strict Ticket check
  const updatedSession = { 
  ...session, 
  isValid: false 
};

// 2. Insert it directly. No 'as unknown', no 'as Ticket', no 'any'.
await sessionDb.insert(updatedSession);
    // 2. Perform the insert
    // Now TypeScript is happy because 'updatedSession' is technically a 'Ticket' type
    await sessionDb.insert(updatedSession);

   return NextResponse.json({ success: true, message: "Device logged out" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}