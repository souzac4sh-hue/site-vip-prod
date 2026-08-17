import React, { useState, useEffect, useRef } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { StaffAnnouncement, AnnouncementConfig } from '../types';

interface DisplayAnnouncement extends StaffAnnouncement {
  displayTime: string;
  isNew?: boolean;
}

export const LiveAnnouncementsFeed: React.FC = () => {
  const [allAnnouncements, setAllAnnouncements] = useState<StaffAnnouncement[]>([]);
  const [feed, setFeed] = useState<DisplayAnnouncement[]>([]);
  const [config, setConfig] = useState<AnnouncementConfig>({
    enabled: true,
    isPaused: false,
    intervalSeconds: 8,
    durationSeconds: 5,
    loop: true,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef<number>(0);

  // Helper: format local browser time (e.g. "14:25")
  const getLocalBrowserTime = (offsetMinutes = 0): string => {
    const now = new Date(Date.now() - offsetMinutes * 60 * 1000);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 1. Fetch announcements and config from API
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.announcements && data.announcements.length > 0) {
            setAllAnnouncements(data.announcements);
            if (data.config) {
              setConfig(data.config);
            }

            // Start with the initial 1 or 2 messages with realistic prior times
            const initialList: DisplayAnnouncement[] = [];
            if (data.announcements.length > 0) {
              initialList.push({
                ...data.announcements[0],
                displayTime: getLocalBrowserTime(2), // 2 mins ago
              });
            }
            if (data.announcements.length > 1) {
              initialList.push({
                ...data.announcements[1],
                displayTime: getLocalBrowserTime(1), // 1 min ago
              });
              currentIndexRef.current = 2;
            } else {
              currentIndexRef.current = 1;
            }

            setFeed(initialList);
          }
        }
      } catch (e) {
        console.error('Error fetching announcements:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Sequential Realtime Streaming into the Feed
  useEffect(() => {
    if (allAnnouncements.length === 0 || !config.enabled || config.isPaused) {
      return;
    }

    const intervalMs = Math.max(3, config.intervalSeconds || 8) * 1000;

    const timer = setInterval(() => {
      if (allAnnouncements.length === 0) return;

      const idx = currentIndexRef.current;

      if (idx < allAnnouncements.length) {
        const nextItem = allAnnouncements[idx];
        const newEntry: DisplayAnnouncement = {
          ...nextItem,
          id: `${nextItem.id}_${Date.now()}`,
          displayTime: getLocalBrowserTime(0), // exact current local time
          isNew: true,
        };

        setFeed((prev) => [...prev.slice(-8), newEntry]); // keep clean last 8 messages
        currentIndexRef.current = idx + 1;
      } else if (config.loop) {
        // Restart loop seamlessly
        const firstItem = allAnnouncements[0];
        const newEntry: DisplayAnnouncement = {
          ...firstItem,
          id: `${firstItem.id}_${Date.now()}`,
          displayTime: getLocalBrowserTime(0),
          isNew: true,
        };

        setFeed((prev) => [...prev.slice(-8), newEntry]);
        currentIndexRef.current = 1;
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [allAnnouncements, config]);

  // 3. Smooth auto-scroll to the bottom when new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [feed]);

  if (!loading && allAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#09090d] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl animate-fade-in">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#0e0e14] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
            <span>Mural de Comunicados</span>
          </h4>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>AO VIVO</span>
        </div>
      </div>

      {/* Messages Feed Container with auto-scroll */}
      <div
        ref={scrollRef}
        className="p-3.5 space-y-2.5 max-h-56 overflow-y-auto divide-y divide-white/[0.04] scroll-smooth"
      >
        {feed.map((ann, idx) => (
          <div
            key={ann.id || idx}
            className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs animate-fade-in transition-all"
          >
            {ann.avatarUrl ? (
              <img
                src={ann.avatarUrl}
                alt={ann.authorName}
                className="w-7 h-7 rounded-full object-cover border border-rose-500/40 flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                {ann.authorName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs truncate">
                    {ann.authorName}
                  </span>
                </div>

                <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">
                  {ann.displayTime}
                </span>
              </div>

              <p className="text-zinc-200 text-xs leading-relaxed break-words font-normal">
                {ann.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
