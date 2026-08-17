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

export interface NexusPagPixResponse {
  success?: boolean;
  status?: string;
  message?: string;
  error?: string;
  transaction?: {
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
  pix_copia_cola?: string;
  qr_code_base64?: string;
  id?: string;
  txid?: string;
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
        : `Acesso Sala Privada - ${config.creator.name}`);

    // Check idempotency
    const existing = db.findPaymentById(externalId);
    if (existing) {
      return existing;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const apiKey = getApiKey();
    const baseUrl = getBaseUrl();

    // 1. Live Gateway Execution
    if (this.isConfigured()) {
      try {
        const payload = {
          amount: Number(amount.toFixed(2)),
          description,
          external_id: externalId,
          webhook_url:
            process.env.NEXUSPAG_WEBHOOK_URL ||
            `${process.env.PUBLIC_SITE_URL || ''}/api/webhooks/nexuspag`,
          expiration: expirationSeconds,
        };

        const response = await fetch(`${baseUrl}/api/pix/create`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        let data: any;
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        const tx = data?.transaction || data;
        const pixCopiaCola = tx?.pix_copia_cola || data?.pix_copia_cola || data?.emv || data?.payload;
        const qrCodeBase64 = tx?.qr_code_base64 || data?.qr_code_base64 || data?.qrcode;
        const txId = tx?.id || tx?.txid || data?.id || data?.txid || externalId;

        if (response.ok && (pixCopiaCola || tx?.id)) {
          const payment: PaymentTransaction = {
            id: String(txId),
            gateway: 'nexuspag',
            product,
            externalId: tx?.external_id || externalId,
            txid: tx?.txid || String(txId),
            amount: typeof tx?.amount === 'number' ? tx.amount : amount,
            currency: 'BRL',
            status: 'pending',
            customerName: options.customerName,
            customerEmail: options.customerEmail,
            pixCopiaCola: pixCopiaCola || '',
            qrCodeBase64: qrCodeBase64 || '',
            createdAt: new Date().toISOString(),
            expiresAt: tx?.expires_at || new Date(Date.now() + expirationSeconds * 1000).toISOString(),
          };
          return db.createPayment(payment);
        } else {
          console.error('[NexusPag API Response Failure]:', data);
          const errorMsg = data?.message || data?.error || 'Chave de API NexusPag inválida ou recusada pelo gateway.';
          throw new Error(errorMsg);
        }
      } catch (error: any) {
        console.error('[NexusPag Request Error]:', error?.message || error);
        throw new Error(error?.message || 'Falha ao conectar com o gateway NexusPag.');
      }
    } else {
      // If API key is missing
      if (isProd) {
        throw new Error(
          'A variável NEXUSPAG_API_KEY não foi configurada no painel da Vercel. Adicione a chave da NexusPag em Settings -> Environment Variables.'
        );
      }
    }

    // 2. Development Sandbox / Simulation Mode (STRICTLY FOR LOCAL DEV)
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

    const apiKey = getApiKey();
    const baseUrl = getBaseUrl();

    if (this.isConfigured() && payment.txid) {
      try {
        const response = await fetch(`${baseUrl}/api/pix/get?id=${payment.id}&txid=${payment.txid}`, {
          headers: {
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`,
          },
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
   * Validates HMAC Signature of incoming NexusPag Webhook (Optional if gateway delivers directly)
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    const secret = process.env.NEXUSPAG_WEBHOOK_SECRET || '';

    // If no webhook secret is configured in the gateway, allow direct endpoint delivery
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
