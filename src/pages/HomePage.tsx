import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, Shield } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { LivePreview } from '../components/LivePreview';
import { PurchaseCard } from '../components/PurchaseCard';
import { PaymentModal } from '../components/PaymentModal';
import { SocialProofPillars } from '../components/SocialProofPillars';
import { HowItWorks } from '../components/HowItWorks';
import { FAQAccordion } from '../components/FAQAccordion';
import { StickyCTA } from '../components/StickyCTA';
import { AgeGate } from '../components/AgeGate';
import { AntiBotGate } from '../components/AntiBotGate';
import { LiveAnnouncementsFeed } from '../components/LiveAnnouncementsFeed';
import { Footer } from '../components/Footer';
import { api } from '../utils/api';
import { LiveConfig } from '../types';

export const HomePage: React.FC = () => {
  const location = useLocation();
  const [config, setConfig] = useState<LiveConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isAgeGateOpen, setIsAgeGateOpen] = useState<boolean>(false);
  const [isAntiBotOpen, setIsAntiBotOpen] = useState<boolean>(false);

  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(() => {
    return sessionStorage.getItem('pl_age_confirmed') === 'true';
  });

  const [humanVerified, setHumanVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('pl_human_verified') === 'true';
  });

  useEffect(() => {
    api.trackEvent('page_view', 'live_access');

    if (location.state?.paywallRequired) {
      setToastMessage('Acesso restrito: Desbloqueie sua entrada para assistir à sala privada.');
      setTimeout(() => setToastMessage(''), 6000);
    }

    async function loadConfig() {
      try {
        const data = await api.getConfig();
        setConfig(data);
        if (data.requireAgeConfirmation && !ageConfirmed) {
          setIsAgeGateOpen(true);
        }
      } catch (err) {
        console.error('Error fetching config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [location, ageConfirmed]);

  const handleOpenCheckout = () => {
    if (!humanVerified) {
      setIsAntiBotOpen(true);
      return;
    }
    if (config?.requireAgeConfirmation && !ageConfirmed) {
      setIsAgeGateOpen(true);
      return;
    }
    api.trackEvent('cta_click', 'live_access');
    setIsModalOpen(true);
  };

  const handleAntiBotVerified = () => {
    setHumanVerified(true);
    setIsAntiBotOpen(false);
    if (config?.requireAgeConfirmation && !ageConfirmed) {
      setIsAgeGateOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleConfirmAge = () => {
    sessionStorage.setItem('pl_age_confirmed', 'true');
    setAgeConfirmed(true);
    setIsAgeGateOpen(false);
    setIsModalOpen(true);
  };

  const handleRejectAge = () => {
    window.location.href = 'https://google.com';
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
      </div>
    );
  }

  const content = config.content || {
    heroHeadline: 'Uma transmissão feita para quem está dentro.',
    heroSubheadline: 'Libere seu acesso individual e entre na sala privada com som e imagem em alta fidelidade.',
    ctaButtonText: 'LIBERAR MEU ACESSO',
    ctaMicrocopy: 'Pagamento único • Entrada após confirmação',
    guaranteeTitle: 'Garantia de Reembolso',
    guaranteeText: 'Se você não ficar satisfeito com o conteúdo da transmissão, devolvemos 100% do valor do ingresso sem burocracia.',
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Demo Mode Notice */}
      {config.demoMode && (
        <div className="bg-amber-950/90 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-semibold text-amber-300">
          ⚠️ MODO DEMO ATIVO — Nenhum pagamento real será processado.
        </div>
      )}

      {/* Top Banner Alert */}
      {toastMessage && (
        <div className="sticky top-14 z-50 bg-rose-950/95 border-b border-rose-500/40 px-4 py-2 text-center text-xs font-medium text-rose-200 flex items-center justify-center gap-2 animate-fade-in shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-16">
        {/* Intimate Creator Headline */}
        <div className="max-w-3xl mb-6 sm:mb-8 text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {content.heroHeadline}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            {content.heroSubheadline}
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Dominant Player & Creator Story */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <LivePreview
              creator={config.creator}
              status={config.status}
              scheduledAt={config.scheduledAt}
              onlineViewers={config.onlineViewersCount || 1480}
              onUnlockClick={handleOpenCheckout}
            />

            {/* Embedded Stream Announcements Feed */}
            <LiveAnnouncementsFeed />

            {/* Authentic Creator Personal Message / Copy */}
            {content.longDescription && (
              <div className="pt-2 text-zinc-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal border-t border-white/[0.06]">
                {content.longDescription}
              </div>
            )}
          </div>

          {/* Right Column: Intimate Purchase Pass Card */}
          <div id="purchase-card-container" className="lg:col-span-5 xl:col-span-4 sticky top-20">
            <PurchaseCard
              creator={config.creator}
              price={config.price}
              currency={config.currency}
              durationHours={config.accessDurationHours}
              status={config.status}
              requireAgeConfirmation={config.requireAgeConfirmation && !ageConfirmed}
              onProceedToCheckout={handleOpenCheckout}
            />
          </div>
        </div>

        {/* Benefits & Value */}
        <SocialProofPillars benefits={config.content.benefits} />

        {/* 3 Simple Steps */}
        <HowItWorks />

        {/* 100% Refund Guarantee */}
        <section className="py-10 border-t border-white/[0.06] text-center max-w-lg mx-auto px-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1 tracking-tight">
            {content.guaranteeTitle || 'Garantia Incondicional'}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {content.guaranteeText || 'Se você não gostar do conteúdo da transmissão, devolvemos 100% do seu valor via PIX imediatamente.'}
          </p>
        </section>

        {/* FAQ Accordion */}
        <FAQAccordion durationHours={config.accessDurationHours} faqs={config.content.faqs} />
      </main>

      {/* Sticky Mobile Bottom CTA */}
      <StickyCTA
        price={config.price}
        currency={config.currency}
        buttonText={content.ctaButtonText}
        onUnlockClick={handleOpenCheckout}
      />

      {/* PIX Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creator={config.creator}
        price={config.price}
        product="live_access"
      />

      {/* Anti-Bot Verification Gate */}
      <AntiBotGate
        isOpen={isAntiBotOpen}
        onVerified={handleAntiBotVerified}
      />

      {/* 18+ Age Gate Modal */}
      <AgeGate
        isOpen={isAgeGateOpen}
        onConfirm={handleConfirmAge}
        onReject={handleRejectAge}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};
