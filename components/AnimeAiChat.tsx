'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Send,
  Pin,
  ShieldCheck,
  Crown,
  Heart,
  Sparkles,
  Trash2,
  Play,
  Film,
  Zap,
  Bot
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import {
  RezeChatMessage,
  getRezeChatHistory,
  saveRezeChatHistory,
  clearRezeChatHistory,
  sendRezeChatMessage,
} from '@/lib/rezeAiService';
import { getHomeData } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';
import { RezeAvatar } from './RezeFloatingChat';

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
  text: 'Selamat datang di NexusAnime! Pemutar video telah dioptimalkan dengan prioritas server Vidhide & Odcdn, bebas iklan dan loading instan. Jangan lupa simpan anime ke Watchlist kamu! 🍿🔥',
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
    text: 'Fitur Watchlist baru rapi banget, episode yang sudah ditonton juga langsung ketahuan!',
    time: '02:22',
  },
  {
    id: 'g-3',
    sender: 'otaku_santai',
    text: 'Player vidhide sama desustream udah kenceng lagi nih di Android, makasih admin!',
    time: '02:30',
  },
];

const REZE_QUICK_REPLIES = [
  'lagi apa yang?',
  'aku kangen',
  'cerita dong hari kamu',
  'aku capek hari ini',
  'rekomendasiin anime seru dong',
];

export default function AnimeAiChat() {
  const [activeTab, setActiveTab] = useState<'global' | 'ai'>('global');
  const [globalMessages, setGlobalMessages] = useState<GlobalChatMessage[]>(DEFAULT_GLOBAL_MESSAGES);
  const [globalInput, setGlobalInput] = useState('');
  const { accentColor } = useTheme();

  // Reze AI states
  const [rezeMessages, setRezeMessages] = useState<RezeChatMessage[]>([]);
  const [rezeInput, setRezeInput] = useState('');
  const [isRezeTyping, setIsRezeTyping] = useState(false);
  const [knownAnimeList, setKnownAnimeList] = useState<AnimeListItem[]>([]);

  const rezeMessagesEndRef = useRef<HTMLDivElement>(null);
  const globalMessagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats on mount
  useEffect(() => {
    try {
      const savedGlobal = localStorage.getItem('kpanime_global_chats');
      if (savedGlobal) {
        const parsed = JSON.parse(savedGlobal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGlobalMessages(parsed);
        }
      }
    } catch {}

    setRezeMessages(getRezeChatHistory());

    getHomeData()
      .then((data) => {
        const combined = [
          ...(data.ongoing?.animeList || []),
          ...(data.complete?.animeList || []),
        ];
        setKnownAnimeList(combined);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll Reze messages
  useEffect(() => {
    if (activeTab === 'ai') {
      rezeMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rezeMessages, isRezeTyping, activeTab]);

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
    } catch {}

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
        } catch {}
        return withReply;
      });
    }, 1500);
  };

  const handleSendReze = async (textToSend?: string) => {
    const promptText = (textToSend || rezeInput).trim();
    if (!promptText || isRezeTyping) return;

    const userMessage: RezeChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...rezeMessages, userMessage];
    setRezeMessages(newHistory);
    saveRezeChatHistory(newHistory);
    setRezeInput('');
    setIsRezeTyping(true);

    try {
      const reply = await sendRezeChatMessage(promptText, newHistory, {
        knownAnimeList,
      });

      const updatedWithReply = [...newHistory, reply];
      setRezeMessages(updatedWithReply);
      saveRezeChatHistory(updatedWithReply);
    } catch {
      // Fallback already guaranteed inside sendRezeChatMessage
    } finally {
      setIsRezeTyping(false);
    }
  };

  const handleResetReze = () => {
    if (confirm('Hapus seluruh riwayat obrolan dengan Reze?')) {
      const reset = clearRezeChatHistory();
      setRezeMessages(reset);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in-up pb-28 sm:pb-32">
      {/* Top Switcher: CHAT GLOBAL vs REZE AI */}
      <div className="p-4 sm:p-5 rounded-3xl glass-obsidian border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="font-cinematic font-black text-base sm:text-lg text-white">
              {activeTab === 'global' ? 'CHAT GLOBAL (Komunitas)' : 'REZE AI (Virtual Companion)'}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            {activeTab === 'global'
              ? 'Komunitas penonton anime se-Indonesia • 1,429 Online'
              : 'Asisten perempuan manis bertenaga Gemini 2.0 Flash'}
          </p>
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
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all spring-press flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                : 'text-pink-300 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Reze AI</span>
          </button>
        </div>
      </div>

      {/* Main Tab 1: CHAT GLOBAL */}
      {activeTab === 'global' && (
        <div className="space-y-4">
          {/* Pinned Message */}
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

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/[0.06] border border-white/[0.08] text-zinc-200'
                    }`}
                  >
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
            <div ref={globalMessagesEndRef} />
          </div>

          {/* Global Input Bar */}
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

      {/* Main Tab 2: REZE AI COMPANION */}
      {activeTab === 'ai' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Reze Persona Header Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-black/80 border border-pink-500/30 shadow-[0_10px_30px_rgba(236,72,153,0.15)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RezeAvatar className="w-12 h-12" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cinematic font-black text-base text-white tracking-wide">
                    REZE
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                    VIRTUAL COMPANION
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                    online
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Pendamping perempuan virtual yang manis, peka, dan ahli membahas segala anime & donghua.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetReze}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-white/10 border border-white/10 spring-press flex items-center gap-1.5"
              title="Reset Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>

          {/* Reze Chat Messages Feed */}
          <div className="p-4 sm:p-6 rounded-3xl glass-obsidian border border-white/[0.08] min-h-[380px] max-h-[480px] overflow-y-auto space-y-4 shadow-inner">
            {rezeMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 animate-fade-in-up ${
                    isUser ? 'flex-row-reverse' : ''
                  }`}
                >
                  {!isUser && <RezeAvatar className="w-8 h-8 mt-1 shrink-0" />}

                  <div className="max-w-[80%] space-y-1">
                    <div
                      className={`rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-medium rounded-tr-xs'
                          : 'bg-white/[0.05] border border-white/[0.08] text-zinc-200 rounded-tl-xs backdrop-blur-md'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Mini Recommended Anime Card */}
                      {msg.matchedAnime && (
                        <div className="mt-3 p-2.5 rounded-2xl bg-black/70 border border-pink-500/30 flex items-center gap-3 shadow-lg hover:border-pink-500/60 transition-all">
                          {msg.matchedAnime.poster ? (
                            <img
                              src={msg.matchedAnime.poster}
                              alt={msg.matchedAnime.title}
                              className="w-12 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded-xl bg-pink-950/40 border border-pink-500/30 flex items-center justify-center shrink-0">
                              <Film className="w-5 h-5 text-pink-400" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                                REKOMENDASI REZE
                              </span>
                              {msg.matchedAnime.score && (
                                <span className="text-[10px] text-amber-300 font-bold">
                                  ★ {msg.matchedAnime.score}
                                </span>
                              )}
                            </div>
                            <h5 className="font-cinematic font-bold text-xs text-white truncate mt-1">
                              {msg.matchedAnime.title}
                            </h5>
                            <Link
                              href={
                                msg.matchedAnime.animeId
                                  ? `/anime?id=${msg.matchedAnime.animeId}`
                                  : '/'
                              }
                              className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 spring-press"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Tonton Sekarang</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    <span
                      className={`block text-[10px] px-1 text-zinc-500 ${
                        isUser ? 'text-right' : 'text-left'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Reze Typing Indicator */}
            {isRezeTyping && (
              <div className="flex items-center gap-2 animate-fade-in-up">
                <RezeAvatar className="w-8 h-8 shrink-0" />
                <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-xs text-pink-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-zinc-400 ml-1 font-medium">Reze sedang mengetik balasan manis...</span>
                </div>
              </div>
            )}

            <div ref={rezeMessagesEndRef} />
          </div>

          {/* Quick-Reply Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {REZE_QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendReze(reply)}
                disabled={isRezeTyping}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-pink-500/20 text-zinc-300 hover:text-pink-300 border border-white/[0.08] hover:border-pink-500/30 whitespace-nowrap spring-press transition-all shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Reze Input Bar */}
          <div className="flex items-center gap-2 p-2 rounded-2xl glass-obsidian border border-white/[0.1] shadow-lg">
            <input
              type="text"
              value={rezeInput}
              onChange={(e) => setRezeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReze()}
              disabled={isRezeTyping}
              placeholder="Kirim pesan manis atau tanya anime ke Reze..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
            />
            <button
              onClick={() => handleSendReze()}
              disabled={!rezeInput.trim() || isRezeTyping}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-white font-extrabold text-xs flex items-center gap-1.5 spring-press shadow-md"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
