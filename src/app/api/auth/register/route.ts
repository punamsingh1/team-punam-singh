import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Native Node.js module for secure tokens
import { userDb, initDatabases } from '@/lib/couchdb';
import { sendVerificationEmail } from '@/lib/mail-utils';

export const runtime = 'nodejs'; // Ensure Node runtime for Nodemailer/Bcrypt

interface UserIdentity {
  _id: string;
  name: string;
  email: string;
  password: string;
  deviceName: string;
  emailVerified: boolean;
  verificationToken: string;
  createdAt: string;
}

export async function POST(req: Request) {
  try {
    await initDatabases();

    const { name, email, password, deviceName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 1. Generate a secure random token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const userData: UserIdentity = {
      _id: cleanEmail,
      name: name || 'Tee User',
      email: cleanEmail,
      password: passwordHash,
      deviceName: deviceName || 'Unknown Device',
      emailVerified: false, // User is not verified yet
      verificationToken: verificationToken,
      createdAt: new Date().toISOString()
    };

    // 2. Save user to CouchDB
    await userDb.insert(userData);

    // 3. Trigger Email Verification via MailDev
    const emailSent = await sendVerificationEmail(cleanEmail, verificationToken);

    if (!emailSent) {
      console.error("⚠️ User saved but Verification Email failed to send.");
      // We don't block registration, but we notify the console
    }

    console.log("✅ Identity Registered & Verification Sent:", cleanEmail);

    return NextResponse.json({ 
      success: true, 
      message: "Registration successful. Please check MailDev for verification." 
    }, { status: 201 });

  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    
    if (err.statusCode === 409) {
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    console.error("Registration Error:", err);
    return NextResponse.json({ message: "Handshake Failed: Database Connection Error" }, { status: 500 });
  }
}