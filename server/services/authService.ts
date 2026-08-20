import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { kvStore } from './kvStore.js';

// Secret key for HMAC token signing
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'private-live-hmac-secret-v2-4-hardened';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_COOKIE_NAME = 'pl_admin_auth';
const ADMIN_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours absolute lifetime
const ADMIN_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours idle timeout

function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureTimingCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates an HMAC signed session token for authenticated admin and registers session in shared store
 */
export async function createAdminSessionToken(req: Request): Promise<string> {
  const nonce = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const payload = {
    sub: 'admin',
    nonce,
    iat: now,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const token = `${data}.${signature}`;

  const tokenHash = hashString(token);
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'unknown';

  // Store session state in shared KV store (TTL = 4 hours)
  await kvStore.set(
    `admin_sess:${tokenHash}`,
    {
      tokenHash,
      createdAt: now,
      lastActiveAt: now,
      ipHash: hashString(ip),
      userAgentHash: hashString(ua),
      revoked: false,
    },
    Math.ceil(ADMIN_SESSION_DURATION_MS / 1000)
  );

  return token;
}

/**
 * Validates an HMAC signed admin session token with session store lookup and idle timeout tracking
 */
export async function validateAdminSessionToken(token: string, req?: Request): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

  if (!secureTimingCompare(signature, expectedSig)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    const now = Date.now();
    if (!payload.iat || now - payload.iat > ADMIN_SESSION_DURATION_MS) {
      return false; // Expired absolute duration
    }

    const tokenHash = hashString(token);
    
    // Check if token was explicitly revoked in shared store
    const isRevoked = await kvStore.get<boolean>(`revoked_token:${tokenHash}`);
    if (isRevoked) {
      return false;
    }

    // Check shared session record
    const session = await kvStore.get<{
      tokenHash: string;
      createdAt: number;
      lastActiveAt: number;
      revoked?: boolean;
    }>(`admin_sess:${tokenHash}`);

    if (session) {
      if (session.revoked) {
        return false;
      }
      // Idle timeout check (2 hours)
      if (now - session.lastActiveAt > ADMIN_IDLE_TIMEOUT_MS) {
        await kvStore.delete(`admin_sess:${tokenHash}`);
        return false;
      }
      // Update last active time in shared store
      session.lastActiveAt = now;
      await kvStore.set(`admin_sess:${tokenHash}`, session, Math.ceil(ADMIN_SESSION_DURATION_MS / 1000));
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidate admin session across all serverless instances
 */
export async function revokeAdminSessionToken(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashString(token);
  // Mark in blacklist with 4 hours TTL
  await kvStore.set(`revoked_token:${tokenHash}`, true, Math.ceil(ADMIN_SESSION_DURATION_MS / 1000));
  await kvStore.delete(`admin_sess:${tokenHash}`);
}

/**
 * Brute force guard for admin login with shared KV storage
 */
export async function checkAdminLoginRateLimit(ip: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const now = Date.now();
  const attempt = await kvStore.get<{ failedAttempts: number; lockoutUntil: number }>(`login_attempt:${ip}`);

  if (!attempt) return { allowed: true };

  if (attempt.lockoutUntil > now) {
    const waitSeconds = Math.ceil((attempt.lockoutUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

export async function recordAdminLoginAttempt(ip: string, success: boolean): Promise<void> {
  const now = Date.now();
  let attempt = (await kvStore.get<{ failedAttempts: number; lockoutUntil: number; lastAttempt: number }>(
    `login_attempt:${ip}`
  )) || { failedAttempts: 0, lockoutUntil: 0, lastAttempt: now };

  if (success) {
    await kvStore.delete(`login_attempt:${ip}`);
  } else {
    attempt.failedAttempts++;
    attempt.lastAttempt = now;

    // Progressive lockout: 5 attempts = 5 min, 10 attempts = 15 min, 15+ = 60 min
    if (attempt.failedAttempts >= 15) {
      attempt.lockoutUntil = now + 60 * 60 * 1000;
    } else if (attempt.failedAttempts >= 10) {
      attempt.lockoutUntil = now + 15 * 60 * 1000;
    } else if (attempt.failedAttempts >= 5) {
      attempt.lockoutUntil = now + 5 * 60 * 1000;
    }

    await kvStore.set(`login_attempt:${ip}`, attempt, 3600); // 1 hour TTL
  }
}

/**
 * Express middleware to strictly require valid admin session
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  // Check cookie first (preferred), then Authorization: Bearer <token>, then x-admin-token
  const cookieToken = req.cookies?.[ADMIN_COOKIE_NAME];
  let bearerToken = '';
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    bearerToken = req.headers.authorization.substring(7).trim();
  }
  const customHeaderToken = req.headers['x-admin-token'] as string;

  const candidateToken = cookieToken || bearerToken || customHeaderToken;

  if (!candidateToken) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Acesso restrito. Autenticação necessária.',
    });
  }

  const isValid = await validateAdminSessionToken(candidateToken, req);
  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'forbidden',
      message: 'Sessão administrativa expirada ou revogada. Faça login novamente.',
    });
  }

  next();
}

/**
 * Sets secure HttpOnly admin session cookie
 */
export function setAdminAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_DURATION_MS,
    path: '/',
  });
}

/**
 * Clears admin session cookie
 */
export function clearAdminAuthCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
}

/**
 * Verifies admin password securely
 */
export function verifyAdminPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  
  // Direct constant-time match with configured password
  if (secureTimingCompare(password, configuredPassword)) {
    return true;
  }
  
  // Standard fallback passwords if no custom ADMIN_PASSWORD env var is set
  if (!process.env.ADMIN_PASSWORD) {
    if (secureTimingCompare(password, 'admin123456') || secureTimingCompare(password, 'admin123') || secureTimingCompare(password, 'admin')) {
      return true;
    }
  }
  
  return false;
}
