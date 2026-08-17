import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#060606] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Rights */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-brand-500"></div>
          <span className="font-semibold text-zinc-400">PRIVATE LIVE</span>
          <span>•</span>
          <span>© {currentYear} Todos os direitos reservados.</span>
        </div>

        {/* Legal & Navigation Links */}
        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <Link to="/termos" className="hover:text-white transition-colors">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="hover:text-white transition-colors">
            Privacidade & LGPD
          </Link>
          <Link to="/admin" className="hover:text-brand-400 transition-colors flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};
