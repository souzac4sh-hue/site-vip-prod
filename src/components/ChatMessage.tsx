import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.isSystem) {
    return (
      <div className="py-1.5 px-3 rounded-xl bg-zinc-950/70 border border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
        <Lock className="w-3 h-3 text-brand-400 flex-shrink-0" />
        <span className="text-zinc-300">{message.text}</span>
      </div>
    );
  }

  return (
    <div className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
      message.isModerator
        ? 'bg-brand-950/30 border-brand-500/30 shadow-sm'
        : 'bg-zinc-900/40 border-white/5'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${message.isModerator ? 'text-brand-400' : 'text-zinc-200'}`}>
            {message.authorName}
          </span>

          {message.isModerator && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-brand-500 text-white flex items-center gap-0.5 shadow-sm">
              <Shield className="w-2.5 h-2.5" />
              STAFF
            </span>
          )}

          {!message.isModerator && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-zinc-800 text-zinc-400">
              VIP
            </span>
          )}
        </div>

        <span className="text-[10px] text-zinc-400 font-mono">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <p className="text-zinc-200 break-words leading-relaxed text-[11px] sm:text-xs">
        {message.text}
      </p>
    </div>
  );
};
