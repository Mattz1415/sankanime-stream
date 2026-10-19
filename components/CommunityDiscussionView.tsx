'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  Filter,
  Sparkles,
  Share2,
  CornerDownRight,
  ShieldCheck,
  Check,
  Flame,
  Clock,
  User,
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { CommunityComment } from '@/lib/types';
import {
  getCommunityComments,
  saveCommunityComment,
  likeCommunityComment,
} from '@/lib/storage';

interface CommunityDiscussionViewProps {
  targetId?: string; // animeId or episodeId or 'global'
  targetTitle?: string;
  className?: string;
}

/**
 * Helper to render comment text with interactive spoiler tags
 * Syntax supported: ||spoiler content|| or >!spoiler content!<
 */
const SpoilerFormattedText = memo(function SpoilerFormattedText({
  text,
}: {
  text: string;
}) {
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});

  const toggleReveal = (idx: number) => {
    setRevealedIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Regex matches ||spoiler|| or >!spoiler!<
  const regex = /(\|\|[\s\S]*?\|\||>![\s\S]*?!<)/g;
  const parts = text.split(regex);

  return (
    <span className="leading-relaxed break-words">
      {parts.map((part, index) => {
        const isSpoiler =
          (part.startsWith('||') && part.endsWith('||')) ||
          (part.startsWith('>!') && part.endsWith('!<'));

        if (!isSpoiler) {
          return <span key={index}>{part}</span>;
        }

        const cleanSpoilerText = part.replace(/^(\|\||>!)/, '').replace(/(\|\||!<)$/, '');
        const isRevealed = !!revealedIndices[index];

        return (
          <button
            key={index}
            type="button"
            onClick={() => toggleReveal(index)}
            title={isRevealed ? 'Klik untuk sembunyikan kembali' : 'Konten spoiler! Klik untuk membaca'}
            className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              isRevealed
                ? 'bg-red-500/15 border border-red-500/40 text-red-200'
                : 'bg-zinc-800 hover:bg-zinc-700 text-transparent border border-zinc-700/60 select-none cursor-pointer'
            }`}
          >
            {!isRevealed ? (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-bold">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>SPOILER (Buka)</span>
              </span>
            ) : (
              <span>{cleanSpoilerText}</span>
            )}
          </button>
        );
      })}
    </span>
  );
});

export default function CommunityDiscussionView({
  targetId = 'global',
  targetTitle = 'Komunitas Penggemar Anime',
  className = '',
}: CommunityDiscussionViewProps) {
  const { accentColor } = useTheme();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'spoilers' | 'popular'>('all');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSpoilerToggle, setIsSpoilerToggle] = useState(false);
  const [authorName, setAuthorName] = useState('Pengguna Nexus');
  const [replyingTo, setReplyingTo] = useState<CommunityComment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Load comments
  useEffect(() => {
    setComments(getCommunityComments(targetId));
    try {
      const savedUser = localStorage.getItem('nexus_user_profile_name');
      if (savedUser) setAuthorName(savedUser);
    } catch {}
  }, [targetId]);

  const handleInsertSpoilerTag = () => {
    setNewCommentText((prev) => {
      if (!prev) return '||teks spoiler di sini||';
      return `${prev} ||teks spoiler||`;
    });
    setIsSpoilerToggle(true);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    const hasSpoiler = isSpoilerToggle || trimmed.includes('||') || trimmed.includes('>!');

    const newComment: CommunityComment = {
      id: `comm-${Date.now()}`,
      targetId,
      targetTitle,
      user: {
        name: authorName || 'Pengguna Nexus',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${authorName || 'Nexus'}`,
        badge: 'VIP',
      },
      content: trimmed,
      hasSpoiler,
      createdAt: Date.now(),
      likes: 0,
      userLiked: false,
    };

    const updated = saveCommunityComment(newComment);
    setComments(updated.filter((c) => targetId === 'global' || c.targetId === targetId));
    setNewCommentText('');
    setIsSpoilerToggle(false);
    setReplyingTo(null);

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLike = (id: string) => {
    const updated = likeCommunityComment(id);
    setComments(updated.filter((c) => targetId === 'global' || c.targetId === targetId));
  };

  const handleShareComment = (comment: CommunityComment) => {
    try {
      navigator.clipboard.writeText(`"${comment.content}" - ${comment.user.name} di NexusAnime`);
      setCopiedId(comment.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    if (activeFilter === 'spoilers') return c.hasSpoiler;
    return true;
  }).sort((a, b) => {
    if (activeFilter === 'popular') return b.likes - a.likes;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-5 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white shadow-inner">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-cinematic font-black text-lg text-white tracking-wide">
                KOMUNITAS DISKUSI
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-400/30">
                SENSOR SPOILER
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Diskusi seru antar sesama penonton anime, bebas spoiler sembarangan dengan tag sensor ||spoiler||.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Terbaru ({comments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('popular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'popular'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
            Populer
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('spoilers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'spoilers'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-red-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            Ada Spoiler
          </button>
        </div>
      </div>

      {/* New Comment Submission Box */}
      <form
        onSubmit={handlePostComment}
        className="p-4 sm:p-5 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_12px_30px_rgba(0,0,0,0.8)] space-y-3"
      >
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-cyan-300">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              Membalas komentar dari <strong>{replyingTo.user.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-zinc-400 hover:text-white text-[11px]"
            >
              Batal
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Tulis ulasan, teori, atau diskusi episode... Gunakan ||teks|| untuk menyembunyikan spoiler!"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/[0.08] focus:border-cyan-400/80 text-white text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none transition-all leading-relaxed"
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {/* Spoiler Sensor Quick Tag Button */}
            <button
              type="button"
              onClick={handleInsertSpoilerTag}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 spring-press ${
                isSpoilerToggle
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-white/[0.04] border-white/10 hover:border-amber-400/40 text-zinc-300 hover:text-amber-300'
              }`}
              title="Bungkus teks dengan sensor spoiler ||teks||"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Tag Spoiler (||teks||)</span>
            </button>

            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              Ketuk teks hitam untuk membuka spoiler
            </span>
          </div>

          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-5 py-2 rounded-full bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.25)] spring-press"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>Kirim Diskusi</span>
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-3.5">
        {filteredComments.length === 0 ? (
          <div className="p-8 rounded-3xl card-frosted-obsidian border border-white/[0.06] text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-semibold">
              Belum ada diskusi untuk kategori ini. Jadilah yang pertama berkomentar!
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 sm:p-5 rounded-3xl card-frosted-obsidian border border-white/[0.08] hover:border-white/15 transition-all space-y-3 shadow-md"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/15 bg-zinc-900"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-white">
                        {comment.user.name}
                      </h4>
                      {comment.user.badge && (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black border border-cyan-400/30">
                          {comment.user.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(comment.createdAt).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {comment.hasSpoiler && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-extrabold border border-red-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>ADA SPOILER</span>
                  </span>
                )}
              </div>

              {/* Comment Content with Spoiler Engine */}
              <div className="text-xs sm:text-sm text-zinc-200">
                <SpoilerFormattedText text={comment.content} />
              </div>

              {/* Comment Footer: Likes & Reply */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  {/* Upvote Button */}
                  <button
                    type="button"
                    onClick={() => handleLike(comment.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all spring-press ${
                      comment.userLiked
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${comment.userLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>

                  {/* Reply Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(comment);
                      setNewCommentText(`@${comment.user.name} `);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] font-semibold spring-press"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Balas</span>
                  </button>
                </div>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => handleShareComment(comment)}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
                  title="Salin isi komentar"
                >
                  {copiedId === comment.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Disalin</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
}
