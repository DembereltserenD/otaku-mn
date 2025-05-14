import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimeData } from './useAnimeData';

interface SearchFilters {
  genres?: string[];
  year?: number | null;
  rating?: number | null;
  status?: 'ongoing' | 'completed' | 'upcoming' | null;
}

/**
 * Custom hook for anime search functionality
 */
const useAnimeSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchResults, setSearchResults] = useState<AnimeData[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Search for anime based on the query and filters
   */
  const searchAnime = useCallback(async (query?: string, searchFilters?: SearchFilters) => {
    const activeQuery = query !== undefined ? query : searchQuery;
    const activeFilters = searchFilters || filters;
    
    // Don't search if query is too short
    if (activeQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Build the Supabase query
      let animeQuery = supabase
        .from('anime')
        .select('*');
      
      // Add text search filter
      animeQuery = animeQuery.ilike('title', `%${activeQuery}%`);
      
      // Add genre filter if specified
      if (activeFilters.genres && activeFilters.genres.length > 0) {
        // For array columns, we need to use the contains operator
        const genreConditions = activeFilters.genres.map(genre => 
          `genres.cs.{${genre}}`
        );
        animeQuery = animeQuery.or(genreConditions.join(','));
      }
      
      // Add year filter if specified
      if (activeFilters.year) {
        animeQuery = animeQuery.eq('release_year', activeFilters.year);
      }
      
      // Add rating filter if specified
      if (activeFilters.rating) {
        animeQuery = animeQuery.gte('rating', activeFilters.rating);
      }
      
      // Add status filter if specified
      if (activeFilters.status) {
        animeQuery = animeQuery.eq('status', activeFilters.status);
      }
      
      // Execute the query
      const { data, error: searchError } = await animeQuery
        .order('popularity', { ascending: false })
        .limit(20);
      
      if (searchError) throw searchError;
      
      if (data) {
        setSearchResults(data);
        
        // Save to recent searches if not already present
        if (activeQuery.trim() && !recentSearches.includes(activeQuery)) {
          setRecentSearches(prev => [activeQuery, ...prev].slice(0, 10));
        }
      }
    } catch (err: any) {
      console.error('Error searching anime:', err);
      setError(err.message || 'Failed to search for anime');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, recentSearches]);

  // Search when query or filters change
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        searchAnime();
      }
    }, 500); // Debounce search

    return () => clearTimeout(delaySearch);
  }, [searchQuery, filters, searchAnime]);

  /**
   * Clear search results and query
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  /**
   * Update search filters
   */
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    searchResults,
    recentSearches,
    loading,
    error,
    searchAnime,
    clearSearch,
    updateFilters,
    resetFilters,
  };
};

export default useAnimeSearch;