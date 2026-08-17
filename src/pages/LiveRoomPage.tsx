import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Radio, Clock, ShieldCheck } from 'lucide-react';
import { AccessGuard } from '../components/AccessGuard';
import { LivePlayer } from '../components/LivePlayer';
import { ChatPanel } from '../components/ChatPanel';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../utils/api';
import { AccessVerifyResponse } from '../types';

export const LiveRoomPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    navigate('/', { replace: true });
  };

  return (
    <AccessGuard>
      {(data: AccessVerifyResponse) => {
        const streamData = data.streamData!;
        const creator = streamData.creator;
        const userDisplayName = data.displayName || 'VIP';

        return (
          <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between selection:bg-brand-500 selection:text-white">
            {/* Live Room Top Bar */}
            <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0c0c0d]/90 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Creator Identity */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={creator.avatarUrl || '/creator/avatar.jpg'}
                      alt={creator.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/50"
                    />
                    {streamData.status === 'live' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-black"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm font-bold text-white leading-tight">
                        {creator.name}
                      </h1>
                      <StatusBadge status={streamData.status} />
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      @{creator.username}
                    </p>
                  </div>
                </div>

                {/* Right Bar Controls */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs text-zinc-300 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conectado como: <strong className="text-brand-400">{userDisplayName}</strong></span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="hidden sm:inline">Sair da Sala</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Live Suite Layout */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left (Large): Player & Stream Info */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <LivePlayer
                    streamUrl={streamData.streamUrl}
                    status={streamData.status}
                    title={streamData.title}
                    creator={creator}
                  />

                  {/* Title & Metadata */}
                  <div className="p-5 rounded-2xl glass-card border border-white/[0.06] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-mono uppercase tracking-widest text-brand-400">
                          Transmissão Privada Oficial
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        Protocolo HLS 1080p 60FPS
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {streamData.title}
                    </h2>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {creator.bio}
                    </p>
                  </div>
                </div>

                {/* Right: Live Room Interaction Panel (Chat & About) */}
                <div className="lg:col-span-4 sticky top-20">
                  <ChatPanel
                    creator={creator}
                    title={streamData.title}
                    description="Transmissão exclusiva para apoiadores da sala privada."
                    userDisplayName={userDisplayName}
                  />
                </div>
              </div>
            </main>

            {/* Subfooter */}
            <footer className="w-full border-t border-white/[0.06] bg-[#060606] py-4 text-center text-xs text-zinc-400">
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[11px]">
                <span>PRIVATE LIVE • Sala de Transmissão Segura</span>
                <span>ID: {data.expiresAt ? `Expira: ${new Date(data.expiresAt).toLocaleDateString()} ${new Date(data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sessão Individual'}</span>
              </div>
            </footer>
          </div>
        );
      }}
    </AccessGuard>
  );
};
