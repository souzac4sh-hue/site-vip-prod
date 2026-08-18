import React, { useState, useEffect, useRef } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { StaffAnnouncement, AnnouncementConfig } from '../types';

interface DisplayAnnouncement extends StaffAnnouncement {
  displayTime: string;
  isNew?: boolean;
}

const permanentDefaultAnnouncements: StaffAnnouncement[] = [
  {
    id: 'ann_init_1',
    authorName: 'STAFF DA PRODUÇÃO',
    role: '',
    message: '🚨 Transmissão Privada VIP iniciada! Garanta seu acesso de 30 dias antes que a sala atinja o limite.',
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    isActive: true,
  },
  {
    id: 'ann_init_2',
    authorName: 'Sara Amorin',
    role: '',
    avatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
    message: 'Oie amores! Entrem e fiquem à vontade na sala VIP, estou ao vivo agora! ❤️',
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    isActive: true,
  },
  {
    id: 'ann_init_3',
    authorName: 'SUPORTE VIP',
    role: '',
    message: 'ℹ️ Pagamentos via PIX são aprovados instantaneamente e liberam a live e o WhatsApp na hora.',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    isActive: true,
  },
  {
    id: 'ann_init_4',
    authorName: 'Sara Amorin',
    role: '',
    avatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
    message: 'Quem garantir o passe agora já ganha acesso direto ao meu WhatsApp privado! 🔥',
    createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
    isActive: true,
  },
  {
    id: 'ann_init_5',
    authorName: 'MODERAÇÃO',
    role: '',
    message: '🔒 Transmissão 100% discreta e sem rastros. Aproveitem a live em alta definição 1080p.',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'ann_init_6',
    authorName: 'Sara Amorin',
    role: '',
    avatarUrl: 'https://i.postimg.cc/HW9QbkSy/rgthree-compare-temp-eszyc-00004-endzu-1785870098.jpg',
    message: 'Já estou no chat com quem entrou! Vem comigo antes de começar a parte especial 💋',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'ann_init_7',
    authorName: 'SUPORTE VIP',
    role: '',
    message: '⚠️ O acesso de 30 dias dá direito a todas as transmissões do mês.',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export const LiveAnnouncementsFeed: React.FC = () => {
  const [allAnnouncements, setAllAnnouncements] = useState<StaffAnnouncement[]>(permanentDefaultAnnouncements);
  const [feed, setFeed] = useState<DisplayAnnouncement[]>([]);
  const [config, setConfig] = useState<AnnouncementConfig>({
    enabled: true,
    isPaused: false,
    intervalSeconds: 6,
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
        let announcementsList: StaffAnnouncement[] = [];

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
            announcementsList = data.announcements;
          }
          if (data.config) {
            setConfig(data.config);
          }
        }

        // Check localStorage fallback
        if (announcementsList.length === 0) {
          const savedLocal = localStorage.getItem('pl_admin_custom_announcements');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed) && parsed.length > 0) {
                announcementsList = parsed;
              }
            } catch (e) {}
          }
        }

        if (isMounted && announcementsList.length > 0) {
          setAllAnnouncements(announcementsList);

          // Start with the first 2 messages or 1 message with initial browser timestamps
          const initialList: DisplayAnnouncement[] = [];
          if (announcementsList.length > 0) {
            initialList.push({
              ...announcementsList[0],
              displayTime: getLocalBrowserTime(2), // 2 mins ago
            });
          }
          if (announcementsList.length > 1) {
            initialList.push({
              ...announcementsList[1],
              displayTime: getLocalBrowserTime(1), // 1 min ago
            });
            currentIndexRef.current = 2;
          } else {
            currentIndexRef.current = 1;
          }

          setFeed(initialList);
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

  // 2. Sequential Realtime Streaming into the Feed (Cycles ALL announcements reliably)
  useEffect(() => {
    if (allAnnouncements.length === 0 || !config.enabled || config.isPaused) {
      return;
    }

    const intervalMs = Math.max(3, config.intervalSeconds || 6) * 1000;

    const timer = setInterval(() => {
      setAllAnnouncements((currentList) => {
        if (currentList.length === 0) return currentList;

        const currentIdx = currentIndexRef.current % currentList.length;
        const nextItem = currentList[currentIdx];

        if (nextItem) {
          const newEntry: DisplayAnnouncement = {
            ...nextItem,
            id: `${nextItem.id}_${Date.now()}`,
            displayTime: getLocalBrowserTime(0), // exact browser local time
            isNew: true,
          };

          setFeed((prev) => [...prev.slice(-25), newEntry]); // keep full history of 25 messages
        }

        currentIndexRef.current = (currentIdx + 1) % currentList.length;
        return currentList;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [allAnnouncements.length, config.enabled, config.isPaused, config.intervalSeconds]);

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
