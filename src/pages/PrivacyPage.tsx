import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Lock } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-brand-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Política de Privacidade & LGPD</h1>
            <p className="text-xs text-zinc-400">Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-[#101010] p-6 sm:p-8 rounded-2xl border border-white/10">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Coleta Mínima de Dados</h2>
            <p>
              Prezamos pela sua privacidade. Coletamos estritamente os dados essenciais para o processamento do pagamento via PIX e a emissão do token seguro de sessão no seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Uso de Cookies e Sessão</h2>
            <p>
              Utilizamos cookies técnicos <code className="text-brand-400">HttpOnly</code> estritamente necessários para autenticar seu acesso à sala de transmissão. Não utilizamos rastreadores de terceiros invasivos ou venda de dados para anunciantes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Processamento de Pagamento</h2>
            <p>
              As transações financeiras são processadas através da instituição financeira autorizada (NexusPag). Não armazenamos senhas bancárias ou dados cadastrais confidenciais em nossos servidores.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. Seus Direitos (LGPD)</h2>
            <p>
              Você pode solicitar a qualquer momento a confirmação da existência de tratamento e a eliminação de dados de transação após o término da validade do acesso contratado.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
