import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Shield } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-brand-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Termos de Serviço</h1>
            <p className="text-xs text-zinc-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-[#101010] p-6 sm:p-8 rounded-2xl border border-white/10">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao adquirir o acesso à transmissão privada nesta plataforma, você declara ter no mínimo 18 anos de idade e concordar integralmente com estes Termos de Uso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Direitos Autorais e Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo em vídeo, áudio, imagem e texto transmitido nesta plataforma é de propriedade exclusiva da criadora. É estritamente proibido gravar, capturar a tela (screen capture), reproduzir, redistribuir ou compartilhar qualquer material sob pena de responsabilização civil e criminal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Acesso Individual e Inviolabilidade de Sessão</h2>
            <p>
              O ingresso concede acesso pessoal, intransferível e individual através do dispositivo utilizado no momento da liberação. O compartilhamento de tokens ou tentativas de burla técnica resultarão na revogação imediata da sessão sem direito a reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. Política de Cancelamento e Reembolso</h2>
            <p>
              Tratando-se de serviço digital de fruição imediata e individual, a liberação da sala é concluída no instante da confirmação do pagamento. Em caso de falhas técnicas comprovadas no servidor que impeçam a transmissão, o suporte prestará assistência direta.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};
