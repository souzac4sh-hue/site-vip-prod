import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../services/db.js';
import { nexusPagService } from '../services/nexusPagService.js';
import {
  createAccessSessionForPayment,
  setAccessCookie,
  clearAccessCookie,
  verifySession,
} from '../services/accessService.js';
import { protectCheckoutEndpoint, verifyTurnstileToken } from '../middleware/antiBot.js';
import {
  requireAdminAuth,
  verifyAdminPassword,
  createAdminSessionToken,
  setAdminAuthCookie,
  clearAdminAuthCookie,
  checkAdminLoginRateLimit,
  recordAdminLoginAttempt,
  revokeAdminSessionToken,
} from '../services/authService.js';
import {
  createRateLimiter,
  csrfProtection,
  validateTrackEvent,
  sanitizeConfigUpdates,
  sanitizeText,
  isValidEmail,
} from '../middleware/securityValidators.js';
import { ProductType } from '../../src/types/index.js';

export const apiRouter = Router();

// Apply CSRF Protection to all state-changing endpoints
apiRouter.use(csrfProtection);

// Distributed rate limiters
const trackRateLimiter = createRateLimiter({
  bucketName: 'track_events',
  windowMs: 60 * 1000,
  maxRequests: 60, // max 60 events/min per IP
});

const loginRateLimiter = createRateLimiter({
  bucketName: 'admin_login_ip',
  windowMs: 15 * 60 * 1000,
  maxRequests: 20, // max 20 login attempts per 15 min per IP
  message: 'Limite de tentativas excedido para este IP. Tente mais tarde.',
});

const pixPollRateLimiter = createRateLimiter({
  bucketName: 'pix_poll',
  windowMs: 60 * 1000,
  maxRequests: 90, // max 90 status polls per minute
});

function getDeviceType(uaString: string = ''): 'mobile' | 'desktop' | 'tablet' {
  const ua = uaString.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// -------------------------------------------------------------
// Public Endpoints
// -------------------------------------------------------------

apiRouter.get('/config', (req: Request, res: Response) => {
  const fullConfig = db.getConfig();
  const publicConfig = {
    status: fullConfig.status,
    title: fullConfig.title,
    description: fullConfig.description,
    scheduledAt: fullConfig.scheduledAt,
    price: fullConfig.price,
    whatsappPrice: fullConfig.whatsappPrice,
    currency: fullConfig.currency,
    accessDurationHours: fullConfig.accessDurationHours,
    requireAgeConfirmation: fullConfig.requireAgeConfirmation,
    demoMode: fullConfig.demoMode,
    chatEnabled: fullConfig.chatEnabled,
    autoWelcomeEnabled: fullConfig.autoWelcomeEnabled,
    onlineViewersCount: fullConfig.onlineViewersCount || 1480,
    whatsappLink: fullConfig.whatsappLink,
    previewsGroupLink: fullConfig.previewsGroupLink,
    creator: fullConfig.creator,
    content: fullConfig.content,
    welcomePresets: fullConfig.welcomePresets,
    announcementConfig: fullConfig.announcementConfig,
  };
  res.json(publicConfig);
});

apiRouter.get('/announcements', (req: Request, res: Response) => {
  const config = db.getConfig();
  res.json({
    success: true,
    config: config.announcementConfig || { enabled: true, intervalSeconds: 6, durationSeconds: 5, loop: true },
    announcements: db.getAnnouncements(),
  });
});

apiRouter.post('/track/event', trackRateLimiter, (req: Request, res: Response) => {
  try {
    const { isValid, sanitized } = validateTrackEvent(req.body);
    if (!isValid || !sanitized) {
      return res.status(400).json({ success: false, error: 'invalid_event' });
    }

    const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
    const sessionId = req.cookies?.pl_visitor_token || 'anon';
    const ua = req.headers['user-agent'] || '';

    db.logEvent({
      eventType: sanitized.eventType as any,
      product: sanitized.product,
      sessionId,
      ipHash,
      referer: sanitized.referer || 'direto',
      deviceType: getDeviceType(ua),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false });
  }
});

apiRouter.post('/pix/create', protectCheckoutEndpoint, async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, externalId, product } = req.body;
    const config = db.getConfig();
    const prod: ProductType = product === 'whatsapp_access' ? 'whatsapp_access' : 'live_access';
    
    // Server is the sole authority on price
    const amount = prod === 'whatsapp_access' ? config.whatsappPrice || 9.90 : config.price || 9.90;

    const safeName = customerName ? sanitizeText(customerName, 80) : undefined;
    const safeEmail = customerEmail && isValidEmail(customerEmail) ? sanitizeText(customerEmail, 120) : undefined;
    const safeExternalId = externalId ? sanitizeText(externalId, 64) : undefined;

    const payment = await nexusPagService.createPixCharge({
      amount,
      product: prod,
      description: `Acesso VIP 30 Dias + WhatsApp - ${config.creator.name}`,
      externalId: safeExternalId,
      customerName: safeName,
      customerEmail: safeEmail,
      expirationSeconds: 1800,
    });

    const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
    db.logEvent({
      eventType: 'checkout_start',
      product: prod,
      sessionId: req.cookies?.pl_visitor_token || 'anon',
      ipHash: crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16),
      deviceType: getDeviceType(req.headers['user-agent']),
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        product: payment.product,
        externalId: payment.externalId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        pixCopiaCola: payment.pixCopiaCola,
        qrCodeBase64: payment.qrCodeBase64,
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Erro ao gerar cobrança PIX' });
  }
});

apiRouter.get('/pix/status/:id', pixPollRateLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.length > 80) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const payment = await nexusPagService.checkPaymentStatus(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Cobrança não encontrada' });
    }

    let isAuthorized = false;

    if (payment.status === 'paid' || payment.status === 'completed') {
      const config = db.getConfig();
      let rawToken = '';
      if (!payment.accessSessionId) {
        const { session, rawToken: token } = createAccessSessionForPayment(
          payment.id,
          payment.product || 'live_access',
          config.accessDurationHours || 720,
          req.headers['user-agent']
        );
        rawToken = token;

        const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
        db.logEvent({
          eventType: 'payment_success',
          product: payment.product || 'live_access',
          sessionId: req.cookies?.pl_visitor_token || 'anon',
          ipHash: crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16),
          deviceType: getDeviceType(req.headers['user-agent']),
        });
      }
      if (rawToken) {
        setAccessCookie(res, rawToken, config.accessDurationHours || 720);
      }
      isAuthorized = true;
    }

    res.json({
      success: true,
      product: payment.product || 'live_access',
      status: payment.status,
      paidAt: payment.paidAt,
      isAuthorized,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao verificar status' });
  }
});

apiRouter.post('/pix/simulate-pay', (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({ success: false, message: 'ID do pagamento é obrigatório' });
    }

    const updated = nexusPagService.simulatePaymentApproval(paymentId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    }

    const config = db.getConfig();
    const { rawToken } = createAccessSessionForPayment(
      updated.id,
      updated.product || 'live_access',
      config.accessDurationHours || 720,
      req.headers['user-agent']
    );
    setAccessCookie(res, rawToken, config.accessDurationHours || 720);

    const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
    db.logEvent({
      eventType: 'payment_success',
      product: updated.product || 'live_access',
      sessionId: req.cookies?.pl_visitor_token || 'anon',
      ipHash: crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16),
      deviceType: getDeviceType(req.headers['user-agent']),
    });

    res.json({
      success: true,
      message: 'Pagamento aprovado com sucesso',
      product: updated.product || 'live_access',
      status: 'completed',
      token: rawToken,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Falha ao processar simulação' });
  }
});

// Webhook NexusPag with HMAC Signature & Value Validation
apiRouter.post('/webhooks/nexuspag', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-nexuspag-signature'] || req.headers['x-signature'] || req.headers['signature']) as string;
    const rawBody = JSON.stringify(req.body);

    // 1. Verify HMAC Signature
    const isValidSignature = nexusPagService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn('[Webhook NexusPag] Signature verification failed');
      return res.status(401).json({ error: 'Assinatura do webhook inválida' });
    }

    const payload = req.body;
    const tx = payload?.transaction || payload;
    const transactionId = tx?.id || tx?.txid || tx?.external_id || payload?.id || payload?.external_id;
    const status = (tx?.status || payload?.status || payload?.event || '').toLowerCase();

    if (!transactionId) {
      return res.status(400).json({ error: 'Missing transaction identifier' });
    }

    let payment = db.findPaymentById(transactionId);

    if (status === 'paid' || status === 'approved' || status === 'completed' || status === 'pix.paid') {
      if (payment) {
        db.updatePayment(payment.id, {
          status: 'completed',
          paidAt: new Date().toISOString(),
        });
      } else {
        payment = db.createPayment({
          id: String(transactionId),
          gateway: 'nexuspag',
          product: 'live_access',
          externalId: String(transactionId),
          amount: typeof tx?.amount === 'number' ? tx.amount : 9.90,
          currency: 'BRL',
          status: 'completed',
          pixCopiaCola: '',
          qrCodeBase64: '',
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
      }

      const config = db.getConfig();
      createAccessSessionForPayment(
        payment.id,
        payment.product || 'live_access',
        config.accessDurationHours || 720,
        'Webhook'
      );
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// -------------------------------------------------------------
// Access Verification (Secured)
// -------------------------------------------------------------

apiRouter.get('/access/verify', (req: Request, res: Response) => {
  const result = verifySession(req);
  if (!result.authorized) {
    return res.status(401).json(result);
  }

  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
  db.logEvent({
    eventType: 'live_enter',
    product: result.product || 'live_access',
    sessionId: req.cookies?.pl_visitor_token || 'anon',
    ipHash: crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16),
    deviceType: getDeviceType(req.headers['user-agent']),
  });

  res.json(result);
});

apiRouter.post('/access/logout', (req: Request, res: Response) => {
  clearAccessCookie(res);
  res.json({ success: true, message: 'Sessão encerrada' });
});

// -------------------------------------------------------------
// Admin Endpoints
// -------------------------------------------------------------
// Admin Endpoints
// -------------------------------------------------------------

apiRouter.post('/admin/login', loginRateLimiter, async (req: Request, res: Response) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || '127.0.0.1';
  
  // 1. Check distributed brute force lockout
  const { allowed, waitSeconds } = await checkAdminLoginRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({
      success: false,
      message: `Muitas tentativas incorretas. Tente novamente em ${waitSeconds} segundos.`,
    });
  }

  const { password, turnstileToken } = req.body;

  // 2. Anti-bot Turnstile verification (only when Turnstile key is configured)
  const isTurnstileConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY && !process.env.TURNSTILE_SECRET_KEY.startsWith('1x000000000000'));
  if (isTurnstileConfigured && turnstileToken) {
    const validTurnstile = await verifyTurnstileToken(turnstileToken, ip);
    if (!validTurnstile.success) {
      return res.status(403).json({ success: false, message: 'Verificação anti-bot falhou. Tente novamente.' });
    }
  }

  // 3. Constant-time password verification (Fails closed in production if unset)
  const isPasswordValid = verifyAdminPassword(password);

  if (!isPasswordValid) {
    await recordAdminLoginAttempt(ip, false);
    return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }

  // 4. Successful login -> Create HMAC session token and set secure HttpOnly cookie
  await recordAdminLoginAttempt(ip, true);
  const sessionToken = await createAdminSessionToken(req);
  setAdminAuthCookie(res, sessionToken);

  return res.json({
    success: true,
    token: sessionToken,
    expiresIn: '4h',
  });
});

apiRouter.post('/admin/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.pl_admin_auth || (req.headers['x-admin-token'] as string);
  if (token) {
    await revokeAdminSessionToken(token);
  }
  clearAdminAuthCookie(res);
  res.json({ success: true, message: 'Logout efetuado com sucesso' });
});

apiRouter.get('/admin/me', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, user: 'admin', role: 'administrator' });
});

apiRouter.get('/admin/stats', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, stats: db.getStats() });
});

apiRouter.get('/admin/metrics', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, metrics: db.getFunnelMetrics() });
});

apiRouter.get('/admin/config', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, config: db.getConfig() });
});

apiRouter.post('/admin/config', requireAdminAuth, (req: Request, res: Response) => {
  const sanitizedUpdates = sanitizeConfigUpdates(req.body);
  const updated = db.updateConfig(sanitizedUpdates);
  res.json({ success: true, config: updated });
});

apiRouter.get('/admin/payments', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, payments: db.getPayments() });
});

apiRouter.get('/admin/sessions', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, sessions: db.getAccessSessions() });
});

apiRouter.post('/admin/sessions/:id/revoke', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const revoked = db.revokeAccessSession(id);
  res.json({ success: revoked });
});

apiRouter.get('/admin/announcements', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ success: true, announcements: db.getAllAnnouncementsAdmin() });
});

apiRouter.post('/admin/announcements', requireAdminAuth, (req: Request, res: Response) => {
  const { authorName, role, message, avatarUrl, isActive } = req.body;
  if (!authorName || !message) return res.status(400).json({ error: 'Autor e mensagem são obrigatórios' });

  const ann = db.addAnnouncement({
    authorName: sanitizeText(authorName, 60),
    role: sanitizeText(role || 'STAFF', 30),
    message: sanitizeText(message, 300),
    avatarUrl: avatarUrl ? sanitizeText(avatarUrl, 300) : undefined,
    isActive: isActive ?? true,
  });

  res.json({ success: true, announcement: ann });
});

apiRouter.put('/admin/announcements/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateAnnouncement(id, req.body);
  res.json({ success: Boolean(updated), announcement: updated });
});

apiRouter.delete('/admin/announcements/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  db.deleteAnnouncement(id);
  res.json({ success: true });
});

apiRouter.post('/admin/announcements/config', requireAdminAuth, (req: Request, res: Response) => {
  const { enabled, isPaused, intervalSeconds, durationSeconds, loop } = req.body;
  const config = db.updateConfig({
    announcementConfig: {
      enabled: enabled ?? true,
      isPaused: isPaused ?? false,
      intervalSeconds: intervalSeconds ?? 6,
      durationSeconds: durationSeconds ?? 5,
      loop: loop ?? true,
    },
  });
  res.json({ success: true, config: config.announcementConfig });
});
