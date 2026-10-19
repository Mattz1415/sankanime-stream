'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Heart, Flame, ThumbsUp, Smile, Sparkles, User } from 'lucide-react';

interface EpisodeDiscussionProps {
  episodeId: string;
  episodeTitle: string;
}

interface CommentItem {
  id: string;
  userName: string;
  avatar: string;
  badge?: string;
  text: string;
  timeAgo: string;
  likes: number;
  userLiked?: boolean;
}

const DEFAULT_REACTIONS = [
  { emoji: '🔥', label: 'Hype', count: 184 },
  { emoji: '😭', label: 'Bawang', count: 96 },
  { emoji: '😱', label: 'Kaget', count: 68 },
  { emoji: '❤️', label: 'Love', count: 240 },
  { emoji: '👏', label: 'GG', count: 112 },
];

const SEED_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    userName: 'KenshinRyu',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    badge: 'VIP',
    text: 'Animasi pertarungan di menit ke-14 bener-bener gila! Studio ini nggak pernah ngecewain sound effect-nya.',
    timeAgo: '2 jam yang lalu',
    likes: 42,
  },
  {
    id: 'c2',
    userName: 'AkariNyan',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    badge: 'MOD',
    text: 'Next episode bakal masuk ke arc penting, siap-siap tissue buat yang belum baca manga-nya 😭',
    timeAgo: '5 jam yang lalu',
    likes: 29,
  },
  {
    id: 'c3',
    userName: 'ShadowStrike',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    text: 'Server vidhide 720p lancar banget tanpa buffering di HP saya. Kualitas gambarnya tajam!',
    timeAgo: '1 hari yang lalu',
    likes: 15,
  },
];

export default function EpisodeDiscussion({ episodeId, episodeTitle }: EpisodeDiscussionProps) {
  const [reactions, setReactions] = useState(DEFAULT_REACTIONS);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [comments, setComments] = useState<CommentItem[]>(SEED_COMMENTS);
  const [newComment, setNewComment] = useState('');

  const reactionsKey = `nexus_rx_${episodeId}`;
  const commentsKey = `nexus_cmt_${episodeId}`;

  useEffect(() => {
    try {
      const savedRx = localStorage.getItem(reactionsKey);
      if (savedRx) {
        setUserReactions(JSON.parse(savedRx));
      }
      const savedCmt = localStorage.getItem(commentsKey);
      if (savedCmt) {
        setComments([...JSON.parse(savedCmt), ...SEED_COMMENTS]);
      }
    } catch {
      // Ignore
    }
  }, [episodeId]);

  const handleToggleReaction = (emoji: string) => {
    const hasReacted = userReactions.includes(emoji);
    let updatedUserRx: string[];

    if (hasReacted) {
      updatedUserRx = userReactions.filter((r) => r !== emoji);
      setReactions((prev) =>
        prev.map((r) => (r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r))
      );
    } else {
      updatedUserRx = [...userReactions, emoji];
      setReactions((prev) =>
        prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
      );
    }

    setUserReactions(updatedUserRx);
    try {
      localStorage.setItem(reactionsKey, JSON.stringify(updatedUserRx));
    } catch {}
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const myComment: CommentItem = {
      id: `usr_${Date.now()}`,
      userName: 'Kepiskepsi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      badge: 'PRO',
      text: newComment.trim(),
      timeAgo: 'Baru saja',
      likes: 1,
      userLiked: true,
    };

    const updated = [myComment, ...comments];
    setComments(updated);
    setNewComment('');

    try {
      const userOnly = updated.filter((c) => c.userName === 'Kepiskepsi');
      localStorage.setItem(commentsKey, JSON.stringify(userOnly));
    } catch {}
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = c.userLiked;
          return {
            ...c,
            likes: isLiked ? c.likes - 1 : c.likes + 1,
            userLiked: !isLiked,
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
      {/* Top Header & Reaction Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Reaksi Cepat & Obrolan Episode
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{comments.length} Komentar</span>
        </div>

        {/* Reaction Emoji Pills */}
        <div className="flex flex-wrap gap-2">
          {reactions.map((rx) => {
            const isSelected = userReactions.includes(rx.emoji);
            return (
              <button
                key={rx.emoji}
                onClick={() => handleToggleReaction(rx.emoji)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold spring-press transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06]'
                }`}
              >
                <span>{rx.emoji}</span>
                <span className="text-[11px] font-bold">{rx.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-2">
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10 hidden sm:block">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Kepiskepsi"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tulis tanggapan atau kesanmu tentang episode ini..."
          className="flex-1 px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="px-4 py-2.5 rounded-2xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all spring-press flex items-center gap-1.5 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kirim</span>
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3 hover:border-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
              <img
                src={comment.avatar}
                alt={comment.userName}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white font-cinematic">
                    {comment.userName}
                  </span>
                  {comment.badge && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                      {comment.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500">{comment.timeAgo}</span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">{comment.text}</p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleLikeComment(comment.id)}
                  className={`flex items-center gap-1 text-[11px] spring-press transition-colors ${
                    comment.userLiked ? 'text-red-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${comment.userLiked ? 'fill-red-400' : ''}`} />
                  <span>{comment.likes}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
