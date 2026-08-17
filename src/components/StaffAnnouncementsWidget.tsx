import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StaffAnnouncement, AnnouncementConfig } from '../types';

function getRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  return 'hoje';
}

export const StaffAnnouncementsWidget: React.FC = () => {
  const [announcements, setAnnouncements] = useState<StaffAnnouncement[]>([]);
  const [config, setConfig] = useState<AnnouncementConfig>({
    enabled: true,
    isPaused: false,
    intervalSeconds: 6,
    durationSeconds: 5,
    loop: true,
  });
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.announcements && data.announcements.length > 0) {
            setAnnouncements(data.announcements);
            if (data.config) setConfig(data.config);
          }
        }
      } catch (e) {}
    }

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config.enabled || config.isPaused || announcements.length === 0 || isDismissed) {
      setIsVisible(false);
      return;
    }

    let showTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    // Show current notice
    setIsVisible(true);

    // Hide after durationSeconds
    hideTimer = setTimeout(() => {
      setIsVisible(false);

      // Wait intervalSeconds then advance to next notice
      showTimer = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev + 1 < announcements.length) {
            return prev + 1;
          }
          return config.loop ? 0 : prev;
        });
      }, (config.intervalSeconds || 6) * 1000);
    }, (config.durationSeconds || 5) * 1000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, [currentIndex, announcements, config, isDismissed]);

  if (!config.enabled || config.isPaused || announcements.length === 0 || isDismissed) {
    return null;
  }

  const current = announcements[currentIndex];
  if (!current) return null;

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-[320px] sm:max-w-sm w-full transition-all duration-500 transform ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="relative bg-[#0c0c0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-start gap-3">
        {/* Author Avatar or Initial */}
        <div className="relative flex-shrink-0">
          {current.avatarUrl ? (
            <img
              src={current.avatarUrl}
              alt={current.authorName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/40"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
              {current.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content (Clean without role badge) */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-white truncate max-w-[160px]">
              {current.authorName}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">
              {getRelativeTime(current.createdAt)}
            </span>
          </div>

          <p className="text-xs text-zinc-200 leading-snug break-words">
            {current.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Fechar aviso"
          aria-label="Fechar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
