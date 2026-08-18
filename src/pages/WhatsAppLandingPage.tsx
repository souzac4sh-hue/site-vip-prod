import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, Check, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LiveConfig } from '../types';

export const WhatsAppLandingPage: React.FC = () => {
  const [config, setConfig] = useState<LiveConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await api.getConfig();
        setConfig(data);
        // Track page view event specifically for WhatsApp funnel
        api.trackEvent('page_view', 'whatsapp_access');
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleOpenWhatsApp = () => {
    api.trackEvent('whatsapp_redirect', 'whatsapp_access');
    const link =
      config?.whatsappLink ||
      `https://wa.me/5517981912832?text=${encodeURIComponent(
        'Oi Sara, tudo bem? Tenho interesse nos seus conteúdos exclusivos e quero liberar meu acesso VIP! 🔥'
      )}`;
    window.open(link, '_blank');
  };

  const handleOpenPreviewsGroup = () => {
    api.trackEvent('previews_group_click', 'whatsapp_access');
    const link =
      config?.previewsGroupLink ||
      config?.whatsappLink ||
      'https://t.me/+grupo_de_previas_oficial';
    window.open(link, '_blank');
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-sm sm:max-w-md w-full mx-auto px-4 sm:px-6 pt-8 pb-16 flex flex-col items-center text-center">
        {/* Creator Avatar & Live Pulse Status */}
        <div className="relative mb-3.5">
          <img
            src={config.creator.whatsappAvatarUrl || config.creator.avatarUrl || '/creator/avatar.jpg'}
            alt={config.creator.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.25)]"
          />
          <span className="absolute bottom-0 right-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-black text-black border-2 border-[#060608] flex items-center gap-1 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ONLINE</span>
          </span>
        </div>

        {/* Creator Name & Username */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {config.creator.name}
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-0.5 mb-3">
          @{config.creator.username}
        </p>

        {/* Main Bio / Hook */}
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-sm mb-6">
          Meu WhatsApp oficial para quem quer falar comigo sobre{' '}
          <strong className="text-white">packs de fotos, vídeos exclusivos, conteúdos personalizados e chamadas privadas</strong>.
        </p>

        {/* Section: Antes de me chamar */}
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] text-left space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Antes de me chamar</span>
          </h2>

          <p className="text-xs text-zinc-300">
            O WhatsApp é reservado para <strong className="text-white">atendimento e compras</strong>.
          </p>

          <ul className="space-y-1.5 text-xs text-zinc-200">
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span>Packs de fotos e vídeos</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span>Conteúdos personalizados</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span>Chamadas privadas</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-zinc-400 leading-relaxed">
            <p>
              As <strong className="text-zinc-200">prévias gratuitas ficam disponíveis no meu grupo de prévias</strong>. Por isso, não envie pedidos de fotos grátis pelo WhatsApp.
            </p>
            <p className="text-rose-300/90 font-medium">
              Quem insistir em pedir conteúdo gratuito poderá ser bloqueado.
            </p>
          </div>
        </div>

        {/* Section: Quero comprar ou saber os valores */}
        <div className="w-full space-y-2 mb-6">
          <div className="text-left mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Quero comprar ou saber os valores
            </h2>
          </div>

          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-sm tracking-wide uppercase transition-all shadow-[0_4px_24px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2.5 group"
          >
            <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform fill-white/20" />
            <span>Falar comigo no WhatsApp</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <p className="text-[11px] text-zinc-500 leading-snug">
            Ao clicar, o WhatsApp será aberto com uma mensagem pronta para facilitar o atendimento.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-white/[0.08] my-2" />

        {/* Section: Quer conhecer primeiro? */}
        <div className="w-full mt-4 space-y-2.5">
          <div className="text-center">
            <h3 className="text-xs font-bold text-zinc-300">
              Quer conhecer primeiro?
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Veja algumas prévias gratuitas antes de me chamar.
            </p>
          </div>

          <button
            onClick={handleOpenPreviewsGroup}
            className="w-full py-3 px-4 rounded-xl bg-[#111116] hover:bg-[#181820] text-zinc-200 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <Send className="w-3.5 h-3.5 text-rose-400" />
            <span>Acessar Grupo de Prévias Gratuitas</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
