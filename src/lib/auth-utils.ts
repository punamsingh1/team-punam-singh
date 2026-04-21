import jwt from 'jsonwebtoken';

/**
 * Ttteeee API-First Token Generation
 * Generates both tokens required for the device-aware session strategy.
 */
export const generateTokens = (userId: string, sessionId: string) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    console.error("🚨 CRITICAL: JWT Secrets missing in .env");
    throw new Error("Internal Configuration Error");
  }

  // 15 Minutes for access (Security)
  const accessToken = jwt.sign({ userId, sessionId }, accessSecret, { expiresIn: '15m' });
  
  // 7 Days for refresh (Persistence)
  const refreshToken = jwt.sign({ userId, sessionId }, refreshSecret, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

/**
 * Cryptographic Verification
 * Decoupled from top-level variables to prevent circular alias errors.
 */
export const verifyJWT = (token: string, secretType: 'access' | 'refresh') => {
  try {
    const secret = secretType === 'access' 
      ? process.env.JWT_ACCESS_SECRET 
      : process.env.JWT_REFRESH_SECRET;

    if (!secret) {
      console.error("🚨 Auth Error: Secret not found in environment");
      return null;
    }

    return jwt.verify(token, secret) as { userId: string, sessionId: string };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("📊 Handshake Failed:", err.message);
    }
    return null;
  }
};