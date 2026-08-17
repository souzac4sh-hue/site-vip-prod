import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Info, Shield, Sparkles, Users, Loader2, AlertCircle } from 'lucide-react';
import { CreatorProfile, ChatMessage as ChatMessageType } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  creator: CreatorProfile;
  title: string;
  description: string;
  userDisplayName?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  creator,
  title,
  description,
  userDisplayName = 'VIP',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'about'>('chat');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [sending, setSending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [errorToast, setErrorToast] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll Chat Messages and Presence every 2.5s
  useEffect(() => {
    let isMounted = true;

    const fetchChat = async () => {
      try {
        const res = await fetch('/api/chat/messages');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success) {
            setMessages(data.messages || []);
            setOnlineCount(data.onlineCount || 1);
          }
        }
      } catch (err) {}
    };

    fetchChat();
    const interval = setInterval(fetchChat, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending || cooldown > 0) return;

    setSending(true);
    setErrorToast('');

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputMessage.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInputMessage('');
        setCooldown(3); // 3s cooldown
      } else {
        setErrorToast(data.error || 'Erro ao enviar');
        setTimeout(() => setErrorToast(''), 4000);
      }
    } catch (err) {
      setErrorToast('Erro de conexão ao enviar mensagem');
      setTimeout(() => setErrorToast(''), 4000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#101010] border border-white/10 rounded-2xl overflow-hidden shadow-card">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-zinc-950/80 px-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'chat'
                ? 'border-brand-500 text-white bg-white/[0.02]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'about'
                ? 'border-brand-500 text-white bg-white/[0.02]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Sobre</span>
          </button>
        </div>

        {/* Real Online Count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-[11px] text-zinc-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{onlineCount} {onlineCount === 1 ? 'online' : 'online'}</span>
        </div>
      </div>

      {/* Tab 1: Live Chat Feed */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-[380px] sm:min-h-[460px]">
          {/* Messages list */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Sala Privada Conectada</h4>
                <p className="text-xs max-w-xs text-zinc-400 leading-relaxed">
                  Seja uma das primeiras pessoas a enviar uma mensagem para {creator.name}.
                </p>
              </div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error toast if rate limit exceeded */}
          {errorToast && (
            <div className="px-3 py-1.5 bg-rose-950/80 border-t border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errorToast}</span>
            </div>
          )}

          {/* Sender Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.08] bg-zinc-950/90">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 px-1 font-mono">
              <span>Conectado como: <strong className="text-brand-400">{userDisplayName}</strong></span>
              <span>{200 - inputMessage.length} caracteres</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={cooldown > 0 ? `Aguarde ${cooldown}s...` : 'Enviar mensagem no chat...'}
                maxLength={200}
                disabled={cooldown > 0}
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-brand-500/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending || cooldown > 0}
                className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white transition-all active:scale-95 flex items-center justify-center min-w-[38px]"
                aria-label="Enviar mensagem"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: About Creator */}
      {activeTab === 'about' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-left">
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.08]">
            <img
              src={creator.avatarUrl || '/creator/avatar.jpg'}
              alt={creator.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/40"
            />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{creator.name}</h3>
              <p className="text-xs text-brand-400 font-mono">@{creator.username}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Sobre a Criadora
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {creator.bio || 'Criadora de conteúdo exclusivo e modelo oficial.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Transmissão
            </h4>
            <h5 className="text-sm font-semibold text-white mb-1">{title}</h5>
            <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1.5 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transmissão Oficial Criptografada</span>
            </div>
            <p className="text-[11px]">
              O download ou gravação de tela não autorizada é proibido sob os Termos de Serviço.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
