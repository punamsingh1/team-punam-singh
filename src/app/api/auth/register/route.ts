// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { userDb, tokenDb, initDatabases } from '@/lib/couchdb';
import { sendVerificationEmail } from '@/lib/mail-utils';

export const runtime = 'nodejs';

interface UserIdentity {
  _id: string;
  name: string;
  email: string;
  password: string;
  deviceName: string;
  emailVerified: boolean;
  status: 'PENDING' | 'ACTIVE';
  createdAt: string;
}

// 1. Existing Registration Logic
export async function POST(req: Request) {
  try {
    await initDatabases();

    // ─── Safe body parse 
    let body: {
      name?: string;
      email?: string;
      password?: string;
      deviceName?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, email, password, deviceName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing credentials' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log('📝 Registering:', cleanEmail);

    // ─── Check if user already exists 
    try {
      await userDb.get(cleanEmail);
      return NextResponse.json(
        { message: 'This email is already registered.' },
        { status: 409 }
      );
    } catch (err) {
      const e = err as { statusCode?: number };
      if (e.statusCode !== 404) throw err;
      // 404 = user does not exist = good, continue
    }

    // ─── Hash password 
    const passwordHash = await bcrypt.hash(password, 10);

    const userData: UserIdentity = {
      _id: cleanEmail,
      name: name || 'Tee User',
      email: cleanEmail,
      password: passwordHash,
      deviceName: deviceName || 'Unknown Device',
      emailVerified: false,
      status: 'PENDING',       // ← never ACTIVE until email verified
      createdAt: new Date().toISOString(),
    };

    await userDb.insert(userData);
    console.log('👤 User saved to userDb:', cleanEmail);

    // ─── Save token to tokenDb 
    const rawToken = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Token generated:', rawToken.slice(0, 16) + '...');

    const tokenDoc = {
      _id: `verify_${cleanEmail}_${Date.now()}`,
      token: rawToken,
      email: cleanEmail,
      expires: new Date(
        Date.now() + 24 * 60 * 60 * 1000  // 24 hours
      ).toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const saveResult = await tokenDb.insert(tokenDoc);
      console.log('✅ Token saved to tokenDb. ID:', saveResult.id);
    } catch (tokenErr) {
      console.error('❌ CRITICAL: Token save to tokenDb failed:', tokenErr);
      try {
        const savedUser = await userDb.get(cleanEmail) as { _rev: string };
        await userDb.destroy(cleanEmail, savedUser._rev);
        console.log('🔄 User rolled back due to token save failure');
      } catch {
        console.error('⚠️ Rollback also failed — manual cleanup needed');
      }
      return NextResponse.json(
        { message: 'Registration failed. Please try again.' },
        { status: 500 }
      );
    }

    // ─── Send verification email ────────────────────────────────────────────
    const emailSent = await sendVerificationEmail(cleanEmail, rawToken);
    if (!emailSent) {
      console.warn('⚠️ Token saved but verification email failed to send.');
    }

    console.log('✅ Registration complete for:', cleanEmail);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Check MailDev for verification.',
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 409) {
      return NextResponse.json(
        { message: 'This email is already registered.' },
        { status: 409 }
      );
    }
    console.error('Registration Error:', err);
    return NextResponse.json(
      { message: 'Handshake Failed: Database Connection Error' },
      { status: 500 }
    );
  }
}

// 2. Added GET handler to silence Next.js pre-fetch 405 logs
export async function GET() {
  return new Response(null, { status: 204 }); 
}