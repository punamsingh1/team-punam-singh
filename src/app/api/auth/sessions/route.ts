import { NextResponse } from 'next/server';
import { sessionDb } from '@/lib/couchdb';
import { verifyJWT } from '@/lib/auth-utils';
import { MaybeDocument } from 'nano';

// 1. Unified Interface
export interface SessionDocument extends MaybeDocument {
  type: 'session';
  userId: string;
  userAgent: string;
  platform: string;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

export async function DELETE(req: Request) {
  try {
    // 2. Authorize
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token, 'access');
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 3. Get Session ID
    const body = await req.json().catch(() => null) as { sessionId?: string } | null;
    if (!body?.sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // 4. Fetch the existing document
    // We cast to SessionDocument, which is a subtype of MaybeDocument
    let session: SessionDocument;
    try {
      session = await sessionDb.get(body.sessionId) as SessionDocument;
    } catch {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 5. SECURITY CHECK (Mandatory)
    // Ensure the user is only deleting their OWN session
    if (session.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 6. Update (CouchDB requires _rev to be preserved, which ...session does)
    const updatedSession: SessionDocument = {
      ...session,
      isValid: false
    };

    // Save back to DB
    await sessionDb.insert(updatedSession);

    return NextResponse.json({ success: true, message: "Device logged out" });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}