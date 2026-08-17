import React from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const scrollToOffer = () => {
    const el = document.getElementById('purchase-card-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-[#060608]/90 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-15 flex items-center justify-between">
        {/* Left: Minimal Creator Live Brand */}
        <Link to="/" className="flex items-center gap-2 group select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span className="font-black text-sm tracking-wider text-white uppercase">
            PRIVATELIVE
          </span>
        </Link>

        {/* Right: Natural Creator Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to="/whatsapp"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors border border-emerald-500/20"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">WhatsApp VIP</span>
            <span className="xs:hidden">WhatsApp</span>
          </Link>

          <button
            type="button"
            onClick={scrollToOffer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-primary text-xs font-bold uppercase tracking-wider"
          >
            <Lock className="w-3 h-3" />
            <span>Entrar na Live</span>
          </button>
        </div>
      </div>
    </header>
  );
};
