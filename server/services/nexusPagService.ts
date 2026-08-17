import crypto from 'crypto';
import { db } from './db.js';
import { PaymentTransaction, ProductType } from '../../src/types/index.js';

const NEXUSPAG_BASE_URL = process.env.NEXUSPAG_BASE_URL || 'https://nexuspag.com';
const NEXUSPAG_API_KEY = process.env.NEXUSPAG_API_KEY || '';
const NEXUSPAG_WEBHOOK_URL = process.env.NEXUSPAG_WEBHOOK_URL || '';
const NEXUSPAG_WEBHOOK_SECRET = process.env.NEXUSPAG_WEBHOOK_SECRET || '';

export interface CreatePixOptions {
  amount?: number;
  product?: ProductType;
  description?: string;
  externalId?: string;
  customerName?: string;
  customerEmail?: string;
  expirationSeconds?: number;
}

export interface NexusPagPixResponse {
  success: boolean;
  transaction: {
    id: string;
    txid: string;
    external_id: string;
    amount: number;
    fee?: number;
    net_amount?: number;
    status: string;
    pix_copia_cola: string;
    qr_code_base64: string;
    expires_at: string;
  };
}

export const nexusPagService = {
  isConfigured(): boolean {
    return Boolean(NEXUSPAG_API_KEY && !NEXUSPAG_API_KEY.includes('demo_test_key') && !NEXUSPAG_API_KEY.includes('sample'));
  },

  async createPixCharge(options: CreatePixOptions): Promise<PaymentTransaction> {
    const config = db.getConfig();
    const product: ProductType = options.product || 'live_access';
    const amount =
      options.amount !== undefined
        ? options.amount
        : product === 'whatsapp_access'
        ? config.whatsappPrice
        : config.price;

    const externalId = options.externalId || `ord_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expirationSeconds = options.expirationSeconds || 1800; // 30 mins

    const description =
      options.description ||
      (product === 'whatsapp_access'
        ? `WhatsApp VIP - ${config.creator.name}`
        : `Acesso Sala Privada - ${config.creator.name}`);

    // Check idempotency
    const existing = db.findPaymentById(externalId);
    if (existing) {
      return existing;
    }

    const isProd = process.env.NODE_ENV === 'production';

    // 1. Live Gateway Execution
    if (this.isConfigured()) {
      try {
        const response = await fetch(`${NEXUSPAG_BASE_URL}/api/pix/create`, {
          method: 'POST',
          headers: {
            'x-api-key': NEXUSPAG_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount.toFixed(2)),
            description,
            external_id: externalId,
            webhook_url:
              NEXUSPAG_WEBHOOK_URL ||
              `${process.env.PUBLIC_SITE_URL || 'http://localhost:3001'}/api/webhooks/nexuspag`,
            expiration: expirationSeconds,
          }),
        });

        const data = (await response.json()) as NexusPagPixResponse;

        if (response.ok && data.success && data.transaction) {
          const payment: PaymentTransaction = {
            id: data.transaction.id,
            gateway: 'nexuspag',
            product,
            externalId: data.transaction.external_id || externalId,
            txid: data.transaction.txid,
            amount: data.transaction.amount,
            currency: 'BRL',
            status: 'pending',
            customerName: options.customerName,
            customerEmail: options.customerEmail,
            pixCopiaCola: data.transaction.pix_copia_cola,
            qrCodeBase64: data.transaction.qr_code_base64,
            createdAt: new Date().toISOString(),
            expiresAt: data.transaction.expires_at || new Date(Date.now() + expirationSeconds * 1000).toISOString(),
          };
          return db.createPayment(payment);
        } else {
          console.error('[NexusPag API Error]:', data);
          if (isProd) {
            throw new Error('Falha ao comunicar com gateway de pagamento.');
          }
        }
      } catch (error: any) {
        console.error('[NexusPag Exception]:', error);
        if (isProd) {
          throw new Error('Gateway de pagamento indisponível no momento. Tente novamente em alguns instantes.');
        }
      }
    } else if (isProd) {
      // In production, FAIL CLOSED if gateway is not configured
      console.error('[CRITICAL] NexusPag API key is not configured in production environment.');
      throw new Error('Gateway de pagamento não configurado no ambiente de produção.');
    }

    // 2. Development Sandbox / Simulation Mode (STRICTLY DISABLED IN PRODUCTION)
    const mockTxId = `nxp_${crypto.randomBytes(12).toString('hex')}`;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();
    const mockPixCopiaCola = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865405${amount.toFixed(2)}5802BR5920${config.creator.name.replace(/[^a-zA-Z ]/g, '').slice(0, 20)}6009SAO PAULO62070503***6304${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const payment: PaymentTransaction = {
      id: mockTxId,
      gateway: 'nexuspag',
      product,
      externalId,
      txid: `tx_${crypto.randomBytes(8).toString('hex')}`,
      amount,
      currency: 'BRL',
      status: 'pending',
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      pixCopiaCola: mockPixCopiaCola,
      qrCodeBase64: '',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    return db.createPayment(payment);
  },

  async checkPaymentStatus(paymentId: string): Promise<PaymentTransaction | null> {
    const payment = db.findPaymentById(paymentId);
    if (!payment) return null;

    if (payment.status === 'paid' || payment.status === 'completed') return payment;

    if (new Date() > new Date(payment.expiresAt)) {
      db.updatePayment(payment.id, { status: 'expired' });
      return { ...payment, status: 'expired' };
    }

    if (this.isConfigured() && payment.txid) {
      try {
        const response = await fetch(`${NEXUSPAG_BASE_URL}/api/pix/get?id=${payment.id}&txid=${payment.txid}`, {
          headers: { 'x-api-key': NEXUSPAG_API_KEY },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && (data.status === 'paid' || data.status === 'approved' || data.transaction?.status === 'paid')) {
            const updated = db.updatePayment(payment.id, {
              status: 'completed',
              paidAt: new Date().toISOString(),
            });
            return updated || payment;
          }
        }
      } catch (err) {
        console.error('Error querying NexusPag status:', err);
      }
    }

    return payment;
  },

  simulatePaymentApproval(paymentId: string): PaymentTransaction | null {
    // Strictly forbidden in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Simulação de pagamento desativada em ambiente de produção.');
    }

    const payment = db.findPaymentById(paymentId);
    if (!payment) return null;

    const updated = db.updatePayment(payment.id, {
      status: 'completed',
      paidAt: new Date().toISOString(),
    });
    return updated || null;
  },

  /**
   * Validates HMAC Signature of incoming NexusPag Webhook
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    const secret = process.env.NEXUSPAG_WEBHOOK_SECRET || NEXUSPAG_WEBHOOK_SECRET;

    // If webhook secret is not set in development, allow for testing
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL] NEXUSPAG_WEBHOOK_SECRET is required in production.');
        return false;
      }
      return true;
    }

    if (!signatureHeader || typeof signatureHeader !== 'string') {
      return false;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(signatureHeader.replace(/^sha256=/, ''), 'utf8');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  },
};
