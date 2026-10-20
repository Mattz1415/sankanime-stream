export type WatchlistCategory = 'Sedang Ditonton' | 'Ingin Ditonton' | 'Selesai' | 'Favorit';

export interface AnimeListItem {
  title: string;
  poster: string;
  episodes?: number | string | null;
  releaseDay?: string;
  latestReleaseDate?: string;
  animeId: string;
  href?: string;
  otakudesuUrl?: string;
  score?: string;
  status?: string;
  slug?: string;
  genres?: string[];
  genreList?: {
    title: string;
    genreId: string;
    href: string;
  }[];
}

export interface HomeData {
  ongoing: {
    href?: string;
    animeList: AnimeListItem[];
  };
  complete: {
    href?: string;
    animeList: AnimeListItem[];
  };
}

export interface AnimeDetail {
  title: string;
  poster: string;
  japanese?: string;
  score?: string;
  producers?: string;
  type?: string;
  status?: string;
  episodes?: number | string | null;
  duration?: string;
  aired?: string;
  studios?: string;
  batch?: any;
  synopsis: {
    paragraphs: string[];
    connections?: any[];
  };
  genreList: {
    title: string;
    genreId: string;
    href: string;
  }[];
  episodeList: {
    title: string;
    eps: number | string;
    date: string;
    episodeId: string;
    href: string;
  }[];
}

export interface QualityServer {
  title: string;
  serverId: string;
  href: string;
}

export interface QualityGroup {
  title: string;
  serverList: QualityServer[];
}

export interface EpisodeDetail {
  title: string;
  animeId: string;
  releaseTime?: string;
  defaultStreamingUrl: string;
  hasPrevEpisode: boolean;
  prevEpisode?: {
    title: string;
    episodeId: string;
    href: string;
  } | null;
  hasNextEpisode: boolean;
  nextEpisode?: {
    title: string;
    episodeId: string;
    href: string;
  } | null;
  server: {
    qualities: QualityGroup[];
  };
  info?: {
    title?: string;
    poster?: string;
    score?: string;
    type?: string;
    genreList?: {
      title: string;
      genreId: string;
      href: string;
    }[];
    episodeList?: {
      title: string;
      eps: number | string;
      date: string;
      episodeId: string;
      href: string;
    }[];
  };
}

export interface ScheduleItem {
  title: string;
  animeId: string;
  slug?: string;
  href?: string;
  url?: string;
  poster?: string;
}

export interface ScheduleDay {
  day: string;
  animeList?: ScheduleItem[];
  anime_list?: ScheduleItem[];
}

export interface WatchHistoryItem {
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeTitle: string;
  poster: string;
  lastSeconds?: number;
  durationSeconds?: number;
  progressPercent?: number;
  currentEpisodeNumber?: number | string;
  totalEpisodes?: number | string;
  timestamp: number;
}

export interface WatchLaterItem {
  animeId: string;
  title: string;
  poster: string;
  score?: string;
  status?: string;
  episodes?: string | number | null;
  addedAt: number;
  note?: string;
}

export interface DownloadEpisodeItem {
  id: string;
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeTitle: string;
  poster: string;
  quality: string;
  serverName: string;
  downloadUrl: string;
  fileSize?: string;
  status: 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number; // 0 - 100
  downloadedAt: number;
  localPath?: string;
}

export interface CommunityComment {
  id: string;
  targetId: string; // animeId or episodeId or 'global'
  targetTitle?: string;
  user: {
    name: string;
    avatar: string;
    badge?: 'VIP' | 'MEMBER' | 'MOD' | 'TOP_CONTRIBUTOR';
  };
  content: string; // supports ||spoiler text||
  hasSpoiler: boolean;
  createdAt: number;
  likes: number;
  userLiked?: boolean;
  replies?: CommunityComment[];
}

export interface PlayerSettings {
  subtitleSize: 'small' | 'medium' | 'large' | 'xlarge';
  subtitleColor: 'white' | 'yellow' | 'cyan';
  subtitleBackground: 'none' | 'shadow' | 'semi-black';
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  defaultQuality: '360p' | '480p' | '720p' | '1080p';
  preferredServer: string;
}

export interface BookmarkItem {
  animeId: string;
  title: string;
  poster: string;
  score?: string;
  status?: string;
  category?: WatchlistCategory;
  genres?: string[];
  addedAt: number;
}

export interface ServerStreamResult {
  url: string;
  isDirectVideo: boolean;
  rawHtml?: string;
}

export type MediaCategory = 'Anime' | 'Donghua' | 'Drakor' | 'Manhwa' | 'Komik' | 'Film' | 'LK21 Film';

// Drakor (K-Drama) Types
export interface DrakorItem {
  id: string;
  title: string;
  alterTitle?: string;
  endpoint: string;
  thumbnail: string;
  poster?: string;
  eps?: string;
  rating?: string;
  year?: string;
  time?: string;
  quality?: string;
  status?: string;
  synopsis?: string;
  genres?: string[];
  type?: 'Series' | 'Movie';
  tmdbId?: string | number;
  updatedAt?: string;
}

export interface DrakorEpisode {
  episodeNumber: number | string;
  title: string;
  endpoint?: string;
  streamUrl?: string;
  servers?: Array<{ name: string; url: string }>;
}

export interface DrakorDetail {
  id: string;
  title: string;
  alterTitle?: string;
  thumbnail: string;
  synopsis: string;
  rating: string;
  status: string;
  year: string;
  genres: string[];
  totalEpisodes: number | string;
  network?: string;
  cast?: string[];
  episodes: DrakorEpisode[];
}

// Donghua Types
export interface DonghuaItem {
  title: string;
  slug: string;
  poster: string;
  status?: string;
  type?: string;
  currentEpisode?: string;
  href?: string;
  rating?: string;
}

export interface DonghuaDetail {
  title: string;
  alterTitle?: string;
  poster: string;
  rating?: string;
  status: string;
  studio?: string;
  network?: string;
  released?: string;
  episodesCount?: string | number;
  synopsis: string;
  genres: string[];
  episodesList: Array<{
    title: string;
    slug: string;
    episodeNumber?: string | number;
  }>;
}

export interface DonghuaEpisodeStream {
  episodeTitle: string;
  mainUrl: string;
  servers: Array<{
    name: string;
    url: string;
  }>;
}

// Comic & Manhwa Types
export interface ComicItem {
  title: string;
  slug: string;
  image: string;
  chapter?: string;
  link?: string;
  type?: 'Manga' | 'Manhwa' | 'Manhua';
  description?: string;
  score?: string;
}

export interface ComicDetail {
  title: string;
  titleIndonesian?: string;
  slug: string;
  image: string;
  synopsis: string;
  metadata?: {
    type?: string;
    author?: string;
    status?: string;
    concept?: string;
    ageRating?: string;
    readingDirection?: string;
    year?: string;
  };
  genres: Array<{
    name: string;
    slug: string;
  }>;
  chapters: Array<{
    chapter: string;
    slug: string;
    date?: string;
    link?: string;
  }>;
}

export interface ComicChapterData {
  title?: string;
  chapterSlug: string;
  images: string[];
  navigation?: {
    previousChapter?: string;
    nextChapter?: string;
    chapterList?: string;
  };
}

// LK21 Movie Types
export interface MovieItem {
  id: string; // IMDB or TMDB ID e.g. tt6263850
  title: string;
  year: string;
  poster: string;
  rating: string;
  genre: string;
  duration?: string;
  synopsis: string;
  quality?: string;
  category: 'Box Office' | 'Marvel' | 'Action' | 'Horror' | 'Anime Movie' | 'K-Drama';
}
