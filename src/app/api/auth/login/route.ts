import { NextResponse } from 'next/server';
import { headers } from "next/headers"; // CHANGED: Added headers
import bcrypt from 'bcryptjs';
import { userDb, sessionDb } from '@/lib/couchdb'; // CHANGED: Added sessionDb
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

    const result = await userDb.find({
      selector: { email: userEmail },
      limit: 1
    }) as unknown as CouchFindResponse;

    const user = result.docs[0];

    if (!user || !user.password) {
      console.warn("❌ Auth Denied: User not found in CouchDB");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 3. Cryptographic Verification
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn("❌ Auth Denied: Password hash mismatch");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // --- CHANGED: START NEW SESSION LOGIC ---
    // 1. Extract the User-Agent
   const headersList = await headers(); // <--- Make sure this is awaited
const userAgent = headersList.get("user-agent") || "Unknown Device";
    
    // 2. Generate Session ID
   const sessionId = Math.random().toString(36).substring(7);

    // 3. Create the session document
    const newSession = {
      _id: `session:${sessionId}`, // Naming convention helps lookups
      userId: user._id,
      userAgent: userAgent,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days
    };

    // 4. Save to CouchDB
    await sessionDb.insert(newSession);
    // --- CHANGED: END NEW SESSION LOGIC ---

    // 5. Token & Session Orchestration
    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);

    console.log("✅ Identity Verified & Session Created:", userEmail);

    const response = NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
      refreshToken: refreshToken 
    }, { status: 200 });

    // 6. Cookie Persistence 
    response.cookies.set('accessToken', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', 
      maxAge: 60 * 60 * 24 
    });

    return response;

  } catch (error: unknown) {
    const err = error as Error;
    console.error("🚨 CRITICAL_LOGIN_ERROR:", err.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}