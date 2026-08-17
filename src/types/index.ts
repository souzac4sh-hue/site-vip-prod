export type StreamStatus = 'offline' | 'scheduled' | 'live' | 'ended';

export type ProductType = 'live_access' | 'whatsapp_access';

export type PreviewMediaType = 'image' | 'video';

export interface CreatorProfile {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  whatsappAvatarUrl?: string; // Specific avatar photo for /whatsapp page
  previewMediaType?: PreviewMediaType; // 'image' | 'video'
  previewVideoUrl?: string;
  previewBlur?: 'light' | 'medium' | 'heavy';
  badgeText?: string;
  whatsappNumber?: string;
}

export interface StaffAnnouncement {
  id: string;
  authorName: string;
  role: string; // e.g. 'STAFF', 'MODERAÇÃO', 'SUPORTE', 'ANFITRIÃ'
  message: string;
  avatarUrl?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AnnouncementConfig {
  enabled: boolean;
  isPaused: boolean;
  intervalSeconds: number; // Interval between notices
  durationSeconds: number; // How long notice stays visible
  loop: boolean;
}

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LandingContent {
  heroHeadline: string;
  heroSubheadline: string;
  longDescription?: string; // Multi-line free copy text block
  ctaButtonText: string;
  ctaMicrocopy: string;
  cardOfferTitle: string;
  cardOfferSubtitle: string;
  guaranteeTitle: string;
  guaranteeText: string;
  guaranteeBadgeText?: string;
  benefits: BenefitItem[];
  faqs: FAQItem[];
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  userId?: string;
  authorName: string;
  text: string;
  isModerator?: boolean;
  isSystem?: boolean;
  createdAt: string;
}

export interface LiveConfig {
  status: StreamStatus;
  title: string;
  description: string;
  scheduledAt?: string;
  streamProvider: 'hls' | 'mp4' | 'mux' | 'cloudflare' | 'custom';
  streamUrl: string;
  price: number;
  whatsappPrice: number;
  currency: string;
  accessDurationHours: number;
  requireAgeConfirmation: boolean;
  demoMode: boolean;
  chatEnabled: boolean;
  autoWelcomeEnabled: boolean;
  whatsappLink: string;
  previewsGroupLink?: string; // Telegram or WhatsApp previews group link
  onlineViewersCount?: number; // Number of online viewers displayed on player
  creator: CreatorProfile;
  content: LandingContent;
  welcomePresets: string[];
  announcementConfig: AnnouncementConfig;
}

export interface PaymentTransaction {
  id: string;
  gateway: 'square' | 'nexuspag';
  product: ProductType;
  externalId: string;
  txid?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'paid' | 'failed' | 'expired';
  customerName?: string;
  customerEmail?: string;
  pixCopiaCola?: string;
  qrCodeBase64?: string;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  accessSessionId?: string;
}

export interface AccessSession {
  id: string;
  paymentId: string;
  product: ProductType;
  tokenHash: string;
  displayName?: string;
  rawToken?: string;
  createdAt: string;
  expiresAt: string;
  lastAccessAt: string;
  revoked: boolean;
  deviceInfo?: string;
}

export interface AccessVerifyResponse {
  authorized: boolean;
  product?: ProductType;
  displayName?: string;
  reason?: string;
  expiresAt?: string;
  streamData?: {
    status: StreamStatus;
    provider: string;
    streamUrl: string;
    title: string;
    creator: CreatorProfile;
  };
  whatsappData?: {
    link: string;
    creatorName: string;
  };
}

export interface AnalyticsEvent {
  id: string;
  eventType:
    | 'page_view'
    | 'cta_click'
    | 'checkout_start'
    | 'payment_success'
    | 'payment_failed'
    | 'live_enter'
    | 'whatsapp_open'
    | 'whatsapp_redirect'
    | 'previews_group_click';
  product?: ProductType;
  sessionId: string;
  ipHash: string;
  referer?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  country?: string;
  city?: string;
  createdAt: string;
}

export interface FunnelMetrics {
  pageViews: number;
  ctaClicks: number;
  checkoutsStarted: number;
  paymentsCompleted: number;
  liveEnters: number;
  whatsappRedirects: number;
  previewsGroupClicks: number;
  conversionRate: number;
  activeVisitorsNow: number;
  viewsToday: number;
  viewsLast7Days: number;
  topReferers: Array<{ referer: string; count: number }>;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };

  // Métricas Separadas por Página
  homePage: {
    views: number;
    ctaClicks: number;
    checkoutsStarted: number;
    paymentsCompleted: number;
    conversionRate: number;
  };
  whatsappPage: {
    views: number;
    whatsappClicks: number;
    previewsClicks: number;
    conversionRate: number;
  };
  liveRoom: {
    views: number;
    liveEnters: number;
  };
}

export interface AdminStats {
  totalRevenue: number;
  todayRevenue: number;
  totalPayments: number;
  paidPayments: number;
  activeSessions: number;
  whatsappRedirects: number;
  liveStatus: StreamStatus;
  onlineChatUsers: number;
}
