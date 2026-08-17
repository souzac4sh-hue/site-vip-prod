import crypto from 'crypto';
import { Request, Response } from 'express';
import { db, generateDisplayName } from './db.js';
import { AccessSession, AccessVerifyResponse, ProductType } from '../../src/types/index.js';

export const COOKIE_NAME = 'pl_access_token';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createAccessSessionForPayment(
  paymentId: string,
  product: ProductType = 'live_access',
  durationHours: number = 24,
  deviceInfo?: string
): { session: AccessSession; rawToken: string } {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000);

  const session: AccessSession = {
    id: `sess_${crypto.randomUUID()}`,
    paymentId,
    product,
    tokenHash,
    displayName: generateDisplayName(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastAccessAt: now.toISOString(),
    revoked: false,
    deviceInfo,
  };

  db.createAccessSession(session);
  db.updatePayment(paymentId, { accessSessionId: session.id, status: 'completed' });

  return { session, rawToken };
}

export function setAccessCookie(res: Response, rawToken: string, maxAgeHours: number = 24) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: maxAgeHours * 3600 * 1000,
    path: '/',
  });
}

export function clearAccessCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function extractTokenFromRequest(req: Request): string | null {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export function verifySession(req: Request): AccessVerifyResponse {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return { authorized: false, reason: 'missing_token' };
  }

  const tokenHash = hashToken(token);
  const session = db.findSessionByTokenHash(tokenHash);

  if (!session) {
    return { authorized: false, reason: 'invalid_token' };
  }

  if (session.revoked) {
    return { authorized: false, reason: 'token_revoked' };
  }

  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  if (now > expiresAt) {
    return { authorized: false, reason: 'token_expired', expiresAt: session.expiresAt };
  }

  // Update last access timestamp
  session.lastAccessAt = now.toISOString();
  const config = db.getConfig();

  if (session.product === 'whatsapp_access') {
    return {
      authorized: true,
      product: 'whatsapp_access',
      displayName: session.displayName,
      expiresAt: session.expiresAt,
      whatsappData: {
        link: config.whatsappLink,
        creatorName: config.creator.name,
      },
    };
  }

  return {
    authorized: true,
    product: 'live_access',
    displayName: session.displayName,
    expiresAt: session.expiresAt,
    streamData: {
      status: config.status,
      provider: config.streamProvider,
      streamUrl: config.streamUrl,
      title: config.title,
      creator: config.creator,
    },
  };
}
