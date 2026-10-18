'use client';

import React, { useState, useEffect } from 'react';
import { Send, Pin, ShieldCheck, Crown, MessageSquare, Bot, Sparkles, User, Trash2 } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

interface GlobalChatMessage {
  id: string;
  sender: string;
  badge?: 'OWNER' | 'ADMIN' | 'VIP' | 'KAMU';
  badgeColor?: string;
  text: string;
  time: string;
  isOwner?: boolean;
}

const PINNED_MESSAGE: GlobalChatMessage = {
  id: 'pinned-1',
  sender: 'loerdturet',
  badge: 'OWNER',
  badgeColor: '#ef4444',
  text: 'Selamat datang di KPanime Stream! Server player Vidhide & Odstream sudah dipulihkan 100%. Jangan lupa gunakan fitur bookmark & laporkan jika ada episode yang rusak. Have fun streaming! 🍿🔥',
  time: 'Hari ini • Pinned',
  isOwner: true,
};

const DEFAULT_GLOBAL_MESSAGES: GlobalChatMessage[] = [
  {
    id: 'g-1',
    sender: 'sakura_wibu',
    badge: 'VIP',
    badgeColor: '#ec4899',
    text: 'Halo semua! Ada yang ngikutin rilis Solo Leveling minggu ini? Visual animasinya pecah parah! 🔥',
    time: '02:15',
  },
  {
    id: 'g-2',
    sender: 'kage_ninja',
    badge: 'VIP',
    badgeColor: '#8b5cf6',
    text: 'Minigame Zabuza vs Kepong di atas seru banget wkwkwk, pas ketuk bulan merah langsung bisa joystick!',
    time: '02:22',
  },
  {
    id: 'g-3',
    sender: 'otaku_santai',
    text: 'Player vidhide sama desustream udah kenceng lagi nih di Android, makasih admin!',
    time: '02:30',
  },
];

export default function AnimeAiChat() {
  const [activeTab, setActiveTab] = useState<'global' | 'ai'>('global');
  const [globalMessages, setGlobalMessages] = useState<GlobalChatMessage[]>(DEFAULT_GLOBAL_MESSAGES);
  const [globalInput, setGlobalInput] = useState('');
  const { accentColor } = useTheme();

  // Load user messages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kpanime_global_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGlobalMessages(parsed);
        }
      }
    } catch (e) {
      // Ignore fallback
    }
  }, []);

  const handleSendGlobal = () => {
    if (!globalInput.trim()) return;

    const newMsg: GlobalChatMessage = {
      id: Date.now().toString(),
      sender: 'Kepiskepsi',
      badge: 'KAMU',
      badgeColor: '#00f0ff',
      text: globalInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...globalMessages, newMsg];
    setGlobalMessages(updated);
    setGlobalInput('');

    try {
      localStorage.setItem('kpanime_global_chats', JSON.stringify(updated));
    } catch (e) {}

    // Simulated active community replies
    setTimeout(() => {
      const simulatedReplies = [
        'Mantap Kepiskepsi! Selamat bergabung di room chat global!',
        'Halo Kepiskepsi! Lagi nonton anime judul apa sekarang?',
        'Siap Kepiskepsi, enjoy streaming di KPanime ya!',
      ];
      const randomReply = simulatedReplies[Math.floor(Math.random() * simulatedReplies.length)];

      const botReply: GlobalChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'anime_watcher',
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setGlobalMessages((prev) => {
        const withReply = [...prev, botReply];
        try {
          localStorage.setItem('kpanime_global_chats', JSON.stringify(withReply));
        } catch (e) {}
        return withReply;
      });
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in-up">
      {/* Top Switcher: CHAT GLOBAL (Default) vs AI Assistant */}
      <div className="p-4 sm:p-5 rounded-3xl glass-obsidian border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="font-cinematic font-black text-base sm:text-lg text-white">
              CHAT GLOBAL (online - terhubung)
            </h2>
          </div>
          <p className="text-xs text-zinc-400">Komunitas penonton anime se-Indonesia • 1,429 Online</p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/50 border border-white/10">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all spring-press ${
              activeTab === 'global'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Chat Global
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all spring-press ${
              activeTab === 'ai'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Nexus AI
          </button>
        </div>
      </div>

      {/* Main Tab 1: CHAT GLOBAL */}
      {activeTab === 'global' && (
        <div className="space-y-4">
          {/* Pinned Message dari @loerdturet ber-badge merah OWNER */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-black/60 border border-red-500/30 shadow-[0_10px_30px_rgba(239,68,68,0.2)] animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2 text-xs text-red-400 font-bold">
              <Pin className="w-4 h-4 fill-red-400" />
              <span>PESAN TERSEMAT (PINNED)</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-cinematic font-black text-sm text-white">
                    @{PINNED_MESSAGE.sender}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    OWNER
                  </span>
                  <span className="text-[10px] text-zinc-400">{PINNED_MESSAGE.time}</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {PINNED_MESSAGE.text}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Global Chat Feed */}
          <div className="p-4 sm:p-6 rounded-3xl glass-obsidian border border-white/[0.08] min-h-[350px] max-h-[460px] overflow-y-auto space-y-3.5 shadow-inner">
            {globalMessages.map((msg) => {
              const isUser = msg.sender === 'Kepiskepsi';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* User Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                      isUser
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : msg.badge === 'OWNER'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-white/10 border-white/20 text-white'
                    }`}
                  >
                    {isUser ? 'K' : msg.sender.charAt(0).toUpperCase()}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/[0.06] border border-white/[0.08] text-zinc-200'
                    }`}
                  >
                    {/* Username & Badge Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${isUser ? 'text-zinc-900' : 'text-zinc-300'}`}>
                        @{msg.sender}
                      </span>
                      {msg.badge && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-black"
                          style={{ backgroundColor: msg.badgeColor || '#fff' }}
                        >
                          {msg.badge}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isUser ? 'text-zinc-500' : 'text-zinc-500'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Global Input Bar */}
          <div className="flex items-center gap-2 p-2 rounded-2xl glass-obsidian border border-white/[0.1] shadow-lg">
            <input
              type="text"
              value={globalInput}
              onChange={(e) => setGlobalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendGlobal()}
              placeholder="Tulis pesan ke chat global sebagai Kepiskepsi..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
            />
            <button
              onClick={handleSendGlobal}
              disabled={!globalInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white font-extrabold text-xs flex items-center gap-1.5 spring-press shadow-md"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: NEXUS AI ASSISTANT */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-3xl glass-obsidian border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-cinematic font-bold text-base text-white">Nexus Anime AI</h3>
              <p className="text-xs text-zinc-400">Asisten rekomendasi anime bertenaga AI</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300">
            Ketik pertanyaan mengenai rekomendasi anime, jadwal rilis, atau sinopsis anime langsung dari katalog Sanka Vollerei!
          </p>
        </div>
      )}
    </div>
  );
}
