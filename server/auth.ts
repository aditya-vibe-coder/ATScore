/**
 * ATScore India - Authentication Module
 * JWT token management, password hashing, auth middleware
 */
import { Request, Response, NextFunction } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    plan: string;
  };
}

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'your-jwt-access-secret'
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret'
);

/**
 * Create a signed JWT access token.
 */
export async function createAccessToken(payload: { sub: string; email: string; plan: string }): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(ACCESS_SECRET);
}

/**
 * Create a signed JWT refresh token (longer expiry).
 */
export async function createRefreshToken(payload: { sub: string }): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(REFRESH_SECRET);
}

/**
 * Verify and decode a JWT access token.
 */
export async function verifyAccessToken(token: string): Promise<{ sub: string; email: string; plan: string } | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as any;
  } catch {
    return null;
  }
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a password against a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Express middleware that validates JWT Bearer token from Authorization header.
 * Attaches decoded user to req.user on success.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing. Please log in.' });
  }

  const token = authHeader.substring(7);
  const decoded = await verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = {
    id: decoded.sub,
    email: decoded.email,
    plan: decoded.plan,
  };

  next();
}
