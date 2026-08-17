import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { kvStore } from '../services/kvStore.js';

const VISITOR_COOKIE = 'pl_visitor_token';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

export async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<{ success: boolean; reason?: string }> {
  // If in development mode and key is not set or using Cloudflare test key
  const isProd = process.env.NODE_ENV === 'production';
  const isTestKey = !TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_KEY.startsWith('1x000000000000');

  if (!isProd && isTestKey) {
    if (!token || token.startsWith('XXXX.') || token === 'turnstile_test_token_ok' || token === 'bypass_test') {
      return { success: true };
    }
  }

  // In production, token is strictly required
  if (!token || typeof token !== 'string') {
    return { success: false, reason: 'missing_token' };
  }

  // Prevent token replay attacks using shared KV store
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const alreadyUsed = await kvStore.get<boolean>(`turnstile_used:${tokenHash}`);
  if (alreadyUsed) {
    return { success: false, reason: 'token_replayed' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA');
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

    if (data && data.success) {
      // Mark token as consumed for 5 minutes (Turnstile tokens are valid for max 300s)
      await kvStore.set(`turnstile_used:${tokenHash}`, true, 300);
      return { success: true };
    }

    return { success: false, reason: 'verification_failed' };
  } catch (err) {
    console.error('[Turnstile Verification Error]:', err);
    if (!isProd) {
      return { success: true }; // Fallback only in development
    }
    return { success: false, reason: 'service_unavailable' };
  }
}

export function antiBotMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies[VISITOR_COOKIE]) {
    const visitorToken = crypto.randomBytes(24).toString('hex');
    res.cookie(VISITOR_COOKIE, visitorToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
    });
  }
  next();
}

export async function protectCheckoutEndpoint(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
  const visitorToken = req.cookies[VISITOR_COOKIE] || 'unknown';

  // 1. Honeypot check
  if (req.body && (req.body._hp_company || req.body._website_url || req.body.username_verify)) {
    console.warn(`[Anti-Bot] Honeypot triggered from IP: ${ip}`);
    return res.status(200).json({ success: true, status: 'pending' });
  }

  // 2. User-Agent Filtering
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const blockedUAs = ['sqlmap', 'nikto', 'masscan', 'zgrab', 'python-requests', 'go-http-client'];
  if (blockedUAs.some((bad) => ua.includes(bad))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // 3. Distributed Rate Limiting via KV Store
  const ipKey = `ratelimit:checkout_ip:${ip}`;
  const ipCount = await kvStore.increment(ipKey, 60);
  if (ipCount > 15) {
    return res.status(429).json({ error: 'Muitas requisições. Aguarde um momento.' });
  }

  const sessionKey = `ratelimit:checkout_sess:${visitorToken}`;
  const sessCount = await kvStore.increment(sessionKey, 300);
  if (sessCount > 10) {
    return res.status(429).json({ error: 'Limite de tentativas atingido. Tente novamente mais tarde.' });
  }

  // 4. Turnstile verification if provided
  const turnstileToken = req.body.turnstileToken || req.headers['x-turnstile-token'];
  if (turnstileToken) {
    const result = await verifyTurnstileToken(turnstileToken.toString(), ip);
    if (!result.success) {
      return res.status(403).json({ error: 'Falha na verificação de segurança (Turnstile).' });
    }
  }

  next();
}
