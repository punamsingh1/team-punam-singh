import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sessionDb } from '@/lib/couchdb'; 
import type { DocumentGetResponse } from 'nano';

interface UserSession extends DocumentGetResponse {
  userId: string;
  revoked: boolean;
  deviceName?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'ttteeee-fixed-ultra-secret-key-2026';

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    // VERIFICATION using the Unified Secret
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { sessionId: string, userId: string };
    
    if (!decoded || !decoded.sessionId) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const session = await sessionDb.get(decoded.sessionId) as UserSession;

    if (!session || session.revoked) {
      return NextResponse.json({ error: 'Session revoked' }, { status: 403 });
    }

    // Issue new Access Token
    const newAccessToken = jwt.sign(
      { userId: session.userId },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return NextResponse.json({ 
      success: true, 
      accessToken: newAccessToken 
    });

  } catch  {
    return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
  }
}