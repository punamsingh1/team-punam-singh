// src/app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server';
import { userDb, tokenDb, initDatabases } from '@/lib/couchdb';
import { VerificationTokenDocument, UserDocument } from '@/types/database';

export const runtime = 'nodejs';

// ─── Shared verify logic 
async function handleVerify(token: string): Promise<NextResponse> {
  if (!token || token.trim() === '') {
    return NextResponse.json(
      { message: 'Missing token' },
      { status: 400 }
    );
  }

  await initDatabases();

  // ─── Find token document in tokenDb 
  const tokenResult = await tokenDb.find({
    selector: { token: token },
    limit: 1,
  });

  if (!tokenResult.docs || tokenResult.docs.length === 0) {
    console.log('❌ Token not found in tokenDb:', token);
    return NextResponse.json(
      { message: 'Invalid or already used token' },
      { status: 400 }
    );
  }

  const verificationToken = tokenResult.docs[0] as unknown as VerificationTokenDocument;

  // ─── Check expiry 
  if (new Date(verificationToken.expires) < new Date()) {
    await tokenDb.destroy(verificationToken._id, verificationToken._rev);
    return NextResponse.json(
      { message: 'Token has expired. Please register again.' },
      { status: 400 }
    );
  }

  // ─── Fetch user 
  let existingUser: UserDocument;
  try {
    existingUser = await userDb.get(verificationToken.email) as UserDocument;
  } catch {
    return NextResponse.json(
      { message: 'User not found for this token.' },
      { status: 404 }
    );
  }

  // ─── Already verified guard ───────────────────────────────────────────────
  if (existingUser.emailVerified) {
    return NextResponse.json(
      { message: 'Email already verified. Please login.' },
      { status: 200 }
    );
  }

  // ─── Activate user ────────────────────────────────────────────────────────
  const updatedUser: UserDocument = {
    ...existingUser,
    emailVerified: new Date().toISOString(),
    status: 'ACTIVE',
  };
  await userDb.insert(updatedUser);

  // ─── Delete used token ────────────────────────────────────────────────────
  await tokenDb.destroy(verificationToken._id, verificationToken._rev);

  console.log('✅ Email verified for:', verificationToken.email);

  return NextResponse.json(
    { success: true, message: 'Email verified successfully. You can now login.' },
    { status: 200 }
  );
}

// ─── GET: handles email link click ───────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') ?? '';
    console.log('🔍 GET verify token:', token.slice(0, 16) + '...');
    return await handleVerify(token);
  } catch (error) {
    console.error('Verify GET Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST: handles page UI calling API programmatically ──────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token ?? '';
    console.log('🔍 POST verify token:', token.slice(0, 16) + '...');
    return await handleVerify(token);
  } catch (error) {
    console.error('Verify POST Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}