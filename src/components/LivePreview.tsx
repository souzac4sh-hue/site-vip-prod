import React, { useState, useEffect, useRef } from 'react';
import { Lock, VolumeX, Volume2, Play, Users } from 'lucide-react';
import { CreatorProfile, StreamStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface LivePreviewProps {
  creator: CreatorProfile;
  status: StreamStatus;
  scheduledAt?: string;
  onlineViewers?: number;
  onUnlockClick: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  creator,
  status,
  onlineViewers = 38,
  onUnlockClick,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [viewers, setViewers] = useState<number>(() => onlineViewers || 38);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const isVideo = creator.previewMediaType === 'video' && Boolean(creator.previewVideoUrl);

  const blurClass =
    creator.previewBlur === 'light'
      ? 'blur-sm'
      : creator.previewBlur === 'heavy'
      ? 'blur-xl'
      : 'blur-md';

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
    const purchaseEl = document.getElementById('purchase-card-container');
    if (purchaseEl) {
      purchaseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onUnlockClick();
  };

  return (
    <div
      onClick={handlePlayerClick}
      className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.8)] group cursor-pointer select-none"
      title="Clique para desbloquear a transmissão"
    >
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
          className={`absolute inset-0 w-full h-full object-cover object-center filter ${blurClass} scale-[1.02] brightness-[0.75] transition-transform duration-700 group-hover:scale-105`}
        />
      ) : (
        <img
          src={creator.coverUrl || '/creator/cover.jpg'}
          alt="Transmissão Privada"
          className={`absolute inset-0 w-full h-full object-cover object-center filter ${blurClass} scale-[1.01] brightness-[0.75] transition-transform duration-700 group-hover:scale-105`}
        />
      )}

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 pointer-events-none" />

      {/* Top Controls Overlay */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <StatusBadge status={status} />

          {status === 'live' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold">
              <Users className="w-3 h-3 text-rose-400" />
              <span className="font-tabular">
                {viewers.toLocaleString('pt-BR')} online
              </span>
            </div>
          )}
        </div>

        {/* Audio Toggle Button */}
        {isVideo ? (
          <button
            type="button"
            onClick={toggleAudio}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black active:scale-95 border border-white/20 text-white text-xs font-semibold transition-all backdrop-blur-md shadow-lg"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] text-zinc-200">Ativar Áudio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-[11px] text-rose-400 font-bold">Áudio Ativo</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-zinc-300 text-[11px] backdrop-blur-sm">
            <VolumeX className="w-3 h-3 text-zinc-400" />
            <span className="hidden xs:inline">Áudio Bloqueado</span>
          </div>
        )}
      </div>

      {/* Center Cinematic Lock Focus */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 pointer-events-none">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)] mb-3 group-hover:scale-110 transition-transform">
          {isVideo ? (
            <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400" />
          ) : (
            <Play className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400 fill-rose-400 ml-1" />
          )}
        </div>

        <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
          {isVideo ? 'Transmissão Privada ao Vivo' : 'Live Exclusiva de ' + creator.name}
        </h3>

        <p className="mt-1 text-xs sm:text-sm text-zinc-200 max-w-sm drop-shadow font-medium">
          Acesso liberado a todas as transmissões por 30 dias + WhatsApp direto.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnlockClick();
          }}
          className="mt-4 pointer-events-auto px-7 py-3 rounded-xl btn-primary font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-[0_4px_25px_rgba(225,29,72,0.4)]"
        >
          <Lock className="w-4 h-4 text-white" />
          <span>Desbloquear Acesso — R$ 9,90</span>
        </button>
      </div>

      {/* Bottom Stream Info Overlay */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-10 pointer-events-none">
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
          <span className="text-[11px] font-bold text-zinc-200 bg-black/60 px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
            1080p 60FPS
          </span>
        </div>
      </div>
    </div>
  );
};
