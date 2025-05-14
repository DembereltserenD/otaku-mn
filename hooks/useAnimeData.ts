import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type AnimeData = {
  id: string;
  title: string;
  image_url: string;
  genres: string[];
  rating: number | null;
  description: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  release_year: number | null;
  season: string | null;
  status: string | null;
  popularity: number | null;
  alternative_titles: string[] | null;
  created_at: string;
  updated_at: string;
};

// UseAnimeData hook
const useAnimeData = () => {
  const [trending, setTrending] = useState<AnimeData[]>([]);
  const [newReleases, setNewReleases] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState({
    trending: false,
    newReleases: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch trending anime
  const fetchTrending = useCallback(async () => {
    setLoading(prev => ({ ...prev, trending: true }));
    setError(null);
    
    try {
      // Fetch trending anime from Supabase using the trending_anime view
      const { data, error: supabaseError } = await supabase
        .from('trending_anime')
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(10);
      
      if (supabaseError) throw supabaseError;
      
      if (data) {
        setTrending(data);
      }
    } catch (err: any) {
      console.error('Error fetching trending anime:', err);
      setError(err.message || 'Failed to fetch trending anime');
    } finally {
      setLoading(prev => ({ ...prev, trending: false }));
    }
  }, []);

  // Fetch new releases
  const fetchNewReleases = useCallback(async () => {
    setLoading(prev => ({ ...prev, newReleases: true }));
    setError(null);
    
    try {
      // Get current date
      const today = new Date();
      
      // Get date from 3 months ago
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      // Format dates for Supabase query
      const fromDate = threeMonthsAgo.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      
      // Fetch new releases from Supabase
      const { data, error: supabaseError } = await supabase
        .from('anime')
        .select('*')
        .gte('release_date', fromDate)
        .lte('release_date', toDate)
        .order('release_date', { ascending: false })
        .limit(10);
      
      if (supabaseError) throw supabaseError;
      
      if (data) {
        setNewReleases(data);
      }
    } catch (err: any) {
      console.error('Error fetching new releases:', err);
      setError(err.message || 'Failed to fetch new releases');
    } finally {
      setLoading(prev => ({ ...prev, newReleases: false }));
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchTrending();
    fetchNewReleases();
  }, [fetchTrending, fetchNewReleases]);

  return {
    trending,
    newReleases,
    loading,
    error,
    fetchTrending,
    fetchNewReleases,
  };
};

export default useAnimeData;