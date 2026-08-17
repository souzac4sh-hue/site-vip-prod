import crypto from 'crypto';
import { db } from './db.js';
import { PaymentTransaction, ProductType } from '../../src/types/index.js';

export interface CreatePixOptions {
  amount?: number;
  product?: ProductType;
  description?: string;
  externalId?: string;
  customerName?: string;
  customerEmail?: string;
  expirationSeconds?: number;
}

function getApiKey(): string {
  return (process.env.NEXUSPAG_API_KEY || '').trim();
}

function getBaseUrl(): string {
  return (process.env.NEXUSPAG_BASE_URL || 'https://nexuspag.com').trim();
}

export const nexusPagService = {
  isConfigured(): boolean {
    const key = getApiKey();
    return Boolean(key && !key.includes('demo_test_key') && !key.includes('sample') && key.length > 5);
  },

  async createPixCharge(options: CreatePixOptions): Promise<PaymentTransaction> {
    const config = db.getConfig();
    const product: ProductType = options.product || 'live_access';
    const amount =
      options.amount !== undefined
        ? options.amount
        : product === 'whatsapp_access'
        ? config.whatsappPrice || 9.90
        : config.price || 9.90;

    const externalId = options.externalId || `ord_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expirationSeconds = options.expirationSeconds || 1800; // 30 mins

    const description =
      options.description ||
      (product === 'whatsapp_access'
        ? `WhatsApp VIP - ${config.creator.name}`
        : `Acesso VIP 30 Dias - ${config.creator.name}`);

    // Check idempotency
    const existing = db.findPaymentById(externalId);
    if (existing) {
      return existing;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const apiKey = getApiKey();
    const baseUrl = getBaseUrl();

    // 1. Live NexusPag Gateway Execution
    if (this.isConfigured()) {
      try {
        const payload: Record<string, any> = {
          amount: Number(amount.toFixed(2)),
          description,
          external_id: externalId,
          expiration: expirationSeconds,
        };

        if (process.env.PUBLIC_SITE_URL || process.env.NEXUSPAG_WEBHOOK_URL) {
          payload.webhook_url =
            process.env.NEXUSPAG_WEBHOOK_URL ||
            `${process.env.PUBLIC_SITE_URL}/api/webhooks/nexuspag`;
        }

        const response = await fetch(`${baseUrl}/api/pix/create`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as any;

        if (response.ok && data?.success && data?.transaction) {
          const tx = data.transaction;
          const payment: PaymentTransaction = {
            id: String(tx.id || externalId),
            gateway: 'nexuspag',
            product,
            externalId: tx.external_id || externalId,
            txid: tx.txid || String(tx.id),
            amount: typeof tx.amount === 'number' ? tx.amount : amount,
            currency: 'BRL',
            status: 'pending',
            customerName: options.customerName,
            customerEmail: options.customerEmail,
            pixCopiaCola: tx.pix_copia_cola || '',
            qrCodeBase64: tx.qr_code_base64 || '',
            createdAt: new Date().toISOString(),
            expiresAt: tx.expires_at || new Date(Date.now() + expirationSeconds * 1000).toISOString(),
          };
          return db.createPayment(payment);
        } else {
          console.error('[NexusPag API Error]:', data);
          const errorMsg = data?.message || data?.error || (response.status === 401 ? 'API Key da NexusPag inválida ou não autorizada.' : 'Erro ao gerar PIX na NexusPag.');
          throw new Error(errorMsg);
        }
      } catch (error: any) {
        console.error('[NexusPag Exception]:', error?.message || error);
        throw new Error(error?.message || 'Falha ao conectar com o gateway NexusPag.');
      }
    } else {
      if (isProd) {
        throw new Error(
          'A variável NEXUSPAG_API_KEY não foi configurada no painel da Vercel. Adicione a chave da NexusPag em Settings -> Environment Variables.'
        );
      }
    }

    // 2. Development Sandbox (Only for local development when no API key is provided)
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
    let payment = db.findPaymentById(paymentId);

    if (payment && (payment.status === 'paid' || payment.status === 'completed')) {
      return payment;
    }

    const apiKey = getApiKey();
    const baseUrl = getBaseUrl();

    // Query NexusPag live API directly so serverless cold starts never miss status
    if (this.isConfigured()) {
      try {
        const queryId = payment?.id || payment?.txid || payment?.externalId || paymentId;
        const response = await fetch(`${baseUrl}/api/pix/${encodeURIComponent(queryId)}`, {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const tx = data?.transaction || data;
          const status = (tx?.status || data?.status || '').toLowerCase();

          if (status === 'paid' || status === 'completed') {
            if (payment) {
              payment = db.updatePayment(payment.id, {
                status: 'completed',
                paidAt: tx?.paid_at || data?.paid_at || new Date().toISOString(),
              });
            } else {
              payment = db.createPayment({
                id: tx?.id || paymentId,
                gateway: 'nexuspag',
                product: 'live_access',
                externalId: tx?.external_id || paymentId,
                txid: tx?.txid || paymentId,
                amount: typeof tx?.amount === 'number' ? tx.amount : 9.90,
                currency: 'BRL',
                status: 'completed',
                pixCopiaCola: tx?.pix_copia_cola || '',
                qrCodeBase64: tx?.qr_code_base64 || '',
                createdAt: new Date().toISOString(),
                paidAt: tx?.paid_at || new Date().toISOString(),
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
              });
            }
            return payment || null;
          }
        }
      } catch (err) {
        console.error('[Error querying NexusPag status]:', err);
      }
    }

    return payment || null;
  },

  simulatePaymentApproval(paymentId: string): PaymentTransaction | null {
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

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    const secret = process.env.NEXUSPAG_WEBHOOK_SECRET || '';

    if (!secret) {
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
