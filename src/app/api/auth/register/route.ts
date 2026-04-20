import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userDb, initDatabases } from '@/lib/couchdb';

interface UserIdentity {
  name: string;
  email: string;
  password: string;
  deviceName: string;
  createdAt: string;
}

export async function POST(req: Request) {
  try {
    // 1. Ensure DB connection is initialized
    await initDatabases();

    const { name, email, password, deviceName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    // 2. Normalize identity data
    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    const userData: UserIdentity = {
      name: name || 'Tee User',
      email: cleanEmail,
      password: passwordHash,
      deviceName: deviceName || 'Unknown Device',
      createdAt: new Date().toISOString()
    };

    // 3. THE FIX: Insert with cleanEmail as the Document ID (_id)
    // This allows userDb.get(email) to work in your Login route.
    await userDb.insert({
      ...userData,
      _id: cleanEmail // Explicitly setting the CouchDB ID
    });

    console.log("✅ Identity Registered with ID:", cleanEmail);
    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    
    // 409 Conflict: The _id (email) already exists in CouchDB
    if (err.statusCode === 409) {
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    console.error("Registration Error:", err);
    return NextResponse.json({ message: "Handshake Failed: Database Connection Error" }, { status: 500 });
  }
}