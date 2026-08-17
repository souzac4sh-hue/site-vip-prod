import React from 'react';
import { Video, MessageCircle, ShieldCheck, Zap, Sparkles, Clock, Lock, Star } from 'lucide-react';
import { BenefitItem } from '../types';

interface SocialProofPillarsProps {
  benefits?: BenefitItem[];
}

const iconMap: Record<string, any> = {
  Video,
  MessageCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  Lock,
  Star,
};

export const SocialProofPillars: React.FC<SocialProofPillarsProps> = ({ benefits }) => {
  const defaultBenefits = [
    {
      icon: 'Video',
      title: '30 Dias de Lives VIP',
      description: 'Assista a todas as transmissões ao vivo da criadora durante um mês completo.',
    },
    {
      icon: 'MessageCircle',
      title: 'WhatsApp Pessoal Incluso',
      description: 'Receba o contato direto da modelo para conversar no privado.',
    },
    {
      icon: 'Zap',
      title: 'Liberação Imediata',
      description: 'Pagou o PIX, confirmou e acessou na mesma hora sem esperar nada.',
    },
    {
      icon: 'ShieldCheck',
      title: 'Garantia Incondicional',
      description: 'Se você não gostar do conteúdo, devolvemos 100% do seu valor.',
    },
  ];

  const items = benefits && benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <section className="py-10 sm:py-14 border-t border-white/[0.06]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const Icon = iconMap[item.icon] || Video;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0b0b0f] border border-white/[0.06] hover:border-white/[0.14] transition-all text-left group shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-[#121218] border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white mb-1 leading-snug">
                {item.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
