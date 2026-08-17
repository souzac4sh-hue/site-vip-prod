import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  LiveConfig,
  PaymentTransaction,
  AccessSession,
  AnalyticsEvent,
  FunnelMetrics,
  ProductType,
  AdminStats,
  StaffAnnouncement,
  AnnouncementConfig,
} from '../../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic Data Directory for Railway Volume (/data), Vercel (/tmp/data) or Local Dev (./data)
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : path.resolve(__dirname, '../../data'));
const DATA_FILE = path.join(DATA_DIR, 'store.json');

export function generateDisplayName(): string {
  const adjectives = ['Lucas', 'Rodrigo', 'Gabriel', 'Rafael', 'Matheus', 'Bruno', 'Felipe', 'Eduardo', 'Thiago', 'Gustavo'];
  const tags = ['VIP', 'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF', 'Oficial'];
  const num = Math.floor(Math.random() * 90) + 10;
  const name = adjectives[Math.floor(Math.random() * adjectives.length)];
  const tag = tags[Math.floor(Math.random() * tags.length)];
  return `${name}_${tag}${num}`;
}

const defaultContent = {
  heroHeadline: 'Acesso Exclusivo à Transmissão Privada',
  heroSubheadline: 'Transmissão em alta definição com som e imagem em tempo real. Inclui acesso completo por 30 dias e contato VIP no WhatsApp.',
  ctaButtonText: 'LIBERAR ACESSO VIP — R$ 9,90',
  ctaMicrocopy: 'Pagamento único de R$ 9,90 • Acesso por 30 dias • WhatsApp incluso',
  cardOfferTitle: 'Passe de Acesso Completo',
  cardOfferSubtitle: 'Transmissões privadas ao vivo durante 30 dias + WhatsApp VIP direto com a criadora.',
  guaranteeTitle: 'Garantia de Satisfação',
  guaranteeText: 'Se você não ficar satisfeito com o conteúdo da transmissão, devolvemos 100% do valor sem burocracia.',
  benefits: [
    { icon: 'Video', title: '30 Dias de Acesso às Lives', description: 'Assista a todas as transmissões privadas durante 1 mês completo.' },
    { icon: 'MessageCircle', title: 'WhatsApp VIP Incluso', description: 'Receba o contato direto no WhatsApp para conversar no privado.' },
    { icon: 'Zap', title: 'Entrada Instantânea', description: 'Pagou, confirmou, entrou na hora via PIX.' },
    { icon: 'Smartphone', title: 'Otimizado para Celular', description: 'Stream leve e fluido para iPhone e Android.' },
  ],
  faqs: [
    { question: 'O que está incluso no valor de R$ 9,90?', answer: 'Você ganha acesso a todas as transmissões privadas da criadora durante 30 dias (720 horas) e recebe o link do WhatsApp VIP para conversar no privado.' },
    { question: 'Como recebo o link do WhatsApp?', answer: 'Imediatamente após a confirmação do PIX, o botão de acesso ao WhatsApp VIP é exibido na tela de sucesso.' },
    { question: 'Preciso criar conta ou senha?', answer: 'Não. O acesso é vinculado com segurança ao seu pagamento e navegador sem formulários.' },
    { question: 'Funciona no celular?', answer: 'Sim. A plataforma foi desenvolvida mobile-first com máxima performance.' },
    { question: 'Por quanto tempo tenho acesso?', answer: 'Seu acesso permanece liberado por 30 dias corridos (720 horas) a partir da data de compra.' },
  ],
};

const defaultAnnouncementConfig: AnnouncementConfig = {
  enabled: true,
  isPaused: false,
  intervalSeconds: 6,
  durationSeconds: 5,
  loop: true,
};

const defaultLiveConfig: LiveConfig = {
  status: 'live',
  title: 'Transmissão Privada VIP • Edição Especial',
  description: 'Sala exclusiva com transmissão em 1080p a 60 FPS. Membros possuem acesso por 30 dias a todas as lives e contato VIP no WhatsApp.',
  scheduledAt: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
  streamProvider: 'mp4',
  streamUrl: 'https://litter.catbox.moe/wxdm2lsdoahggwkx.mp4',
  price: 9.90,
  whatsappPrice: 9.90,
  currency: 'BRL',
  accessDurationHours: 720,
  requireAgeConfirmation: false,
  demoMode: false,
  chatEnabled: false,
  autoWelcomeEnabled: false,
  onlineViewersCount: 38,
  whatsappLink: 'https://wa.me/5511999999999?text=Oie%20Sara,%20acabei%20de%20liberar%20meu%20acesso%20de%2030%20dias%20no%20site!',
  previewsGroupLink: '',
  creator: {
    name: 'Sara Amorin',
    username: 'sara.amorinn',
    bio: 'Criadora de conteúdo exclusivo e modelo. Transmissões privadas para apoiadores selecionados.',
    avatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
    coverUrl: '/creator/cover.jpg',
    whatsappAvatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
    previewMediaType: 'video',
    previewVideoUrl: 'https://litter.catbox.moe/wxdm2lsdoahggwkx.mp4',
    previewBlur: 'medium',
    badgeText: 'MEMBRO VIP',
    whatsappNumber: '+55 (11) 99999-9999',
  },
  content: defaultContent,
  welcomePresets: [
    'Bem-vindo à sala privada! 🔒 Aproveite a transmissão em 1080p.',
    'Seu acesso de 30 dias está ativo! O WhatsApp da modelo está liberado.',
  ],
  announcementConfig: defaultAnnouncementConfig,
};

interface MemoryStore {
  liveConfig: LiveConfig;
  payments: PaymentTransaction[];
  accessSessions: AccessSession[];
  analyticsEvents: AnalyticsEvent[];
  announcements: StaffAnnouncement[];
}

let memoryStore: MemoryStore = {
  liveConfig: defaultLiveConfig,
  payments: [],
  accessSessions: [],
  analyticsEvents: [],
  announcements: [
    {
      id: 'ann_init_1',
      authorName: 'STAFF DA PRODUÇÃO',
      role: 'PRODUÇÃO',
      message: '🚨 Transmissão Privada VIP iniciada! Garanta seu acesso de 30 dias antes que a sala atinja o limite.',
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      isActive: true,
    },
    {
      id: 'ann_init_2',
      authorName: 'Sara Amorin',
      role: 'CRIADORA',
      avatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
      message: 'Oie amores! Entrem e fiquem à vontade na sala VIP, estou ao vivo agora! ❤️',
      createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      isActive: true,
    },
    {
      id: 'ann_init_3',
      authorName: 'SUPORTE VIP',
      role: 'SISTEMA',
      message: 'ℹ️ Pagamentos via PIX são aprovados instantaneamente e liberam a live e o WhatsApp na hora.',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      isActive: true,
    },
    {
      id: 'ann_init_4',
      authorName: 'Sara Amorin',
      role: 'CRIADORA',
      avatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
      message: 'Quem garantir o passe agora já ganha acesso direto ao meu WhatsApp privado! 🔥',
      createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
      isActive: true,
    },
    {
      id: 'ann_init_5',
      authorName: 'MODERAÇÃO',
      role: 'STAFF',
      message: '🔒 Transmissão 100% discreta e sem rastros. Aproveitem a live em alta definição 1080p.',
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ],
};

function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      memoryStore = {
        liveConfig: {
          ...defaultLiveConfig,
          ...parsed.liveConfig,
          price: parsed.liveConfig?.price || 9.90,
          whatsappPrice: parsed.liveConfig?.whatsappPrice || 9.90,
          accessDurationHours: 720,
          content: { ...defaultContent, ...(parsed.liveConfig?.content || {}) },
          creator: { ...defaultLiveConfig.creator, ...(parsed.liveConfig?.creator || {}) },
          welcomePresets: parsed.liveConfig?.welcomePresets || defaultLiveConfig.welcomePresets,
          announcementConfig: { ...defaultAnnouncementConfig, ...(parsed.liveConfig?.announcementConfig || {}) },
        },
        payments: parsed.payments || [],
        accessSessions: parsed.accessSessions || [],
        analyticsEvents: parsed.analyticsEvents || [],
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : memoryStore.announcements,
      };
    } else {
      saveStore();
    }
  } catch (err) {
    console.warn('[Storage Initialized with Defaults/In-Memory]:', err);
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Storage write warning]:', err);
  }
}

initStore();

export const db = {
  getConfig(): LiveConfig {
    return memoryStore.liveConfig;
  },

  updateConfig(updates: Partial<LiveConfig>): LiveConfig {
    memoryStore.liveConfig = {
      ...memoryStore.liveConfig,
      ...updates,
      creator: {
        ...memoryStore.liveConfig.creator,
        ...(updates.creator || {}),
      },
      content: {
        ...memoryStore.liveConfig.content,
        ...(updates.content || {}),
      },
      announcementConfig: {
        ...memoryStore.liveConfig.announcementConfig,
        ...(updates.announcementConfig || {}),
      },
      announcements: updates.announcements || memoryStore.announcements,
    };
    if (updates.announcements && Array.isArray(updates.announcements)) {
      memoryStore.announcements = updates.announcements;
    }
    saveStore();
    return memoryStore.liveConfig;
  },

  getPayments(): PaymentTransaction[] {
    return memoryStore.payments;
  },

  findPaymentById(id: string): PaymentTransaction | undefined {
    return memoryStore.payments.find((p) => p.id === id || p.externalId === id || p.txid === id);
  },

  createPayment(payment: PaymentTransaction): PaymentTransaction {
    memoryStore.payments.unshift(payment);
    saveStore();
    return payment;
  },

  updatePayment(id: string, updates: Partial<PaymentTransaction>): PaymentTransaction | undefined {
    const idx = memoryStore.payments.findIndex((p) => p.id === id || p.externalId === id || p.txid === id);
    if (idx === -1) return undefined;
    memoryStore.payments[idx] = { ...memoryStore.payments[idx], ...updates };
    saveStore();
    return memoryStore.payments[idx];
  },

  getAccessSessions(): AccessSession[] {
    return memoryStore.accessSessions;
  },

  findSessionById(id: string): AccessSession | undefined {
    return memoryStore.accessSessions.find((s) => s.id === id);
  },

  findSessionByTokenHash(hash: string): AccessSession | undefined {
    return memoryStore.accessSessions.find((s) => s.tokenHash === hash);
  },

  createAccessSession(session: AccessSession): AccessSession {
    if (!session.displayName) {
      session.displayName = generateDisplayName();
    }
    memoryStore.accessSessions.unshift(session);
    saveStore();
    return session;
  },

  revokeAccessSession(id: string): boolean {
    const session = memoryStore.accessSessions.find((s) => s.id === id);
    if (session) {
      session.revoked = true;
      saveStore();
      return true;
    }
    return false;
  },

  getAnnouncements(): StaffAnnouncement[] {
    return (memoryStore.announcements || []).filter((a) => a.isActive !== false);
  },

  getAllAnnouncementsAdmin(): StaffAnnouncement[] {
    return memoryStore.announcements || [];
  },

  addAnnouncement(ann: Omit<StaffAnnouncement, 'id' | 'createdAt'>): StaffAnnouncement {
    const newAnn: StaffAnnouncement = {
      ...ann,
      id: `ann_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      createdAt: new Date().toISOString(),
      isActive: ann.isActive ?? true,
    };
    if (!memoryStore.announcements) memoryStore.announcements = [];
    memoryStore.announcements.push(newAnn);
    saveStore();
    return newAnn;
  },

  updateAnnouncement(id: string, updates: Partial<StaffAnnouncement>): StaffAnnouncement | undefined {
    if (!memoryStore.announcements) return undefined;
    const idx = memoryStore.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    memoryStore.announcements[idx] = { ...memoryStore.announcements[idx], ...updates };
    saveStore();
    return memoryStore.announcements[idx];
  },

  deleteAnnouncement(id: string) {
    if (!memoryStore.announcements) return;
    memoryStore.announcements = memoryStore.announcements.filter((a) => a.id !== id);
    saveStore();
  },

  logEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): void {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    memoryStore.analyticsEvents.push(newEvent);
    if (memoryStore.analyticsEvents.length > 10000) {
      memoryStore.analyticsEvents = memoryStore.analyticsEvents.slice(-10000);
    }
    saveStore();
  },

  getFunnelMetrics(): FunnelMetrics {
    const events = memoryStore.analyticsEvents;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fiveMinAgo = now - 5 * 60 * 1000;

    const pageViews = events.filter((e) => e.eventType === 'page_view').length;
    const ctaClicks = events.filter((e) => e.eventType === 'cta_click').length;
    const checkoutsStarted = events.filter((e) => e.eventType === 'checkout_start').length;
    const paymentsCompleted = events.filter((e) => e.eventType === 'payment_success').length;
    const liveEnters = events.filter((e) => e.eventType === 'live_enter').length;
    const whatsappRedirects = events.filter((e) => e.eventType === 'whatsapp_redirect' || e.eventType === 'whatsapp_open').length;
    const previewsGroupClicks = events.filter((e) => e.eventType === 'previews_group_click').length;

    const viewsToday = events.filter((e) => e.eventType === 'page_view' && new Date(e.createdAt).getTime() >= oneDayAgo).length;
    const viewsLast7Days = events.filter((e) => e.eventType === 'page_view' && new Date(e.createdAt).getTime() >= sevenDaysAgo).length;

    const recentEvents = events.filter((e) => new Date(e.createdAt).getTime() >= fiveMinAgo);
    const activeVisitorsNow = new Set(recentEvents.map((e) => e.sessionId || e.ipHash)).size || 1;

    const conversionRate = pageViews > 0 ? Number(((paymentsCompleted / pageViews) * 100).toFixed(2)) : 0;

    const refererMap: Record<string, number> = {};
    events.forEach((e) => {
      let ref = e.referer || 'direto';
      if (ref.includes('instagram')) ref = 'instagram.com';
      else if (ref.includes('tiktok')) ref = 'tiktok.com';
      else if (ref.includes('google')) ref = 'google.com';
      else if (!ref || ref === 'direct') ref = 'direto';
      refererMap[ref] = (refererMap[ref] || 0) + 1;
    });

    const topReferers = Object.entries(refererMap)
      .map(([referer, count]) => ({ referer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    events.forEach((e) => {
      if (e.deviceType === 'mobile') devices.mobile++;
      else if (e.deviceType === 'tablet') devices.tablet++;
      else devices.desktop++;
    });

    const homeViews = events.filter((e) => e.eventType === 'page_view' && (!e.product || e.product === 'live_access')).length;
    const homeCtaClicks = events.filter((e) => e.eventType === 'cta_click' && (!e.product || e.product === 'live_access')).length;
    const homeCheckouts = events.filter((e) => e.eventType === 'checkout_start' && (!e.product || e.product === 'live_access')).length;
    const homePayments = events.filter((e) => e.eventType === 'payment_success' && (!e.product || e.product === 'live_access')).length;
    const homeConvRate = homeViews > 0 ? Number(((homePayments / homeViews) * 100).toFixed(2)) : 0;

    const waViews = events.filter((e) => e.eventType === 'page_view' && e.product === 'whatsapp_access').length;
    const waClicks = events.filter((e) => (e.eventType === 'whatsapp_redirect' || e.eventType === 'whatsapp_open')).length;
    const waPrevClicks = events.filter((e) => e.eventType === 'previews_group_click').length;
    const waConvRate = waViews > 0 ? Number(((waClicks / waViews) * 100).toFixed(2)) : 0;

    const liveViews = events.filter((e) => e.eventType === 'live_enter').length;

    return {
      pageViews,
      ctaClicks,
      checkoutsStarted,
      paymentsCompleted,
      liveEnters,
      whatsappRedirects,
      previewsGroupClicks,
      conversionRate,
      activeVisitorsNow,
      viewsToday,
      viewsLast7Days,
      topReferers,
      deviceBreakdown: devices,
      homePage: {
        views: homeViews,
        ctaClicks: homeCtaClicks,
        checkoutsStarted: homeCheckouts,
        paymentsCompleted: homePayments,
        conversionRate: homeConvRate,
      },
      whatsappPage: {
        views: waViews,
        whatsappClicks: waClicks,
        previewsClicks: waPrevClicks,
        conversionRate: waConvRate,
      },
      liveRoom: {
        views: liveViews,
        liveEnters,
      },
    };
  },

  getStats(): AdminStats {
    const totalPayments = memoryStore.payments.length;
    const paidPayments = memoryStore.payments.filter((p) => p.status === 'paid' || p.status === 'completed');
    const totalRevenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayPaid = paidPayments.filter((p) => new Date(p.createdAt) >= startOfToday);
    const todayRevenue = todayPaid.reduce((acc, p) => acc + (p.amount || 0), 0);

    const activeSessions = memoryStore.accessSessions.filter((s) => !s.revoked && new Date(s.expiresAt) > new Date()).length;
    const whatsappRedirects = memoryStore.analyticsEvents.filter((e) => e.eventType === 'whatsapp_redirect' || e.eventType === 'whatsapp_open').length;

    return {
      totalRevenue,
      todayRevenue,
      totalPayments,
      paidPayments: paidPayments.length,
      activeSessions,
      whatsappRedirects,
      liveStatus: memoryStore.liveConfig.status,
      onlineChatUsers: 0,
    };
  },
};
