import { NextResponse } from 'next/server';
import { headers } from "next/headers";
import bcrypt from 'bcryptjs';
import { userDb, sessionDb } from '@/lib/couchdb';
import { generateTokens } from '@/lib/auth-utils';
import crypto from 'node:crypto';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  password?: string;
}

interface CouchFindResponse {
  docs: UserDoc[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Credentials missing" }, { status: 400 });
    }

    const userEmail = email.toLowerCase().trim();
    console.log("🔍 Attempting Identity Verification for:", userEmail);

    const result = await userDb.find({
      selector: { email: userEmail },
      limit: 1
    }) as unknown as CouchFindResponse;

    const user = result.docs[0];

    if (!user || !user.password) {
      console.warn("❌ Auth Denied: User not found in CouchDB");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("❌ Auth Denied: Password hash mismatch");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";

    // CHANGED: Detect web vs mobile
    const platform = headersList.get("x-platform") || "web";
    const isMobile = platform === "ios" || platform === "android";

    const sessionId = crypto.randomBytes(16).toString('hex');

    const newSession = {
      _id: `session:${sessionId}`,
      userId: user._id,
      userAgent: userAgent,
      platform: platform,                                           // CHANGED: store platform
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    };

    await sessionDb.insert(newSession);

    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);

    console.log("✅ Identity Verified & Session Created:", userEmail);

    // CHANGED: accessToken in JSON body (frontend keeps in memory)
    // refreshToken → HttpOnly cookie for web, JSON body for mobile
    const response = NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
      accessToken: accessToken,                                     // CHANGED: moved here
      ...(isMobile && { refreshToken: refreshToken }),              // CHANGED: mobile only
    }, { status: 200 });

    // CHANGED: refreshToken in HttpOnly cookie for web (not accessToken)
    if (!isMobile) {
      response.cookies.set('refreshToken', refreshToken, {         // CHANGED: refreshToken here
        httpOnly: true,                                             // JS cannot read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',                                        // CHANGED: strict > lax
        path: '/',                                 // CHANGED: scoped path
        maxAge: 60 * 60 * 24 * 30,                                // CHANGED: 30 days
      });
    }

    return response;

  } catch (error: unknown) {
    const err = error as Error;
    console.error("🚨 CRITICAL_LOGIN_ERROR:", err.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}