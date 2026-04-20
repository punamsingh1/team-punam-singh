import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userDb } from '@/lib/couchdb'; 
import { generateTokens } from '@/lib/auth-utils'; 

// 1. Strict Interface Definition
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

    // 2. Input Validation & Normalization
    if (!email || !password) {
      return NextResponse.json({ message: "Credentials missing" }, { status: 400 });
    }

    const userEmail = email.toLowerCase().trim();
    console.log("🔍 Attempting Identity Verification for:", userEmail);

    /**
     * 3. Selector-Based Fetch (Ttteeee Recommended)
     * This searches the 'email' field regardless of what the '_id' is.
     */
    const result = await userDb.find({
      selector: { email: userEmail },
      limit: 1
    }) as unknown as CouchFindResponse;

    const user = result.docs[0];

    // 4. Identity Check
    if (!user || !user.password) {
      console.warn("❌ Auth Denied: User not found in CouchDB");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 5. Cryptographic Verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("📊 Debug: Password Match Result:", isPasswordValid);

    if (!isPasswordValid) {
      console.warn("❌ Auth Denied: Password hash mismatch");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 6. Token & Session Orchestration
    const sessionId = Math.random().toString(36).substring(7);
    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);

    console.log("✅ Identity Verified:", userEmail);

    const response = NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
      refreshToken: refreshToken // Body-passed for cross-platform utility
    }, { status: 200 });

    // 7. Cookie Persistence (Strict Pathing)
    response.cookies.set('accessToken', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', // Crucial: Allows /dashboard to read the cookie
      maxAge: 60 * 60 * 24 // 24 Hours
    });

    return response;

  } catch (error: unknown) {
    const err = error as Error;
    console.error("🚨 CRITICAL_LOGIN_ERROR:", err.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}