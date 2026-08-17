import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Loader2, Lock, Shield } from 'lucide-react';

interface InitialSecurityGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'pl_human_verified_session';
const EXPIRATION_HOURS = 24;

export const InitialSecurityGate: React.FC<InitialSecurityGateProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // Check if valid verification exists in localStorage or document.cookie
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        if (parsed.expiresAt && now < parsed.expiresAt) {
          setIsVerified(true);
          return;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }

    // If on /admin, allow direct bypass to avoid blocking management
    if (window.location.pathname.startsWith('/admin')) {
      setIsVerified(true);
      return;
    }

    setIsVerified(false);
  }, []);

  const handleCheckboxClick = () => {
    if (isProcessing || isChecked) return;

    setIsProcessing(true);

    // Simulate standard security token generation & verification delay (500ms)
    setTimeout(() => {
      setIsChecked(true);
      setIsProcessing(false);

      const expiresAt = Date.now() + EXPIRATION_HOURS * 3600 * 1000;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ verified: true, expiresAt })
      );
      sessionStorage.setItem('pl_human_verified', 'true');

      // Set cookie for server-side recognition (24h)
      document.cookie = `pl_human_gate=1; max-age=${EXPIRATION_HOURS * 3600}; path=/; SameSite=Lax`;

      // Smooth unlock transition
      setTimeout(() => {
        setIsVerified(true);
      }, 400);
    }, 600);
  };

  // Initial loading check state
  if (isVerified === null) {
    return (
      <div className="fixed inset-0 bg-[#080808] flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // If already verified, render the application directly
  if (isVerified) {
    return <>{children}</>;
  }

  // Interstitial Security Gate overlay (blocks page rendering completely until confirmed)
  return (
    <div className="fixed inset-0 z-[9999] bg-[#070708] text-white flex flex-col items-center justify-center p-4 selection:bg-brand-500 font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm bg-[#0e0e11] border border-white/10 rounded-3xl p-7 sm:p-8 text-center shadow-2xl animate-fade-in">
        {/* Security Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-500 shadow-[0_0_25px_rgba(255,41,92,0.2)]">
          <Shield className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Verificação de Segurança
        </h1>

        <p className="text-xs text-zinc-400 mt-2 mb-6 leading-relaxed">
          Para garantir a estabilidade do servidor e proteger contra acessos automatizados, confirme que você não é um robô.
        </p>

        {/* Custom Security Checkbox Container */}
        <div
          onClick={handleCheckboxClick}
          className={`w-full p-4 rounded-2xl bg-zinc-950/90 border transition-all duration-200 flex items-center justify-between cursor-pointer select-none ${
            isChecked
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : 'border-white/10 hover:border-brand-500/40 hover:bg-white/[0.02]'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleCheckboxClick();
          }}
          aria-label="Confirmar que não é um robô"
        >
          <div className="flex items-center gap-3.5">
            {/* Custom Checkbox Box */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                isChecked
                  ? 'bg-emerald-500 border-emerald-500 text-white scale-105'
                  : isProcessing
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-zinc-600 bg-zinc-900 hover:border-zinc-400'
              }`}
            >
              {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
              {isProcessing && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
            </div>

            <span className="text-xs sm:text-sm font-bold text-zinc-200">
              Não sou um robô
            </span>
          </div>

          {/* Security Branding */}
          <div className="flex flex-col items-end opacity-70">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
              Protegido
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span>Acesso criptografado • Validade 24h</span>
        </div>
      </div>
    </div>
  );
};
