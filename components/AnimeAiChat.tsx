'use client';

import React, { useState } from 'react';
import { Send, Sparkles, Bot, User, Trash2 } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'ai',
    text: 'Halo! Saya NexusAI Anime Assistant. Ada rekomendasi anime, informasi karakter, atau jadwal rilis yang ingin kamu tanyakan hari ini?',
    time: 'Baru saja',
  },
];

const SUGGESTIONS = [
  'Rekomendasi anime isekai terbaik',
  'Anime romance dengan rating tinggi',
  'Anime action seru mirip Solo Leveling',
  'Jadwal rilis anime populer minggu ini',
];

export default function AnimeAiChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const { accentColor } = useTheme();

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      let reply = 'Menarik sekali! Berdasarkan koleksi Sanka Vollerei, kamu bisa mencoba menonton ';
      const lower = userText.toLowerCase();

      if (lower.includes('isekai')) {
        reply = 'Untuk tema Isekai, berikut rekomendasi terbaik saat ini:\n1. Tensei Kizoku, Kantei Skill de Nariagaru (Reinkarnasi dengan skill analisis)\n2. Shinja Zero no Megami-sama (Petualangan sang dewi)\n3. Tensei Shitara Slime Datta Ken (Klasik & penuh pertempuran seru!)';
      } else if (lower.includes('romance') || lower.includes('romantis')) {
        reply = 'Untuk anime romance yang bikin baper:\n1. Seihantai na Kimi to Boku (Dua kepribadian bertolak belakang namun manis)\n2. Tenkou-saki no Seiso Karen na Bishoujo (Teman masa kecil yang tak terduga)\n3. Kimi ni Todoke / Horimiya (Sangat menghangatkan hati!)';
      } else if (lower.includes('action') || lower.includes('solo leveling')) {
        reply = 'Untuk pencinta anime action dengan pertempuran intens:\n1. Solo Leveling (Dungeon & leveling sistem)\n2. Jujutsu Kaisen & Demon Slayer (Animasi pertarungan tingkat dewa)\n3. Buchigire Reijou wa Houfuku wo Chikaimashita (Aksi balas dendam yang menegangkan!)';
      } else if (lower.includes('jadwal') || lower.includes('rilis')) {
        reply = 'Jadwal rilis anime di Sanka Vollerei selalu diperbarui setiap hari:\n• Senin: Buchigire Reijou, Kuroneko to Majo, Saikyou Degarashi Ouji\n• Kamu juga bisa langsung mengecek tab "List" -> "Jadwal" di navigasi bawah!';
      } else {
        reply = `Pertanyaan bagus mengenai "${userText}"! Kamu bisa mencari judulnya secara langsung menggunakan tombol Cari di kanan atas, atau menelusuri katalog Anime Tamat di tab List untuk langsung maraton episode lengkap subtitle Indonesia.`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-3xl glass-obsidian border border-white/[0.06] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-cinematic font-bold text-base sm:text-lg text-white flex items-center gap-2">
              Nexus Anime AI
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-zinc-400">Asisten rekomendasi & diskusi anime</p>
          </div>
        </div>

        <button
          onClick={() => setMessages(INITIAL_MESSAGES)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors spring-press border border-white/[0.06]"
          title="Reset Obrolan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="p-4 sm:p-6 rounded-3xl glass-obsidian border border-white/[0.06] min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 animate-fade-in-up ${isAi ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isAi
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'bg-white text-black'
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md ${
                  isAi
                    ? 'bg-white/[0.06] border border-white/[0.08] text-zinc-200'
                    : 'bg-white text-black font-medium'
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`block text-[10px] mt-1 ${
                    isAi ? 'text-zinc-500' : 'text-zinc-600'
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 italic">
            <Bot className="w-4 h-4 animate-spin" />
            NexusAI sedang mengetik...
          </div>
        )}
      </div>

      {/* Quick Suggestions Chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-zinc-300 hover:text-white transition-all spring-press flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            {s}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2 p-2 rounded-2xl glass-obsidian border border-white/[0.1] shadow-lg">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Tanyakan rekomendasi anime..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim()}
          className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white font-bold text-xs flex items-center gap-1.5 spring-press shadow-md"
        >
          <span>Kirim</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
