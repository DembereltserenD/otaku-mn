import { Anime } from './store';

// Types for API responses
export interface ApiAnimeItem {
  id: string;
  title: string;
  imageUrl?: string;
  image_url?: string;
  description?: string;
  releaseDate?: string;
  release_date?: string;
  rating?: number;
  isFavorite?: boolean;
  is_favorite?: boolean;
  genres?: string[];
  type?: string;
  episode_count?: number;
  release_year?: number;
  is_new?: boolean;
}

/**
 * Transform API anime data to a consistent format used throughout the app
 */
export const transformAnimeData = (apiData: ApiAnimeItem): Anime => {
  // Extract or calculate release year
  const releaseYear = apiData.release_year || 
    (apiData.releaseDate 
      ? new Date(apiData.releaseDate).getFullYear() 
      : apiData.release_date 
        ? new Date(apiData.release_date).getFullYear() 
        : undefined);

  return {
    id: apiData.id,
    title: apiData.title,
    image_url: apiData.imageUrl || apiData.image_url || '',
    imageUrl: apiData.imageUrl || apiData.image_url || '', // For backward compatibility
    description: apiData.description || undefined,
    release_date: apiData.releaseDate || apiData.release_date || undefined,
    releaseDate: apiData.releaseDate || apiData.release_date || undefined, // For backward compatibility
    rating: apiData.rating || undefined,
    is_favorite: apiData.isFavorite || apiData.is_favorite || false,
    isFavorite: apiData.isFavorite || apiData.is_favorite || false, // For backward compatibility
    genres: apiData.genres || [],
    type: apiData.type || 'TV',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    episode_count: apiData.episode_count,
    release_year: releaseYear,
    is_new: apiData.is_new || false,
  };
};

/**
 * Transform multiple anime items from API
 */
export const transformAnimeList = (apiDataList: ApiAnimeItem[]): Anime[] => {
  return apiDataList.map(transformAnimeData);
};

/**
 * Format error message in a consistent way
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unknown error occurred';
}; 