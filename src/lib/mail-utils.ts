import nodemailer from 'nodemailer';

// 1. You MUST define 'transporter' here first
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'localhost',
  port: Number(process.env.MAIL_PORT) || 1025,
  ignoreTLS: true
});

/**
 * Ttteeee API-First Verification Email
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  
  try {
    // 2. Now the code can find the name 'transporter'
    await transporter.sendMail({
      from: '"Ttteeee Identity" <no-reply@ttteeee.com>',
      to: email,
      subject: 'Verify your identity',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Identity Verification</h2>
          <p>Click the link below to verify your account:</p>
          <a href="${verificationLink}" style="color: #2563eb; font-weight: bold;">
             Verify My Email
          </a>
          <p>Token: ${token}</p>
        </div>
      `
    });
    return true;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("📧 MailDev Error:", err.message);
    return false;
  }
};