import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Properly typed interfaces
export interface Anime {
  id: string;
  title: string;
  image_url: string;
  rating?: number;
  is_favorite?: boolean;
  description?: string;
  release_date?: string;
  created_at: string;
  updated_at: string;
  genres?: string[];
  type?: string;
  // Additional properties required by components
  episode_count?: number;
  release_year?: number;
  is_new?: boolean;
  // For backward compatibility
  imageUrl?: string;
  isFavorite?: boolean;
  releaseDate?: string;
}

interface AnimeState {
  trending: Anime[];
  newReleases: Anime[];
  popular: Anime[];
  favorites: Anime[];
  loading: {
    trending: boolean;
    newReleases: boolean;
    popular: boolean;
  };
  error: {
    trending: string | null;
    newReleases: string | null;
    popular: string | null;
  };
  // Actions
  setTrending: (trending: Anime[]) => void;
  setNewReleases: (newReleases: Anime[]) => void;
  setPopular: (popular: Anime[]) => void;
  setLoading: (key: 'trending' | 'newReleases' | 'popular', isLoading: boolean) => void;
  setError: (key: 'trending' | 'newReleases' | 'popular', error: string | null) => void;
  toggleFavorite: (animeId: string) => void;
}

// Create store with persistence
export const useAnimeStore = create<AnimeState>()(
  persist(
    (set) => ({
      trending: [],
      newReleases: [],
      popular: [],
      favorites: [],
      loading: {
        trending: false,
        newReleases: false,
        popular: false,
      },
      error: {
        trending: null,
        newReleases: null,
        popular: null,
      },
      
      // Actions
      setTrending: (trending) => set({ trending }),
      setNewReleases: (newReleases) => set({ newReleases }),
      setPopular: (popular) => set({ popular }),
      
      setLoading: (key, isLoading) => 
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: isLoading,
          },
        })),
        
      setError: (key, error) => 
        set((state) => ({
          error: {
            ...state.error,
            [key]: error,
          },
        })),
        
      toggleFavorite: (animeId) => 
        set((state) => {
          // Check if anime is already in favorites
          const existingIndex = state.favorites.findIndex(anime => anime.id === animeId);
          
          if (existingIndex >= 0) {
            // Remove from favorites
            return {
              favorites: state.favorites.filter(anime => anime.id !== animeId),
            };
          } else {
            // Find anime in any list
            const anime = 
              state.trending.find(a => a.id === animeId) ||
              state.newReleases.find(a => a.id === animeId) ||
              state.popular.find(a => a.id === animeId);
              
            if (!anime) return state;
            
            // Add to favorites
            return {
              favorites: [...state.favorites, { ...anime, is_favorite: true }],
            };
          }
        }),
    }),
    {
      name: 'anime-storage', // unique name for storage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: state.favorites, // Only persist favorites
      }),
    }
  )
);

// Error handling store
interface ErrorState {
  errors: Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: number;
  }>;
  addError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],
  addError: (message, type = 'error') => 
    set((state) => ({
      errors: [
        ...state.errors,
        {
          id: Date.now().toString(),
          message,
          type,
          timestamp: Date.now(),
        },
      ],
    })),
  removeError: (id) => 
    set((state) => ({
      errors: state.errors.filter(error => error.id !== id),
    })),
  clearErrors: () => set({ errors: [] }),
})); 