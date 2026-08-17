import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Radio,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../utils/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AccessVerifyResponse } from '../types';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessData, setAccessData] = useState<AccessVerifyResponse | null>(null);

  useEffect(() => {
    // Fire festive celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF295C', '#ffffff', '#10b981'],
    });

    async function checkAccess() {
      try {
        const res = await api.verifyAccess();
        if (res.authorized) {
          setAccessData(res);
        }
      } catch (err) {}
    }
    checkAccess();
  }, []);

  const whatsappLink =
    accessData?.whatsappData?.link ||
    'https://wa.me/5511999999999?text=Oie%20Isabella,%20liberei%20meu%20acesso%20de%2030%20dias%20no%20site!';

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between selection:bg-brand-500">
      <Navbar />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 pt-8 pb-20 flex flex-col items-center justify-center text-center">
        <div className="w-full bg-[#0e0e10] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in relative overflow-hidden">
          {/* Confetti Accent */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pagamento Confirmado</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-2">
            Acesso VIP Liberado!
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto mb-6">
            Seu passe de <strong>30 dias de transmissões privadas</strong> e seu <strong>WhatsApp VIP</strong> foram ativados com sucesso.
          </p>

          {/* Action 1: Entrar na Live Room */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/live')}
              className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-black text-sm tracking-wider uppercase transition-all shadow-brand flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 text-white animate-pulse" />
              <span>Entrar na Sala da Live Agora</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* Action 2: Chamar no WhatsApp VIP */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-black font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-black text-black" />
              <span>Conversar no WhatsApp da Modelo</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </a>
          </div>

          {/* Summary Details */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-2 text-xs text-zinc-400 text-left">
            <div className="flex items-center justify-between">
              <span>Período de Acesso:</span>
              <strong className="text-white font-mono">30 Dias (720 horas)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Transmissões:</span>
              <strong className="text-white">Todas as salas liberadas</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>WhatsApp:</span>
              <strong className="text-emerald-400 font-semibold">Contato Direto Liberado</strong>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
