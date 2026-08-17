import { Request, Response, NextFunction } from 'express';
import { kvStore } from '../services/kvStore.js';

export function createRateLimiter(opts: {
  bucketName: string;
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const windowSecs = Math.ceil(opts.windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
    const key = `ratelimit:${opts.bucketName}:${ip}`;

    try {
      const currentCount = await kvStore.increment(key, windowSecs);
      if (currentCount > opts.maxRequests) {
        res.setHeader('Retry-After', windowSecs);
        return res.status(429).json({
          success: false,
          error: 'too_many_requests',
          message: opts.message || 'Muitas requisições. Por favor, aguarde alguns instantes.',
        });
      }
    } catch {
      // Graceful fallback if store error
    }

    next();
  };
}

/**
 * CSRF Protection Middleware for State-Changing Requests (POST, PUT, PATCH, DELETE)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public webhooks with HMAC signatures
  if (req.path.startsWith('/webhooks/')) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      // Ensure origin matches current host or allowed development / production origins
      const allowedHosts = [
        host,
        'localhost:3001',
        'localhost:5173',
        process.env.PUBLIC_SITE_URL ? new URL(process.env.PUBLIC_SITE_URL).host : null,
      ].filter(Boolean);

      if (!allowedHosts.some((h) => h && (originUrl.host === h || originUrl.host.includes(h)))) {
        return res.status(403).json({
          success: false,
          error: 'csrf_rejected',
          message: 'Origem da requisição não autorizada.',
        });
      }
    } catch {
      return res.status(403).json({
        success: false,
        error: 'csrf_rejected',
        message: 'Origem da requisição inválida.',
      });
    }
  }

  next();
}

/**
 * Sanitizes URLs to prevent open redirects and javascript: / data: execution
 */
export function sanitizeSafeUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Allow relative paths starting with / (e.g. /creator/avatar.jpg)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Allow only http and https protocols
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {}

  return '';
}

/**
 * Sanitizes generic user text (strips dangerous control chars, bounds length)
 */
export function sanitizeText(text: any, maxLength = 500): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

/**
 * Validates email format strictly
 */
export function isValidEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 120;
}

/**
 * Validates and limits tracking events payload
 */
const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'cta_click',
  'checkout_start',
  'payment_success',
  'live_enter',
  'whatsapp_open',
  'whatsapp_redirect',
  'previews_group_click',
]);

const ALLOWED_PRODUCTS = new Set(['live_access', 'whatsapp_access']);

export function validateTrackEvent(body: any): {
  isValid: boolean;
  sanitized?: { eventType: string; product?: 'live_access' | 'whatsapp_access'; referer: string };
} {
  if (!body || typeof body !== 'object') return { isValid: false };
  const { eventType, product, referer } = body;

  if (!eventType || typeof eventType !== 'string' || !ALLOWED_EVENT_TYPES.has(eventType)) {
    return { isValid: false };
  }

  const sanitizedProduct = product && ALLOWED_PRODUCTS.has(product) ? (product as 'live_access' | 'whatsapp_access') : undefined;
  const sanitizedReferer = sanitizeText(referer || '', 200);

  return {
    isValid: true,
    sanitized: {
      eventType,
      product: sanitizedProduct,
      referer: sanitizedReferer,
    },
  };
}

/**
 * Whitelist sanitizer for LiveConfig updates from Admin
 */
export function sanitizeConfigUpdates(updates: any): any {
  if (!updates || typeof updates !== 'object') return {};

  const clean: any = {};

  if (typeof updates.status === 'string' && ['offline', 'scheduled', 'live', 'ended'].includes(updates.status)) {
    clean.status = updates.status;
  }
  if (typeof updates.title === 'string') clean.title = sanitizeText(updates.title, 200);
  if (typeof updates.description === 'string') clean.description = sanitizeText(updates.description, 1000);
  if (typeof updates.scheduledAt === 'string') clean.scheduledAt = sanitizeText(updates.scheduledAt, 60);
  if (typeof updates.streamProvider === 'string') clean.streamProvider = sanitizeText(updates.streamProvider, 50);
  if (typeof updates.streamUrl === 'string') clean.streamUrl = sanitizeSafeUrl(updates.streamUrl);

  if (typeof updates.price === 'number' && updates.price >= 0 && updates.price <= 9999) {
    clean.price = Number(updates.price.toFixed(2));
  }
  if (typeof updates.whatsappPrice === 'number' && updates.whatsappPrice >= 0 && updates.whatsappPrice <= 9999) {
    clean.whatsappPrice = Number(updates.whatsappPrice.toFixed(2));
  }
  if (typeof updates.onlineViewersCount === 'number' && updates.onlineViewersCount >= 0) {
    clean.onlineViewersCount = Math.floor(updates.onlineViewersCount);
  }
  if (typeof updates.whatsappLink === 'string') clean.whatsappLink = sanitizeSafeUrl(updates.whatsappLink);
  if (typeof updates.previewsGroupLink === 'string') clean.previewsGroupLink = sanitizeSafeUrl(updates.previewsGroupLink);

  if (typeof updates.chatEnabled === 'boolean') clean.chatEnabled = updates.chatEnabled;
  if (typeof updates.autoWelcomeEnabled === 'boolean') clean.autoWelcomeEnabled = updates.autoWelcomeEnabled;
  if (typeof updates.requireAgeConfirmation === 'boolean') clean.requireAgeConfirmation = updates.requireAgeConfirmation;
  if (typeof updates.demoMode === 'boolean') clean.demoMode = updates.demoMode;

  if (updates.creator && typeof updates.creator === 'object') {
    clean.creator = {
      name: sanitizeText(updates.creator.name || '', 100),
      username: sanitizeText(updates.creator.username || '', 100),
      bio: sanitizeText(updates.creator.bio || '', 500),
      avatarUrl: sanitizeSafeUrl(updates.creator.avatarUrl) || '/creator/avatar.jpg',
      coverUrl: sanitizeSafeUrl(updates.creator.coverUrl) || '/creator/cover.jpg',
      whatsappAvatarUrl: sanitizeSafeUrl(updates.creator.whatsappAvatarUrl) || '',
      badgeText: sanitizeText(updates.creator.badgeText || '', 50),
      whatsappNumber: sanitizeText(updates.creator.whatsappNumber || '', 40),
    };
  }

  if (updates.content && typeof updates.content === 'object') {
    clean.content = {
      heroHeadline: sanitizeText(updates.content.heroHeadline || '', 200),
      heroSubheadline: sanitizeText(updates.content.heroSubheadline || '', 500),
      longDescription: sanitizeText(updates.content.longDescription || '', 5000),
      ctaButtonText: sanitizeText(updates.content.ctaButtonText || '', 100),
      ctaMicrocopy: sanitizeText(updates.content.ctaMicrocopy || '', 200),
      cardOfferTitle: sanitizeText(updates.content.cardOfferTitle || '', 150),
      cardOfferSubtitle: sanitizeText(updates.content.cardOfferSubtitle || '', 300),
      guaranteeTitle: sanitizeText(updates.content.guaranteeTitle || '', 150),
      guaranteeText: sanitizeText(updates.content.guaranteeText || '', 500),
      benefits: Array.isArray(updates.content.benefits)
        ? updates.content.benefits.slice(0, 12).map((b: any) => ({
            icon: sanitizeText(b.icon || 'Sparkles', 30),
            title: sanitizeText(b.title || '', 100),
            description: sanitizeText(b.description || '', 250),
          }))
        : [],
      faqs: Array.isArray(updates.content.faqs)
        ? updates.content.faqs.slice(0, 20).map((f: any) => ({
            question: sanitizeText(f.question || '', 200),
            answer: sanitizeText(f.answer || '', 1000),
          }))
        : [],
    };
  }

  return clean;
}
