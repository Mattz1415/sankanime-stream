import { BookmarkItem, WatchHistoryItem, WatchlistCategory } from './types';

const HISTORY_KEY = 'nexus_anime_history_v1';
const BOOKMARK_KEY = 'nexus_anime_bookmarks_v1';

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchHistory(item: Omit<WatchHistoryItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getWatchHistory();
    // Remove if exists
    const filtered = current.filter((h) => h.episodeId !== item.episodeId);
    const updated: WatchHistoryItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, 50); // keep last 50
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save watch history:', err);
  }
}

export function deleteWatchHistoryItem(episodeId: string): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getWatchHistory();
    const updated = current.filter((h) => h.episodeId !== episodeId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearWatchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isAnimeBookmarked(animeId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.animeId === animeId);
}

export function getAnimeBookmark(animeId: string): BookmarkItem | undefined {
  const bookmarks = getBookmarks();
  return bookmarks.find((b) => b.animeId === animeId);
}

export function saveBookmarkWithCategory(
  item: Omit<BookmarkItem, 'addedAt'>,
  category: WatchlistCategory = 'Ingin Ditonton'
): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter((b) => b.animeId !== item.animeId);
    const updated: BookmarkItem[] = [
      { ...item, category, addedAt: Date.now() },
      ...filtered,
    ];
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function updateBookmarkCategory(animeId: string, category: WatchlistCategory): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = getBookmarks();
    const updated = bookmarks.map((b) =>
      b.animeId === animeId ? { ...b, category } : b
    );
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteBookmark(animeId: string): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = getBookmarks();
    const updated = bookmarks.filter((b) => b.animeId !== animeId);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function toggleBookmark(
  item: Omit<BookmarkItem, 'addedAt'>,
  defaultCategory: WatchlistCategory = 'Favorit'
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((b) => b.animeId === item.animeId);
    let updated: BookmarkItem[];
    if (exists) {
      updated = bookmarks.filter((b) => b.animeId !== item.animeId);
    } else {
      updated = [{ ...item, category: defaultCategory, addedAt: Date.now() }, ...bookmarks];
    }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}
