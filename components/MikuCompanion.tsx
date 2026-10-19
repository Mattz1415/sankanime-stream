'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Search,
  Play,
  RotateCw,
  Trash2,
  Flame,
  Film
} from 'lucide-react';
import {
  MikuChatMessage,
  getMikuChatHistory,
  saveMikuChatHistory,
  clearMikuChatHistory,
  sendMikuChatMessage,
} from '@/lib/mikuAiService';
import { MikuExpressionKey, MIKU_EXPRESSIONS } from '@/lib/mikuExpressions';
import { getHomeData } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';
import MikuLive2DCanvas from './MikuLive2DCanvas';
import IsolatedChatInput from './IsolatedChatInput';

const QUICK_ACTIONS = [
  'Rekomendasi anime seru dong!',
  'Cari Solo Leveling',
  'Tunjukin tombol putar video!',
  'Bonk aku pake palu dong!',
];

export default function MikuCompanion() {
  const pathname = usePathname();
  const router = useRouter();

  // State
  const [messages, setMessages] = useState<MikuChatMessage[]>([]);
  const [currentExpression, setCurrentExpression] = useState<MikuExpressionKey>('Open Arms');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [knownAnimeList, setKnownAnimeList] = useState<AnimeListItem[]>([]);

  // Roaming & Pointing Position (Coordinates relative to viewport)
  // Default docked at bottom right: x = window.innerWidth - 220, y = window.innerHeight - 300
  const [roamingPos, setRoamingPos] = useState<{ x: number; y: number } | null>(null);
  const [isRoaming, setIsRoaming] = useState(false);
  const [pointingTarget, setPointingTarget] = useState<{ x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' } | null>(null);

  // Active highlighted DOM element
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  const roamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load history & anime catalog
  useEffect(() => {
    const loaded = getMikuChatHistory();
    setMessages(loaded);
    if (loaded.length > 0) {
      const last = loaded[loaded.length - 1];
      if (last.expression) {
        setCurrentExpression(last.expression);
      }
    }

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

  // Listen for fullscreen change to auto-minimize during fullscreen playback
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
      );
      if (isFs) {
        setIsMinimized(true);
        setIsChatOpen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto clean highlight on unmount
  useEffect(() => {
    return () => {
      if (highlightedElementRef.current) {
        highlightedElementRef.current.classList.remove('miku-target-highlight');
      }
      if (roamTimeoutRef.current) clearTimeout(roamTimeoutRef.current);
    };
  }, []);

  /**
   * Screen-roaming & Auto-Pointing Mechanism based on getBoundingClientRect()
   */
  const roamToElement = useCallback((selector: string) => {
    if (typeof window === 'undefined') return;

    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove('miku-target-highlight');
      highlightedElementRef.current = null;
    }

    // Try finding element
    let targetEl = document.querySelector(selector) as HTMLElement | null;

    // Fallbacks if specified selector not found in current DOM
    if (!targetEl) {
      if (selector.includes('search')) {
        targetEl = document.querySelector('button[title*="Cari"], input[type="text"]') as HTMLElement;
      } else if (selector.includes('play')) {
        targetEl = document.querySelector('a[href*="/anime?id="], button:has(svg)') as HTMLElement;
      } else if (selector.includes('card')) {
        targetEl = document.querySelector('.glass-obsidian-card, .anime-glass-card, [class*="card"]') as HTMLElement;
      }
    }

    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();

    // Scroll element smoothly into view if partially hidden
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight target element with glowing neon border
    targetEl.classList.add('miku-target-highlight');
    highlightedElementRef.current = targetEl;

    // Calculate optimal Miku position beside the target
    // Prefer placing Miku to the right or left of the element
    const companionWidth = 180;
    const companionHeight = 240;

    let targetX = rect.right + 20;
    let targetY = rect.top - 40;
    let pointSide: 'left' | 'right' | 'top' | 'bottom' = 'left';

    // If overflowing right edge, position to the left of the element
    if (targetX + companionWidth > window.innerWidth) {
      targetX = Math.max(16, rect.left - companionWidth - 20);
      pointSide = 'right';
    }

    // Keep within vertical bounds
    targetY = Math.max(60, Math.min(window.innerHeight - companionHeight - 40, targetY));

    setIsRoaming(true);
    setRoamingPos({ x: targetX, y: targetY });
    setPointingTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, side: pointSide });

    // Auto reset position after 9 seconds of pointing
    if (roamTimeoutRef.current) clearTimeout(roamTimeoutRef.current);
    roamTimeoutRef.current = setTimeout(() => {
      resetRoaming();
    }, 9000);
  }, []);

  const resetRoaming = useCallback(() => {
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove('miku-target-highlight');
      highlightedElementRef.current = null;
    }
    setIsRoaming(false);
    setRoamingPos(null);
    setPointingTarget(null);
  }, []);

  /**
   * Handles user sending message to Miku
   */
  const handleSend = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isSpeaking) return;

    const userMsg: MikuChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    saveMikuChatHistory(newHistory);
    setIsSpeaking(true);

    // Initial thinking expression
    setCurrentExpression('Hand on Chest Pose');

    try {
      const reply = await sendMikuChatMessage(trimmed, newHistory, {
        knownAnimeList,
        currentRoute: pathname,
      });

      const updatedHistory = [...newHistory, reply];
      setMessages(updatedHistory);
      saveMikuChatHistory(updatedHistory);

      if (reply.expression) {
        setCurrentExpression(reply.expression);
      }

      // Execute AI VTuber Actions (SEARCH, POINT_ELEMENT, PLAY)
      if (reply.action === 'POINT_ELEMENT' || reply.action === 'PLAY') {
        const selector = reply.targetSelector || (reply.action === 'PLAY' ? 'a[href*="/anime?id="]' : '.anime-glass-card');
        setTimeout(() => {
          roamToElement(selector);
        }, 300);
      } else if (reply.action === 'SEARCH') {
        const query = reply.searchQuery || reply.matchedAnime?.title;
        // Point to search trigger or execute search
        setTimeout(() => {
          roamToElement('button[title*="Cari"], #search-trigger');
        }, 300);
        if (query) {
          // Open command search if available
          const searchBtn = document.querySelector('button[title*="Cari"], button[aria-label="Cari Anime"]') as HTMLButtonElement | null;
          searchBtn?.click();
        }
      }
    } catch (e) {
      console.error('Miku companion interaction error', e);
      setCurrentExpression('Sweat Drop');
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleResetHistory = () => {
    if (confirm('Hapus riwayat obrolan dengan Miku?')) {
      const reset = clearMikuChatHistory();
      setMessages(reset);
      setCurrentExpression('Open Arms');
      resetRoaming();
    }
  };

  const lastMikuMessage: MikuChatMessage = [...messages].reverse().find((m) => m.sender === 'miku') || {
    id: 'default',
    sender: 'miku',
    text: 'Yaho, Senpai! Miku siap nemenin kamu nonton anime seru hari ini~ ✨',
    time: 'Now',
    expression: 'Open Arms',
  };

  const expInfo = MIKU_EXPRESSIONS[currentExpression] || MIKU_EXPRESSIONS['Open Arms'];

  // Style positioning for roaming vs docked
  const containerStyle: React.CSSProperties = roamingPos
    ? {
        position: 'fixed',
        left: `${roamingPos.x}px`,
        top: `${roamingPos.y}px`,
        transition: 'left 0.65s cubic-bezier(0.34, 1.25, 0.64, 1), top 0.65s cubic-bezier(0.34, 1.25, 0.64, 1)',
      }
    : {
        position: 'fixed',
        right: '16px',
        bottom: '80px',
        transition: 'all 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)',
      };

  return (
    <>
      {/* 
        Transparent Floating Overlay Root
        CRITICAL: pointer-events-none on entire screen, pointer-events-auto ONLY on interactive children
      */}
      <div className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden font-sans">
        {/* Minimized Cute Chibi Button in Bottom Corner */}
        {isMinimized ? (
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setCurrentExpression('Open Arms');
            }}
            className="pointer-events-auto fixed bottom-24 right-4 sm:right-6 w-14 h-14 rounded-full bg-[#040407]/95 border-2 border-cyan-400/80 shadow-[0_0_25px_#00f0ff] flex items-center justify-center spring-press group hover:scale-110 transition-transform"
            title="Bangunkan Miku VTuber Companion"
          >
            <img
              src="/RetrynowMiku/miku.png"
              alt="Miku Chibi"
              className="w-11 h-11 object-cover rounded-full"
            />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center">
              ✦
            </span>
          </button>
        ) : (
          /* Full Companion Float (Live2D Model + Spatial Dark Glassmorphism Speech Bubble) */
          <div style={containerStyle} className="pointer-events-auto flex flex-col items-center">
            {/* Top Dark Glassmorphism Speech Bubble */}
            <div className="relative mb-2 w-72 sm:w-80 rounded-2xl bg-[#06060c]/95 border border-cyan-400/35 p-3.5 shadow-[0_16px_50px_rgba(0,0,0,0.98),0_0_20px_rgba(0,240,255,0.25)] backdrop-blur-md animate-fade-in-up">
              {/* Header Bar: Status + Minimize + Close */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-cinematic font-black text-xs text-white tracking-wide">
                    HATSUNE MIKU
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-extrabold border border-cyan-500/30">
                    VTuber 2D
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isRoaming && (
                    <button
                      type="button"
                      onClick={resetRoaming}
                      className="p-1 rounded-md text-cyan-400 hover:text-white hover:bg-white/10 text-[10px] font-bold"
                      title="Kembali ke pojok"
                    >
                      Reset Posisi
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Minimize Miku ke pojok"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetHistory}
                    className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                    title="Reset Riwayat Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Speech Text Content */}
              <div className="space-y-2">
                <p className="text-xs sm:text-[13px] text-zinc-100 font-medium leading-relaxed">
                  {lastMikuMessage.text}
                </p>

                {/* Mini Anime Recommendation Card if Miku matched an anime */}
                {lastMikuMessage.matchedAnime && (
                  <div className="p-2 rounded-xl bg-black/70 border border-cyan-400/30 flex items-center gap-2.5 shadow-lg">
                    {lastMikuMessage.matchedAnime.poster ? (
                      <img
                        src={lastMikuMessage.matchedAnime.poster}
                        alt={lastMikuMessage.matchedAnime.title}
                        className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-cyan-950/40 border border-cyan-400/30 flex items-center justify-center shrink-0">
                        <Film className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                        PILIHAN MIKU
                      </span>
                      <h5 className="font-cinematic font-bold text-xs text-white truncate mt-0.5">
                        {lastMikuMessage.matchedAnime.title}
                      </h5>
                      <Link
                        href={
                          lastMikuMessage.matchedAnime.animeId
                            ? `/anime?id=${lastMikuMessage.matchedAnime.animeId}`
                            : '/'
                        }
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Tonton Sekarang</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Action Chips */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_ACTIONS.map((actionText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(actionText)}
                    disabled={isSpeaking}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/[0.04] hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-400/40 whitespace-nowrap spring-press transition-all shrink-0"
                  >
                    {actionText}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="mt-2.5">
                <IsolatedChatInput
                  theme="white"
                  onSend={handleSend}
                  disabled={isSpeaking}
                  placeholder="Ketik pesan atau minta Miku cari anime..."
                />
              </div>

              {/* Animated Speech Bubble Pointer Triangle */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#06060c] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </div>

            {/* Pointing Laser / Wand Indicator when Miku is pointing to an element */}
            {isRoaming && pointingTarget && (
              <div className="absolute -top-12 -left-8 pointer-events-none z-40 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 text-black font-black text-[11px] uppercase tracking-wider shadow-[0_0_20px_#00f0ff] animate-pulse">
                <span>🪄 Di Sini Senpai!</span>
              </div>
            )}

            {/* Miku Live2D / 2D Sprite Character Canvas */}
            <MikuLive2DCanvas
              expression={currentExpression}
              isSpeaking={isSpeaking}
              isMinimized={isMinimized}
              onTap={() => {
                // Tapping Miku triggers interactive cute response
                const cuteReplies = [
                  'Yaho Senpai! Ada yang bisa Miku bantu cari? ✨',
                  'Ehehe, jangan dicubit terus dong Senpai~ 😳',
                  'Mau nonton anime action atau romance hari ini?',
                ];
                const rand = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `miku-${Date.now()}`,
                    sender: 'miku',
                    text: rand,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    expression: 'Fanged Smile',
                  },
                ]);
                setCurrentExpression('Fanged Smile');
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
