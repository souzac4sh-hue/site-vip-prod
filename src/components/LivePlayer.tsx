import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Loader2,
  Calendar,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { StreamStatus, CreatorProfile } from '../types';

interface LivePlayerProps {
  streamUrl: string;
  status: StreamStatus;
  scheduledAt?: string;
  creator: CreatorProfile;
  title: string;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  streamUrl,
  status,
  scheduledAt,
  creator,
  title,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown for scheduled state
  const [countdown, setCountdown] = useState<string>('00:00:00');

  useEffect(() => {
    if (status !== 'scheduled' || !scheduledAt) return;

    const updateCountdown = () => {
      const target = new Date(scheduledAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('Começando agora');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, scheduledAt]);

  // HLS stream setup
  useEffect(() => {
    if (status !== 'live' || !streamUrl) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay blocked: user can click play
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
    } else {
      // Direct MP4 / Video fallback
      video.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, status]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const retryStream = () => {
    setHasError(false);
    setIsLoading(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    // Re-trigger reload
    const video = videoRef.current;
    if (video && streamUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => {});
        });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none group"
    >
      {/* 1. Live State Video Element */}
      {status === 'live' && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onClick={togglePlay}
        />
      )}

      {/* 2. Scheduled Room Overlay */}
      {status === 'scheduled' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 z-20">
          <img
            src={creator.coverUrl || '/creator/cover.jpg'}
            alt="Teaser"
            className="absolute inset-0 w-full h-full object-cover filter blur-sm brightness-40"
          />
          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-500/30">
              <Calendar className="w-3.5 h-3.5" />
              Sala de Espera
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">{title}</h2>
            <p className="text-xs text-zinc-300 mb-6">
              A transmissão começará no horário programado. Mantenha esta página aberta.
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md inline-block">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Começa em</span>
              <span className="font-mono text-3xl font-black text-white tracking-widest">{countdown}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ended State Overlay */}
      {status === 'ended' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 z-20">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3">
            <Radio className="w-6 h-6 text-zinc-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Esta transmissão foi encerrada</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            Obrigado pela sua presença! Fique atento às próximas lives de {creator.name}.
          </p>
        </div>
      )}

      {/* 4. Offline State Overlay */}
      {status === 'offline' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 z-20">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3">
            <Radio className="w-6 h-6 text-zinc-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Sala aguardando sinal</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            A criadora está preparando os equipamentos de transmissão. O sinal será restabelecido em instantes.
          </p>
        </div>
      )}

      {/* Loading Spinner */}
      {status === 'live' && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
      )}

      {/* Error / Reconnect Overlay */}
      {status === 'live' && hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/85 z-20">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-white mb-1">Sinal momentaneamente instável</p>
          <p className="text-xs text-zinc-400 mb-4">Tentando reconectar ao streaming...</p>
          <button
            onClick={retryStream}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reconectar Agora</span>
          </button>
        </div>
      )}

      {/* Custom Video Controls (Live State) */}
      {status === 'live' && (
        <div
          className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between gap-4 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            {/* Live Indicator Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[11px] font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
              <span>AO VIVO</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-300 hidden sm:inline-block">1080p 60FPS</span>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Tela cheia"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
