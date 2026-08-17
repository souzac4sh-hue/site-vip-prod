import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface AgeGateProps {
  isOpen: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ isOpen, onConfirm, onReject }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#101010] border border-white/10 rounded-2xl p-7 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-500 shadow-[0_0_25px_rgba(255,41,92,0.3)]">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">
          Conteúdo para maiores de 18 anos
        </h3>

        <p className="text-xs text-zinc-400 mt-2 mb-6 leading-relaxed">
          Ao continuar, você declara e confirma sob as penas da lei que possui 18 anos ou mais e concorda em acessar este conteúdo privado.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand"
          >
            Tenho 18 anos ou mais
          </button>

          <button
            onClick={onReject}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
