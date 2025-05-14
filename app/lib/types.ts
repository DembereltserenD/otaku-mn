// Common type definitions for the app
export interface Anime {
  id: string;
  title: string;
  image_url: string;
  rating: number | null;
  description?: string | null;
  release_date?: string | null;
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
  genres?: string[];
  episode_count?: number;
  release_year?: number;
  is_new?: boolean;
  type?: string;
} 