export type PostType = 'photo' | 'carousel' | 'video' | 'reel' | 'note' | 'quote' | 'link';

export interface QuoteData {
  quote: string;
  author: string;
  source?: string;
  page?: string;
  reflection?: string;
}

export interface LinkData {
  url: string;
  title: string;
  domain: string;
  description?: string;
  image?: string;
}

export interface NoteStyle {
  bgTheme?: 'dark-monochrome' | 'warm-amber' | 'deep-ocean' | 'minimal-light' | 'midnight-violet' | 'emerald';
  fontSize?: 'normal' | 'large' | 'huge';
}

export interface PostItem {
  id: string;
  type: PostType;
  createdAt: string;
  caption: string;
  mediaUrls?: string[];
  videoUrl?: string;
  audioTrack?: string;
  noteBody?: string;
  noteStyle?: NoteStyle;
  quoteData?: QuoteData;
  linkData?: LinkData;
  tags: string[];
  location?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  privateAnnotation?: string;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption?: string;
  createdAt: string;
}

export interface StoryHighlight {
  id: string;
  title: string;
  coverUrl: string;
  stories: StoryItem[];
}

export interface UserProfile {
  username: string;
  displayName: string;
  email?: string;
  bio: string;
  avatarUrl: string;
  theme: 'dark' | 'light';
  joinedAt: string;
  highlights?: StoryHighlight[];
  password?: string;
}

export type NavTab = 'home' | 'search' | 'reels' | 'create' | 'archive' | 'profile';

export type FeedFilter = 'all' | 'favorites' | 'photos' | 'videos' | 'reels' | 'notes' | 'quotes' | 'links';

export const SCROLLER_VERSION = '2.0.0';
