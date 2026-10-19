'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageCircleHeart,
  X,
  Send,
  Trash2,
  Sparkles,
  Heart,
  Play,
  RotateCw,
  Film,
  Zap
} from 'lucide-react';
import {
  RezeChatMessage,
  getRezeChatHistory,
  saveRezeChatHistory,
  clearRezeChatHistory,
  sendRezeChatMessage,
} from '@/lib/rezeAiService';
import { getHomeData } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

export function RezeAvatar({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-700 p-0.5 shadow-[0_0_15px_rgba(236,72,153,0.4)] ${className}`}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-[#0d0714] flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
          {/* Hair background */}
          <path d="M20 50 Q15 20 50 15 Q85 20 80 50 Q85 85 70 95 Q50 90 30 95 Q15 85 20 50 Z" fill="#2d1b4e" />
          {/* Face */}
          <path d="M30 40 Q50 35 70 40 Q75 65 50 82 Q25 65 30 40 Z" fill="#ffe4db" />
          {/* Blush */}
          <ellipse cx="38" cy="62" rx="6" ry="3" fill="#ff7f9f" opacity="0.6" />
          <ellipse cx="62" cy="62" rx="6" ry="3" fill="#ff7f9f" opacity="0.6" />
          {/* Eyes */}
          <ellipse cx="40" cy="52" rx="4.5" ry="6.5" fill="#4c1d95" />
          <ellipse cx="60" cy="52" rx="4.5" ry="6.5" fill="#4c1d95" />
          <circle cx="41.5" cy="50" r="2" fill="#ffffff" />
          <circle cx="61.5" cy="50" r="2" fill="#ffffff" />
          {/* Smile */}
          <path d="M46 68 Q50 72 54 68" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Bangs */}
          <path d="M25 35 Q40 55 45 35 Q50 58 55 35 Q60 55 75 35 Q65 20 50 20 Q35 20 25 35 Z" fill="#3b2366" />
          {/* Signature Reze Choker */}
          <rect x="42" y="79" width="16" height="5" rx="1.5" fill="#18181b" />
          <circle cx="50" cy="81.5" r="2" fill="#eab308" />
        </svg>
      </div>
    </div>
  );
}

const QUICK_REPLIES = [
  'lagi apa yang?',
  'aku kangen',
  'cerita dong hari kamu',
  'aku capek hari ini',
  'rekomendasiin anime seru dong',
];

export default function RezeFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<RezeChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [knownAnimeList, setKnownAnimeList] = useState<AnimeListItem[]>([]);
  const [showTooltip, setShowTooltip] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history & sample catalog
  useEffect(() => {
    const loaded = getRezeChatHistory();
    setMessages(loaded);

    // Fetch catalog list for anime context
    getHomeData()
      .then((data) => {
        const combined = [
          ...(data.ongoing?.animeList || []),
          ...(data.complete?.animeList || []),
        ];
        setKnownAnimeList(combined);
      })
      .catch(() => {});

    // Auto-hide tooltip after 6 seconds
    const tooltipTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 6000);

    return () => clearTimeout(tooltipTimer);
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isTyping) return;

    const userMessage: RezeChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    saveRezeChatHistory(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      const rezeReply = await sendRezeChatMessage(messageText, newHistory, {
        knownAnimeList,
      });

      const updatedWithReply = [...newHistory, rezeReply];
      setMessages(updatedWithReply);
      saveRezeChatHistory(updatedWithReply);
    } catch {
      // Fallback already guaranteed inside sendRezeChatMessage
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (confirm('Hapus seluruh riwayat percakapan dengan Reze?')) {
      const reset = clearRezeChatHistory();
      setMessages(reset);
    }
  };

  return (
    <>
      {/* Floating Avatar Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-40 flex items-center gap-2 animate-fade-in-up">
          {/* Cute Tooltip Pill */}
          {showTooltip && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#030306]/95 border border-pink-500/40 text-pink-300 text-xs font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] backdrop-blur-xl animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Reze online • Curhat yuk!</span>
            </div>
          )}

          {/* Avatar Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="group relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_25px_rgba(236,72,153,0.65)] hover:shadow-[0_0_35px_rgba(236,72,153,0.9)] transition-all duration-300 hover:scale-105 spring-press"
            title="Ngobrol dengan Reze AI"
          >
            <RezeAvatar className="w-full h-full" />

            {/* Pulsing Green Online Indicator Dot */}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </span>
          </button>
        </div>
      )}

      {/* Fullscreen / Floating Glass OLED Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-up">
          {/* Modal Container */}
          <div className="relative w-full sm:max-w-md h-[90vh] sm:h-[640px] bg-[#020204]/98 border border-white/[0.12] sm:rounded-3xl rounded-t-3xl shadow-[0_25px_80px_rgba(0,0,0,0.98),inset_0_1px_0_0_rgba(255,255,255,0.15)] flex flex-col overflow-hidden">
            {/* Header: Reze status + model badge + controls */}
            <div className="px-4 py-3 bg-[#030306]/95 border-b border-white/[0.08] backdrop-blur-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <RezeAvatar className="w-9 h-9" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-cinematic font-black text-sm text-white tracking-wide">
                      REZE
                    </h3>
                    <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="text-emerald-400 font-bold">online</span>
                    <span>•</span>
                    <span className="text-pink-300 font-medium">Gemini 2.0 Flash ⚡</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset Chat Button */}
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-white/10 spring-press transition-colors"
                  title="Hapus riwayat obrolan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 spring-press transition-colors"
                  title="Tutup chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Top Portrait Visual Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-black/60 border border-pink-500/25 shadow-lg flex items-center gap-3">
                <RezeAvatar className="w-12 h-12" />
                <div className="space-y-0.5">
                  <h4 className="font-cinematic font-bold text-xs text-pink-200">
                    Reze • Otaku & Virtual Companion
                  </h4>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Mau curhat, minta rekomendasi anime, atau sekadar nemenin kamu istirahat? Aku selalu ada buat kamu sayang ✨
                  </p>
                </div>
              </div>

              {/* Chat Message Bubbles */}
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 animate-fade-in-up ${
                      isUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {!isUser && <RezeAvatar className="w-7 h-7 mt-1 shrink-0" />}

                    <div className="max-w-[82%] space-y-1">
                      <div
                        className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                          isUser
                            ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-medium rounded-tr-xs'
                            : 'bg-white/[0.05] border border-white/[0.08] text-zinc-200 rounded-tl-xs backdrop-blur-md'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {/* Interactive Mini Anime Recommendation Card */}
                        {msg.matchedAnime && (
                          <div className="mt-2.5 p-2 rounded-xl bg-black/60 border border-pink-500/30 flex items-center gap-2.5 shadow-lg hover:border-pink-500/60 transition-all">
                            {msg.matchedAnime.poster ? (
                              <img
                                src={msg.matchedAnime.poster}
                                alt={msg.matchedAnime.title}
                                className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded-lg bg-pink-950/40 border border-pink-500/30 flex items-center justify-center shrink-0">
                                <Film className="w-4 h-4 text-pink-400" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                                  REKOMENDASI
                                </span>
                                {msg.matchedAnime.score && (
                                  <span className="text-[10px] text-amber-300">
                                    ★ {msg.matchedAnime.score}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-cinematic font-bold text-xs text-white truncate mt-0.5">
                                {msg.matchedAnime.title}
                              </h5>
                              <Link
                                href={
                                  msg.matchedAnime.animeId
                                    ? `/anime?id=${msg.matchedAnime.animeId}`
                                    : '/'
                                }
                                onClick={() => setIsOpen(false)}
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

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex items-center gap-2 animate-fade-in-up">
                  <RezeAvatar className="w-7 h-7 shrink-0" />
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-xs text-pink-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-zinc-400 ml-1 font-medium">Reze sedang mengetik...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Horizontal Scrollable Quick-Reply Chips */}
            <div className="px-4 py-2 border-t border-white/[0.06] bg-[#020204]/90 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(reply)}
                  disabled={isTyping}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-pink-500/20 text-zinc-300 hover:text-pink-300 border border-white/[0.08] hover:border-pink-500/30 whitespace-nowrap spring-press transition-all shrink-0"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Bottom Glass Input Bar */}
            <div className="p-3 bg-[#030306]/98 border-t border-white/[0.08] flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isTyping}
                placeholder="Ketik pesan untuk Reze..."
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 spring-press transition-all shadow-md shadow-pink-600/30 shrink-0"
                title="Kirim pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
