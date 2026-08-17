import React from 'react';
import { StreamStatus } from '../types';

interface StatusBadgeProps {
  status: StreamStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'live':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          AO VIVO
        </span>
      );

    case 'scheduled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Programada
        </span>
      );

    case 'ended':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          Encerrada
        </span>
      );

    case 'offline':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/70 text-zinc-300 border border-white/15 backdrop-blur-sm ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Sala Privada
        </span>
      );
  }
};
