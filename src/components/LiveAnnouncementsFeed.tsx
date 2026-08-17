import React, { useState, useEffect } from 'react';
import { MessageSquare, Pin } from 'lucide-react';
import { StaffAnnouncement } from '../types';

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

export const LiveAnnouncementsFeed: React.FC = () => {
  const [announcements, setAnnouncements] = useState<StaffAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.announcements) {
            setAnnouncements(data.announcements);
          }
        }
      } catch (e) {
        console.error('Error fetching announcements:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!loading && announcements.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-2xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#09090d] border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-rose-400" />
          <h4 className="text-xs font-bold text-white tracking-wide">
            Avisos Fixados da Live
          </h4>
        </div>

        <span className="text-[10px] text-zinc-400 font-mono">
          Tempo Real
        </span>
      </div>

      {/* Messages Feed */}
      <div className="p-3.5 space-y-2.5 max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
        {announcements.map((ann, idx) => (
          <div
            key={ann.id || idx}
            className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs group"
          >
            {ann.avatarUrl ? (
              <img
                src={ann.avatarUrl}
                alt={ann.authorName}
                className="w-6 h-6 rounded-full object-cover border border-rose-500/30 flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {ann.authorName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-white text-xs truncate">
                  {ann.authorName}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
                  {getRelativeTime(ann.createdAt)}
                </span>
              </div>
              <p className="text-zinc-200 text-xs leading-relaxed break-words">
                {ann.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
