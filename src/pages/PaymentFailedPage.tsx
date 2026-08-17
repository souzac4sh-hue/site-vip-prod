import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PaymentFailedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 flex items-center justify-center py-12">
        <div className="w-full bg-[#101010] border border-white/10 rounded-3xl p-7 sm:p-8 text-center shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Pagamento não concluído
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 mt-2 mb-6 leading-relaxed">
            Não foi possível identificar a confirmação do pagamento a tempo ou o código PIX expirou.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Gerar Novo Código PIX</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Página Inicial</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
