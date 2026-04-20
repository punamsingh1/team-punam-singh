import jwt from 'jsonwebtoken';

// Use '!' to tell TypeScript these will definitely exist in .env
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

/**
 * Ttteeee API-First Token Generation
 * Generates both tokens required for the device-aware session strategy.
 */
export const generateTokens = (userId: string, sessionId: string) => {
  // 15 Minutes for access (Security)
  const accessToken = jwt.sign({ userId, sessionId }, ACCESS_SECRET, { expiresIn: '15m' });
  
  // 7 Days for refresh (Persistence)
  const refreshToken = jwt.sign({ userId, sessionId }, REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

/**
 * Cryptographic Verification
 */
export const verifyJWT = (token: string, secretType: 'access' | 'refresh') => {
  try {
    const secret = secretType === 'access' ? ACCESS_SECRET : REFRESH_SECRET;
    return jwt.verify(token, secret) as { userId: string, sessionId: string };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("JWT Verification failed:", err.message);
    }
    return null;
  }
};