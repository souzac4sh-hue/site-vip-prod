import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { api } from '../utils/api';
import { CreatorProfile, PaymentTransaction, ProductType } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: CreatorProfile;
  price: number;
  product?: ProductType;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  price = 9.90,
  product = 'live_access',
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<Partial<PaymentTransaction> | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 mins
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [simulating, setSimulating] = useState<boolean>(false);

  // Generate PIX Charge when opened
  useEffect(() => {
    if (!isOpen) {
      setPaymentData(null);
      setErrorMessage('');
      return;
    }

    let isSubscribed = true;

    async function initPixCharge() {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await api.createPixCharge({
          product,
          customerName: 'Apoiador VIP',
          customerEmail: 'vip@privatelive.com',
          turnstileToken: 'turnstile_test_token_ok',
        });

        if (isSubscribed) {
          if (res.success && res.payment) {
            setPaymentData(res.payment);
            setTimeLeft(1800);
          } else {
            setErrorMessage(res.message || 'Erro ao gerar o QR Code PIX.');
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          setErrorMessage(err.message || 'Erro de conexão ao gerar PIX.');
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    initPixCharge();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, product]);

  // Polling Status every 2.5s
  useEffect(() => {
    if (!isOpen || !paymentData?.id) return;

    let isPolling = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.checkPixStatus(paymentData.id!);
        if (isPolling && res.success && res.isAuthorized) {
          clearInterval(interval);
          window.location.href = '/payment/success?product=' + (res.product || 'live_access');
        }
      } catch (err) {}
    }, 2500);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [isOpen, paymentData?.id]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const handleCopyPix = () => {
    if (paymentData?.pixCopiaCola) {
      navigator.clipboard.writeText(paymentData.pixCopiaCola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentData?.id || simulating) return;
    setSimulating(true);
    try {
      const res = await api.simulatePayment(paymentData.id);
      if (res.success) {
        window.location.href = '/payment/success?product=' + (res.product || 'live_access');
      }
    } catch (err) {
      alert('Erro na simulação');
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0c0c10] border border-white/[0.09] rounded-2xl p-6 text-center shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#181820] hover:bg-[#22222c] text-zinc-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold tracking-wider uppercase mb-2 font-mono">
            <Lock className="w-3 h-3" />
            <span>Acesso VIP 30 Dias + WhatsApp</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Pagamento Instantâneo via PIX
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Valor de <strong className="text-white font-tabular">{formattedPrice}</strong> • Entrada imediata na sala
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">Gerando QR Code PIX seguro...</p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !loading && (
          <div className="py-6 space-y-3">
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
            >
              Fechar e Tentar Novamente
            </button>
          </div>
        )}

        {/* Active PIX Checkout */}
        {!loading && !errorMessage && paymentData && (
          <div className="space-y-3.5">
            {/* QR Code Container */}
            <div className="relative mx-auto w-44 h-44 bg-white p-3 rounded-xl flex items-center justify-center shadow-md">
              {paymentData.pixCopiaCola ? (
                <QRCodeSVG
                  value={paymentData.pixCopiaCola}
                  size={152}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                  QR Code indisponível
                </div>
              )}
            </div>

            {/* Timer countdown */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111116] border border-white/5 text-[11px] text-zinc-300 font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Expira em: <strong className="font-tabular">{formattedTime}</strong></span>
            </div>

            {/* PIX Copia e Cola */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 text-center">
                Ou copie o código abaixo:
              </label>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={paymentData.pixCopiaCola || ''}
                  className="w-full bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-400 font-mono pr-24 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="absolute right-1.5 py-1 px-2.5 rounded-lg btn-primary text-white text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Realtime Waiting Indicator */}
            <div className="p-3 rounded-xl bg-[#08080c] border border-white/5 flex items-center justify-center gap-2 text-xs text-zinc-300">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Aguardando confirmação bancária...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
