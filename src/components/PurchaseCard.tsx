import React from 'react';
import { Lock, ArrowRight, Check, MessageCircle, Video, ShieldCheck } from 'lucide-react';
import { CreatorProfile, StreamStatus } from '../types';

interface PurchaseCardProps {
  creator: CreatorProfile;
  price: number;
  currency: string;
  durationHours: number;
  status: StreamStatus;
  requireAgeConfirmation: boolean;
  onProceedToCheckout: () => void;
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({
  creator,
  price = 9.90,
  currency = 'BRL',
  onProceedToCheckout,
}) => {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(price);

  return (
    <div className="relative rounded-2xl bg-[#0c0c10] border border-white/[0.09] p-5 sm:p-6 text-left shadow-[0_16px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-all">
      {/* Creator Pass Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
        <img
          src={creator.avatarUrl || '/creator/avatar.jpg'}
          alt={creator.name}
          className="w-12 h-12 rounded-full object-cover border border-rose-500/50 shadow-md flex-shrink-0"
        />
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block font-mono">
            Passe VIP Exclusivo
          </span>
          <h3 className="text-sm sm:text-base font-black text-white truncate">
            {creator.name}
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono">
            @{creator.username}
          </p>
        </div>
      </div>

      {/* Access Highlights */}
      <div className="py-4 space-y-2.5">
        <div className="flex items-start gap-2.5 text-xs text-zinc-200">
          <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Video className="w-3 h-3" />
          </div>
          <div>
            <strong className="text-white block leading-tight">30 Dias de Acesso Total</strong>
            <span className="text-[11px] text-zinc-400">Assista a todas as transmissões ao vivo por um mês.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-zinc-200">
          <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageCircle className="w-3 h-3" />
          </div>
          <div>
            <strong className="text-white block leading-tight">WhatsApp Pessoal Incluso</strong>
            <span className="text-[11px] text-zinc-400">Contato direto no privado liberado na hora.</span>
          </div>
        </div>
      </div>

      {/* Simple Price Showcase */}
      <div className="p-3.5 rounded-xl bg-[#111116] border border-white/[0.06] mb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-400 block font-mono uppercase tracking-wider">
            Pagamento Único
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-tabular">
            {formattedPrice}
          </span>
        </div>

        <span className="px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 text-[11px] font-black uppercase tracking-wider font-mono">
          30 Dias
        </span>
      </div>

      {/* Main Unlock CTA Button */}
      <button
        type="button"
        onClick={onProceedToCheckout}
        className="w-full py-3.5 px-5 rounded-xl btn-primary font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(225,29,72,0.4)]"
      >
        <Lock className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        <span>Desbloquear Meu Acesso</span>
        <ArrowRight className="w-4 h-4 text-white" />
      </button>

      {/* Reassurance */}
      <p className="mt-3 text-[11px] text-zinc-400 text-center font-medium">
        Liberação instantânea via PIX • Entrada imediata
      </p>
    </div>
  );
};
