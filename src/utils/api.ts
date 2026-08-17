import {
  LiveConfig,
  PaymentTransaction,
  AccessVerifyResponse,
  AdminStats,
  FunnelMetrics,
  ProductType,
} from '../types';

export const api = {
  async getConfig(): Promise<LiveConfig> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Falha ao carregar configurações');
    return res.json();
  },

  async trackEvent(eventType: string, product?: ProductType, referer?: string): Promise<void> {
    try {
      await fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          product,
          referer: referer || document.referrer,
        }),
      });
    } catch (e) {}
  },

  async createPixCharge(data: {
    product?: ProductType;
    customerName?: string;
    customerEmail?: string;
    turnstileToken?: string;
    externalId?: string;
  }): Promise<{ success: boolean; payment?: Partial<PaymentTransaction>; message?: string }> {
    const res = await fetch('/api/pix/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async checkPixStatus(paymentId: string): Promise<{
    success: boolean;
    status: string;
    isAuthorized: boolean;
    product?: ProductType;
    paidAt?: string;
  }> {
    const res = await fetch(`/api/pix/status/${paymentId}`);
    if (!res.ok) throw new Error('Falha ao verificar status');
    return res.json();
  },

  async simulatePayment(paymentId: string): Promise<{
    success: boolean;
    token?: string;
    status?: string;
    product?: ProductType;
  }> {
    const res = await fetch('/api/pix/simulate-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    return res.json();
  },

  async verifyAccess(): Promise<AccessVerifyResponse> {
    const res = await fetch('/api/access/verify');
    if (!res.ok) {
      return { authorized: false, reason: 'unauthorized' };
    }
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/access/logout', { method: 'POST' });
  },

  // Admin APIs
  async adminLogin(password: string, turnstileToken?: string): Promise<{ success: boolean; token?: string; message?: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, turnstileToken }),
    });
    return res.json();
  },

  async getAdminStats(token: string): Promise<{ success: boolean; stats: AdminStats }> {
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },

  async getAdminMetrics(token: string): Promise<{ success: boolean; metrics: FunnelMetrics }> {
    const res = await fetch('/api/admin/metrics', {
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },

  async getAdminConfig(token: string): Promise<{ success: boolean; config: LiveConfig }> {
    const res = await fetch('/api/admin/config', {
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },

  async updateAdminConfig(
    token: string,
    updates: Partial<LiveConfig>
  ): Promise<{ success: boolean; config: LiveConfig }> {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getAdminPayments(token: string): Promise<{ success: boolean; payments: PaymentTransaction[] }> {
    const res = await fetch('/api/admin/payments', {
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },

  async getAdminSessions(token: string): Promise<{ success: boolean; sessions: any[] }> {
    const res = await fetch('/api/admin/sessions', {
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },

  async revokeSession(token: string, sessionId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },
};
