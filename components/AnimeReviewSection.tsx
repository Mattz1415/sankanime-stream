'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquareQuote, Check, Trash2, Edit3, Heart } from 'lucide-react';

interface AnimeReviewSectionProps {
  animeId: string;
  animeTitle: string;
}

interface SavedReview {
  rating: number;
  note: string;
  updatedAt: string;
}

export default function AnimeReviewSection({ animeId, animeTitle }: AnimeReviewSectionProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [note, setNote] = useState('');
  const [savedReview, setSavedReview] = useState<SavedReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const storageKey = `nexus_anime_review_${animeId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: SavedReview = JSON.parse(raw);
        setSavedReview(parsed);
        setRating(parsed.rating);
        setNote(parsed.note);
      }
    } catch {
      // Ignore
    }
  }, [animeId]);

  const handleSave = () => {
    if (rating === 0) {
      alert('Silakan pilih rating bintang terlebih dahulu (1 - 10).');
      return;
    }

    const reviewData: SavedReview = {
      rating,
      note: note.trim(),
      updatedAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(reviewData));
      setSavedReview(reviewData);
      setIsEditing(false);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (e) {
      alert('Gagal menyimpan review ke penyimpanan lokal.');
    }
  };

  const handleDelete = () => {
    if (confirm('Hapus review & rating pribadi untuk anime ini?')) {
      localStorage.removeItem(storageKey);
      setSavedReview(null);
      setRating(0);
      setNote('');
      setIsEditing(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-amber-400" />
          <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
            Rating Pribadi & Catatan Review
          </h3>
        </div>
        {savedReview && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 spring-press px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 spring-press px-2.5 py-1 rounded-lg hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Simpan kesan, nilai skor pribadi (1-10), dan catatan momen berkesan dari seri ini untuk koleksi jurnal Anda:
      </p>

      {/* If already saved and not in edit mode */}
      {savedReview && !isEditing ? (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < savedReview.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-black text-amber-400 ml-2">
                {savedReview.rating} / 10
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">{savedReview.updatedAt}</span>
          </div>

          {savedReview.note ? (
            <p className="text-xs text-zinc-300 italic whitespace-pre-line leading-relaxed">
              &ldquo;{savedReview.note}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-zinc-500 italic">Belum ada catatan tertulis.</p>
          )}
        </div>
      ) : (
        /* Edit or New Review Form */
        <div className="space-y-4">
          {/* Star selector 1-10 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Beri Nilai:</span>
              <span className="text-xs font-black text-amber-400">
                {(hoverRating || rating) > 0 ? `${hoverRating || rating} / 10` : 'Pilih Bintang'}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {Array.from({ length: 10 }).map((_, i) => {
                const starVal = i + 1;
                const isFilled = starVal <= (hoverRating || rating);
                return (
                  <button
                    key={starVal}
                    type="button"
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starVal)}
                    className="p-1 rounded hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Note Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Catatan Pribadi & Ulasan:
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Animasinya luar biasa di episode 8, karakter favorit saya..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400/50 resize-none transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md spring-press flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Ulasan
            </button>
            {savedReview && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-full bg-white/10 text-zinc-300 text-xs hover:text-white spring-press"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      )}

      {savedToast && (
        <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-fade-in-up">
          <Check className="w-3.5 h-3.5" /> Ulasan Anda berhasil disimpan ke jurnal!
        </div>
      )}
    </div>
  );
}
