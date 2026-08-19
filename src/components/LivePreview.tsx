import React, { useState, useEffect, useRef } from 'react';
import { Lock, VolumeX, Volume2, Play, Users, Clock, Sparkles } from 'lucide-react';
import { CreatorProfile, StreamStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { api } from '../utils/api';

interface LivePreviewProps {
  creator: CreatorProfile;
  status: StreamStatus;
  scheduledAt?: string;
  onlineViewers?: number;
  onUnlockClick: () => void;
}

const TEASER_DURATION = 15; // 15 seconds teaser for first-time visitors

export const LivePreview: React.FC<LivePreviewProps> = ({
  creator,
  status,
  onlineViewers = 38,
  onUnlockClick,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [viewers, setViewers] = useState<number>(() => onlineViewers || 38);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if visitor has already consumed their 15-second teaser
  const [isTeaserActive, setIsTeaserActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pl_teaser_consumed') !== 'true';
    } catch {
      return true;
    }
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(TEASER_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setViewers(onlineViewers || 38);
  }, [onlineViewers]);

  // Natural live fluctuation between 30 and 100 viewers
  useEffect(() => {
    if (status !== 'live') return;

    const interval = setInterval(() => {
      setViewers((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, +1, +2
        const next = prev + delta;
        if (next < 30) return 30 + Math.floor(Math.random() * 6);
        if (next > 100) return 100 - Math.floor(Math.random() * 6);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [status]);

  // 15-Second Teaser Countdown for First-Time Visitors
  useEffect(() => {
    if (!isTeaserActive) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          try {
            localStorage.setItem('pl_teaser_consumed', 'true');
          } catch {}
          setIsTeaserActive(false);
          setIsMuted(true);
          if (videoRef.current) {
            videoRef.current.muted = true;
          }
          api.trackEvent('teaser_ended' as any, 'live_access');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTeaserActive]);

  const isVideo = creator.previewMediaType === 'video' && Boolean(creator.previewVideoUrl);

  const blurClass = isTeaserActive
    ? 'blur-0 brightness-100'
    : creator.previewBlur === 'light'
    ? 'blur-sm brightness-[0.6]'
    : creator.previewBlur === 'heavy'
    ? 'blur-xl brightness-[0.5]'
    : 'blur-md brightness-[0.55]';

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handlePlayerClick = () => {
    if (!isTeaserActive) {
      const purchaseEl = document.getElementById('purchase-card-container');
      if (purchaseEl) {
        purchaseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      onUnlockClick();
    }
  };

  const progressPercent = (secondsLeft / TEASER_DURATION) * 100;

  return (
    <div
      onClick={handlePlayerClick}
      className={`relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.8)] group select-none transition-all ${
        !isTeaserActive ? 'cursor-pointer' : ''
      }`}
      title={!isTeaserActive ? 'Clique para desbloquear a transmissão completa' : 'Prévia da transmissão ao vivo'}
    >
      {/* 15s Countdown Progress Bar at the top */}
      {isTeaserActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 transition-all duration-1000 ease-linear shadow-[0_0_12px_#FF295C]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Media Feed Layer */}
      {isVideo ? (
        <video
          ref={videoRef}
          src={creator.previewVideoUrl}
          poster={creator.coverUrl || '/creator/cover.jpg'}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className={`absolute inset-0 w-full h-full object-cover object-center filter ${blurClass} scale-[1.02] transition-all duration-700`}
        />
      ) : (
        <img
          src={creator.coverUrl || '/creator/cover.jpg'}
          alt="Transmissão Privada"
          className={`absolute inset-0 w-full h-full object-cover object-center filter ${blurClass} scale-[1.01] transition-all duration-700`}
        />
      )}

      {/* Cinematic Vignette */}
      <div
        className={`absolute inset-0 bg-gradient-to-t pointer-events-none transition-opacity duration-700 ${
          isTeaserActive
            ? 'from-black/50 via-transparent to-black/30'
            : 'from-black via-black/40 to-black/70'
        }`}
      />

      {/* Top Controls Overlay */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <StatusBadge status={status} />

          {status === 'live' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 shadow">
              <Users className="w-3 h-3 text-rose-400" />
              <span className="font-tabular">
                {viewers.toLocaleString('pt-BR')} online
              </span>
            </div>
          )}

          {/* 15s Countdown Badge during active teaser */}
          {isTeaserActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-black tracking-wide uppercase shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse border border-rose-400/40 backdrop-blur-sm">
              <Clock className="w-3 h-3" />
              <span>Prévia: {secondsLeft}s</span>
            </div>
          )}
        </div>

        {/* Audio Toggle Button */}
        {isVideo && (
          <button
            type="button"
            onClick={toggleAudio}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black active:scale-95 border border-white/20 text-white text-xs font-semibold transition-all backdrop-blur-md shadow-lg"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] text-zinc-200">Ativar Som</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-[11px] text-rose-400 font-bold">Som Ativo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Center Cinematic Paywall Overlay (Appears when 15s teaser ends or for returning visitors) */}
      {!isTeaserActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 pointer-events-none animate-fade-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/85 border border-rose-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_35px_rgba(244,63,94,0.4)] mb-3 group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400 animate-pulse" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-2 font-mono">
            <Sparkles className="w-3 h-3" />
            <span>Prévia Encerrada</span>
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
            Desbloquear Transmissão Completa
          </h3>

          <p className="mt-1 text-xs sm:text-sm text-zinc-200 max-w-sm drop-shadow font-medium">
            30 dias de acesso liberado em 1080p 60FPS + WhatsApp VIP direto com a {creator.name}.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnlockClick();
            }}
            className="mt-4 pointer-events-auto px-7 py-3.5 rounded-xl btn-primary font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-[0_4px_30px_rgba(225,29,72,0.5)] active:scale-95 transition-all"
          >
            <Lock className="w-4 h-4 text-white" />
            <span>Desbloquear Acesso — R$ 9,90</span>
          </button>
        </div>
      )}

      {/* Bottom Stream Info Overlay */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={creator.avatarUrl || '/creator/avatar.jpg'}
              alt={creator.name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-rose-500 shadow-md"
            />
            {status === 'live' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-black" />
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow">
              {creator.name}
            </h4>
            <p className="text-[11px] text-zinc-300 font-mono drop-shadow">
              @{creator.username}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-zinc-200 bg-black/70 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md">
            1080p 60FPS
          </span>
        </div>
      </div>
    </div>
  );
};
