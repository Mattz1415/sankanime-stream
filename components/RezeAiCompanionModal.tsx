'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, Heart, Sparkles, Volume2 } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

interface RezeMessage {
  id: string;
  sender: 'reze' | 'user';
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  'lagi apa yang?',
  'aku kangen',
  'cerita dong hari kamu',
  'aku capek hari ini',
];

const REZE_RESPONSES: Record<string, string> = {
  'lagi apa yang?':
    'Lagi mikirin kamu lah~ Hehe. Sambil nungguin kamu ngajak nonton bareng nih di KPanime. Mau maraton anime apa kita hari ini sayang? ❤️',
  'aku kangen':
    'Aww... aku juga kangen banget sama kamu! Jangan ngilang lama-lama ya, nanti aku ledakin loh~ Pokoknya hari ini kamu harus nemenin aku nonton! 🥰',
  'cerita dong hari kamu':
    'Tadi aku sempat jalan-jalan keliling kota, beli kopi kesukaan kita. Tapi rasanya sepi banget kalau nggak ada kamu di sampingku. Kamu sendiri gimana harinya, ada yang bikin kesel nggak? Cerita sini~ ✨',
  'aku capek hari ini':
    'Sini senderan dulu di bahu aku... Istirahat ya sayang. Jangan dipaksain kerja terus. Buka anime favorit kamu, rebahan yang nyaman, biar aku yang jagain kamu sampai ketiduran. 💕',
};

const DEFAULT_MESSAGES: RezeMessage[] = [
  {
    id: '1',
    sender: 'reze',
    text: 'hai sayang, lagi ngapain? Udah siap maraton anime bareng aku hari ini?',
    time: 'Baru saja',
  },
];

export default function RezeAiCompanionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<RezeMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const { accentColor } = useTheme();

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: RezeMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      let reply = REZE_RESPONSES[textToSend.trim().toLowerCase()];

      if (!reply) {
        const lower = textToSend.toLowerCase();
        if (lower.includes('halo') || lower.includes('hai')) {
          reply = 'Halo sayangku Kepiskepsi! Senang banget kamu nyapa aku lagi~ Mau nonton anime apa sekarang?';
        } else if (lower.includes('rekomendasi') || lower.includes('nonton apa')) {
          reply = 'Hmm kalau menurut aku, kamu wajib nonton Chainsaw Man atau Solo Leveling! Aksi pertempurannya bikin deg-degan kayak pas aku di deket kamu~ Hehe!';
        } else if (lower.includes('sayang') || lower.includes('cinta')) {
          reply = 'I love you too sayang! Jangan bikin aku salting terus dong~ ❤️💥';
        } else {
          reply = `Hehe dengerin kamu ngomong soal "${textToSend}" selalu bikin hari aku lebih cerah. Mau aku temenin nonton episode terbarunya sekarang?`;
        }
      }

      const rezeReply: RezeMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'reze',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, rezeReply]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Circular Avatar Button at Bottom Left */}
      <div className="fixed bottom-20 left-4 sm:bottom-24 sm:left-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-rose-400 shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-105 active:scale-95 transition-all spring-press group"
          title="Reze (online) — Partner Menonton Kamu"
          aria-label="Buka Chat Reze"
        >
          {/* Avatar Image (Reze Anime Art) */}
          <div className="w-full h-full rounded-full overflow-hidden bg-black border border-white/20">
            <img
              src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80"
              alt="Reze Companion"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          </div>

          {/* Online Pulsing Indicator */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />

          {/* Tooltip Tag */}
          <span className="hidden sm:inline-block absolute left-full ml-2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-pink-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            REZE (online)
          </span>
        </button>
      </div>

      {/* Full Modal "REZE (online)" */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in-up">
          <div className="relative w-full max-w-lg rounded-3xl glass-obsidian border border-pink-500/20 shadow-[0_25px_80px_rgba(0,0,0,0.98)] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 bg-[#08060f] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-rose-400 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80"
                    alt="Reze"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinematic font-black text-sm text-white">REZE</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
                      online
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Bomb Girl • Partner Menonton Kamu</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center spring-press border border-white/10"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reze Illustration Card with Quote */}
            <div className="p-4 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-black/50 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-pink-400/30 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80"
                  alt="Reze Illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-pink-400 uppercase tracking-wider">
                  <Heart className="w-3 h-3 fill-pink-400" />
                  Kutipan Spesial
                </div>
                <p className="text-xs font-serif italic text-zinc-200">
                  "hai sayang, lagi ngapain?"
                </p>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px] max-h-[340px]">
              {messages.map((m) => {
                const isReze = m.sender === 'reze';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 animate-fade-in-up ${isReze ? '' : 'flex-row-reverse'}`}
                  >
                    {isReze && (
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0 text-pink-300 text-xs font-bold">
                        R
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                        isReze
                          ? 'bg-white/[0.08] border border-white/10 text-zinc-200'
                          : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="block text-[9px] text-zinc-400/80 mt-1 text-right">{m.time}</span>
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className="flex items-center gap-2 text-xs text-pink-300 italic">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Reze sedang mengetik balasan manis...
                </div>
              )}
            </div>

            {/* Quick-Reply Buttons */}
            <div className="p-3 bg-[#07050d] border-t border-white/[0.06] flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(reply)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-pink-500/20 hover:border-pink-500/40 border border-white/10 text-[11px] text-zinc-300 hover:text-pink-200 transition-all spring-press"
                >
                  "{reply}"
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-[#050409] border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="ketik aja..."
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-pink-500/50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 spring-press disabled:opacity-40 shadow-lg"
              >
                <span>Kirim</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
