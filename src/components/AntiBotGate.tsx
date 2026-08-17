import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { TurnstileChallenge } from './TurnstileChallenge';

interface AntiBotGateProps {
  isOpen: boolean;
  onVerified: () => void;
}

export const AntiBotGate: React.FC<AntiBotGateProps> = ({ isOpen, onVerified }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');

  if (!isOpen) return null;

  const handleVerify = (t: string) => {
    setToken(t);
    sessionStorage.setItem('pl_human_verified', 'true');
    setTimeout(() => {
      onVerified();
    }, 400);
  };

  const handleQuickClick = () => {
    setLoading(true);
    setTimeout(() => {
      sessionStorage.setItem('pl_human_verified', 'true');
      setLoading(false);
      onVerified();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#101010] border border-white/10 rounded-3xl p-7 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-500 shadow-[0_0_25px_rgba(255,41,92,0.3)]">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">
          Verificação de Segurança
        </h3>

        <p className="text-xs text-zinc-400 mt-1.5 mb-5 leading-relaxed">
          Proteção contra bots e acessos automatizados. Clique no botão abaixo para confirmar que é humano e prosseguir.
        </p>

        {/* Turnstile Challenge */}
        <TurnstileChallenge onVerify={handleVerify} />

        <div className="mt-4">
          <button
            type="button"
            onClick={handleQuickClick}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
            <span>Não sou um robô • Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
