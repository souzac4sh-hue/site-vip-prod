import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface StickyCTAProps {
  price: number;
  currency: string;
  buttonText: string;
  onUnlockClick: () => void;
}

export const StickyCTA: React.FC<StickyCTAProps> = ({
  price = 9.90,
  currency = 'BRL',
  onUnlockClick,
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(price);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:p-3 bg-[#060608]/95 backdrop-blur-md border-t border-white/[0.08] lg:hidden animate-slide-up shadow-[0_-4px_20px_rgba(0,0,0,0.8)] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 px-1">
        <div>
          <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
            Acesso 30 Dias
          </span>
          <span className="text-base font-black text-white font-tabular">{formattedPrice}</span>
        </div>

        <button
          type="button"
          onClick={onUnlockClick}
          className="py-2.5 px-5 rounded-lg btn-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Liberar Acesso</span>
        </button>
      </div>
    </div>
  );
};
