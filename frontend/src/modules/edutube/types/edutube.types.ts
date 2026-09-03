/**
 * EduTube Frontend Types (Phase 3A + Phase 3B + Phase 3C)
 * Matches the normalized backend API contracts.
 */

export interface EduTubeThumbnail {
  default: string;
  medium?: string;
  high?: string;
  standard?: string;
  maxres?: string;
}

export interface EduTubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail: EduTubeThumbnail;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  embedUrl: string;
  youtubeUrl: string;
  educationalScore?: number;
  educationalSignals?: string[];
  liveBroadcastContent?: string;
}

export interface EduTubeVideoDetail {
  videoId: string;
  title: string;
  description: string;
  channel: string;
  channelId: string;
  thumbnails: EduTubeThumbnail;
  publishedAt: string;
  duration: {
    raw: string;
    seconds: number;
    formatted: string;
  };
  tags: string[];
  categoryId: string;
  statistics: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  embeddable: boolean;
  liveStatus: string;
  youtubeUrl: string;
  embedUrl: string | null;
}

export type EduTubeLanguage = "all" | "en" | "kn" | "hi" | "ml" | "ta" | "te";
export type EduTubeLevel = "all" | "beginner" | "intermediate" | "advanced";
export type EduTubeDuration = "all" | "short" | "medium" | "long";
export type EduTubeSort = "relevance" | "date" | "rating" | "viewcount";

export interface EduTubeSearchParams {
  q: string;
  language?: EduTubeLanguage;
  regionCode?: string;
  pageToken?: string;
  maxResults?: number;
  level?: EduTubeLevel;
  duration?: EduTubeDuration;
  sort?: EduTubeSort;
}

export interface EduTubeSearchResult {
  items: EduTubeVideoItem[];
  nextPageToken: string | null;
  prevPageToken: string | null;
  totalResults: number;
  cached: boolean;
  query: string;
}

// ==========================================
// PHASE 3B: PERSISTENCE TYPES
// ==========================================

export interface WatchHistoryItem {
  _id?: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: any;
  durationSeconds: number;
  positionSeconds: number;
  completed: boolean;
  watchedAt: string;
}

export interface VideoProgress {
  videoId: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  percentage: number;
  lastUpdated?: string;
}

export interface ContinueLearningItem {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: any;
  durationSeconds: number;
  positionSeconds: number;
  remainingSeconds: number;
  percentage: number;
  completed: boolean;
  lastUpdated?: string;
}

export interface SavedVideo {
  _id?: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: any;
  savedAt: string;
}

export interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: any;
  durationSeconds: number;
  addedAt: string;
  completed?: boolean;
  percentage?: number;
  positionSeconds?: number;
}

export interface Playlist {
  _id: string;
  name: string;
  description: string;
  videos: PlaylistVideo[];
  totalVideos?: number;
  completedVideos?: number;
  progressPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoNote {
  _id: string;
  videoId: string;
  content: string;
  timestampSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningStats {
  videosWatched: number;
  completedVideos: number;
  activePlaylists: number;
  savedVideos: number;
}

// ==========================================
// PHASE 3C: PERSONALIZED AI LEARNING TYPES
// ==========================================

export interface PersonalizedRecommendation extends EduTubeVideoItem {
  personalizationScore: number;
  whyRecommended: string[];
  topic?: string;
}

export interface PersonalizedFeedData {
  personalized: PersonalizedRecommendation[];
  skillGaps: PersonalizedRecommendation[];
  careerPath: PersonalizedRecommendation[];
  basedOnHistory: PersonalizedRecommendation[];
  projectLearning: PersonalizedRecommendation[];
  trending: PersonalizedRecommendation[];
  learningContext: {
    targetRole: string;
    topSkills: Array<{ skill: string; level: string; score: number }>;
    skillGaps: Array<{ skill: string; priority: string }>;
    completedCount: number;
    historyCount: number;
  };
  generatedAt: string;
  cached: boolean;
}

export type FeedbackAction = "not_interested" | "already_know" | "more_like_this";

export interface LearningTrackLesson {
  order: number;
  lessonTitle: string;
  learningObjective: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  embedUrl: string;
  youtubeUrl: string;
  educationalScore: number;
}

export interface LearningTrack {
  trackTitle: string;
  description: string;
  targetRole: string;
  topic: string;
  lessons: LearningTrackLesson[];
}
