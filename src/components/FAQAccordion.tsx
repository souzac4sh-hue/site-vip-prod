import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQItem } from '../types';

interface FAQAccordionProps {
  durationHours?: number;
  faqs?: FAQItem[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ durationHours = 720, faqs: customFaqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const defaultFaqs: FAQItem[] = [
    {
      question: 'O que está incluso no valor de R$ 9,90?',
      answer: 'Você ganha acesso completo a todas as transmissões privadas da criadora durante 30 dias (720 horas) e recebe o link direto do WhatsApp VIP para conversar no privado.',
    },
    {
      question: 'Como funciona a garantia de 100% de reembolso?',
      answer: 'Se você entrar na sala e achar que o conteúdo não valeu a pena, basta solicitar pelo WhatsApp de suporte que devolvemos 100% do valor pago via PIX imediatamente.',
    },
    {
      question: 'Como recebo o acesso ao WhatsApp da modelo?',
      answer: 'Imediatamente após a aprovação do PIX, o botão de acesso direto ao WhatsApp VIP é liberado na tela para você iniciar a conversa.',
    },
    {
      question: 'Preciso criar conta ou digitar senha?',
      answer: 'Não. O acesso é liberado instantaneamente e vinculado de forma segura ao seu dispositivo sem cadastros longos.',
    },
    {
      question: 'Funciona perfeitamente no celular?',
      answer: 'Sim! A plataforma foi desenvolvida mobile-first e roda com imagem 1080p tanto em iPhone quanto Android.',
    },
    {
      question: 'Por quanto tempo tenho acesso às lives?',
      answer: `Seu acesso permanece liberado por 30 dias corridos (${durationHours} horas) a partir da data de confirmação do pagamento.`,
    },
  ];

  const items = customFaqs && customFaqs.length > 0 ? customFaqs : defaultFaqs;

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-10 sm:py-14 border-t border-white/[0.06]">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase block mb-1">
            Dúvidas Frequentes
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Perguntas & Respostas
          </h2>
        </div>

        <div className="space-y-2.5">
          {items.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#0b0b0f] border border-white/[0.06] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-3 select-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-rose-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-4.5 sm:pb-4.5 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04] animate-fade-in font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
