import React from 'react';
import { CreditCard, Unlock, MessageCircle } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: CreditCard,
      title: 'Pagamento de R$ 9,90',
      description: 'Pagamento único via PIX com aprovação instantânea em segundos.',
    },
    {
      step: '02',
      icon: Unlock,
      title: 'Acesso VIP por 30 Dias',
      description: 'Sua entrada é liberada no navegador na hora sem necessidade de baixar apps.',
    },
    {
      step: '03',
      icon: MessageCircle,
      title: 'WhatsApp Liberado',
      description: 'Assista a transmissão e converse diretamente no WhatsApp pessoal da modelo.',
    },
  ];

  return (
    <section className="py-10 sm:py-14 border-t border-white/[0.06] text-center">
      <div className="max-w-xl mx-auto mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Como Funciona o Acesso
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Processo simplificado e 100% automático em 3 etapas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.step}
              className="relative p-5 rounded-2xl bg-[#0b0b0f] border border-white/[0.06] text-left hover:border-white/[0.14] transition-all shadow-sm"
            >
              <span className="text-2xl font-black text-white/[0.07] font-mono absolute top-4 right-4">
                {st.step}
              </span>

              <div className="w-9 h-9 rounded-xl bg-[#121218] border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3.5">
                <Icon className="w-4 h-4" />
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white mb-1 leading-snug">
                {st.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed font-normal">
                {st.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
