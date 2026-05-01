// src/lib/mail-utils.ts
import nodemailer from 'nodemailer';
import { env } from "@/config/env";


function createTransporter() {
  return nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    ignoreTLS: true,
  });
}

// ─── FIX 2: NEXT_PUBLIC_APP_URL guard (client requirement) ───────────────────

function getAppUrl(): string {
  if (!env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not defined. " +
      "Add it to your .env file: NEXT_PUBLIC_APP_URL=http://localhost:3000"
    );
  }
  return env.NEXT_PUBLIC_APP_URL;
}

/**
 * Sends a verification email via MailDev (dev) or SMTP (production).

 */
export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {

  // ─── FIX 3: Validate APP URL before doing any work 

  
  let appUrl: string;
  try {
    appUrl = getAppUrl();
  } catch (urlError) {
    const err = urlError as Error;
    console.error("❌ CRITICAL CONFIG ERROR:", err.message);
    return false;
  }

  const verificationLink = `${appUrl}/verify-email?token=${token}`;
  // ─── FIX 4: Create transporter per-call (not module-level singleton) ────────
 
 
  const transporter = createTransporter();

  // ─── FIX 5: Verify SMTP connection BEFORE attempting to send ─────────────────
 
 
  try {
    await transporter.verify();
  } catch (verifyError) {
    const err = verifyError as Error;
    console.error(
      `❌ Mail server not reachable at ${env.MAIL_HOST}:${env.MAIL_PORT}\n` +
      `   Error    : ${err.message}\n` +
      `   Fix      : Start MailDev with → npx maildev\n` +
      `   Dev inbox : http://localhost:1080`
    );
    return false;
  }

  // ─── FIX 6: Send email — only reached if verify() passed ─────────────────────
  try {
    await transporter.sendMail({
  from: '"Ttteeee Identity" <no-reply@test.com>',
  to: email,
  subject: 'Verify your identity',
  // 1. Add a plain-text fallback for email clients that can't render HTML
  text: `Please verify your account by clicking this link: ${verificationLink}`,
  
  // 2. Explicitly provide the HTML version
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e293b;">Identity Verification</h2>
      <p style="color: #475569;">
        Click the button below to verify your account. 
        This link expires in <strong>24 hours</strong>.
      </p>
      
      <a href="${verificationLink}" 
         style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;"
      >
        Verify My Email
      </a>
    </div>
  `,
});

    console.log(`✅ Verification email sent to: ${email}`);
    return true;

  } catch (sendError) {
    // ─── FIX 7: Separate send errors from connection errors ──────────────────
    
    const err = sendError as Error;
    console.error(
      `📧 Email send failed to: ${email}\n` +
      `   Error: ${err.message}`
    );
    return false;
  }
};