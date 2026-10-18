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
  progressPercent?: number;
  currentEpisodeNumber?: number | string;
  totalEpisodes?: number | string;
  timestamp: number;
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
