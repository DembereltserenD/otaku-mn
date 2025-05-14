import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

export type FavoriteAnime = {
  id: string;
  title: string;
  image_url: string;
  rating: number | null;
  description: string | null;
  release_date: string | null;
  genres?: string[];
  created_at?: string;
  updated_at?: string;
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteAnime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Fetch user's favorite anime list
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // First, get all favorites from the favorites table
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, anime_id, created_at')
        .eq('user_id', user.id);
      
      if (favoritesError) throw favoritesError;
      
      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      // Get the anime details for each favorite
      const animeIds = favoritesData.map(fav => fav.anime_id);
      
      const { data: animeData, error: animeError } = await supabase
        .from('anime')
        .select('*')
        .in('id', animeIds);
      
      if (animeError) throw animeError;
      
      if (animeData) {
        // Map anime data to favorites format
        const formattedFavorites: FavoriteAnime[] = animeData.map(anime => ({
          id: anime.id,
          title: anime.title,
          image_url: anime.image_url,
          rating: anime.rating,
          description: anime.description || null,
          release_date: anime.release_date,
          genres: anime.genres || [],
          created_at: anime.created_at,
          updated_at: anime.updated_at
        }));
        
        setFavorites(formattedFavorites);
      }
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add anime to favorites
  const addToFavorites = useCallback(async (animeId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to add favorites');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if already in favorites to prevent duplicates
      const { data: existingData, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', animeId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
        throw checkError;
      }
      
      if (existingData) {
        // Already in favorites
        return true;
      }
      
      // Add to favorites
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          anime_id: animeId,
        });
      
      if (insertError) throw insertError;
      
      // Get the anime details to add to local state
      const { data: animeData, error: animeError } = await supabase
        .from('anime')
        .select('*')
        .eq('id', animeId)
        .single();
      
      if (animeError) throw animeError;
      
      if (animeData) {
        const newFavorite: FavoriteAnime = {
          id: animeData.id,
          title: animeData.title,
          image_url: animeData.image_url,
          rating: animeData.rating,
          description: animeData.description || null,
          release_date: animeData.release_date,
          genres: animeData.genres || [],
          created_at: animeData.created_at,
          updated_at: animeData.updated_at
        };
        
        setFavorites(prev => [...prev, newFavorite]);
      }
      
      Alert.alert('Success', 'Added to favorites');
      return true;
    } catch (err: any) {
      console.error('Error adding to favorites:', err);
      setError(err.message || 'Failed to add to favorites');
      Alert.alert('Error', 'Failed to add to favorites');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Remove anime from favorites
  const removeFromFavorites = useCallback(async (animeId: string) => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);
      
      if (error) throw error;
      
      // Update local state
      setFavorites(prev => prev.filter(anime => anime.id !== animeId));
      
      Alert.alert('Success', 'Removed from favorites');
      return true;
    } catch (err: any) {
      console.error('Error removing from favorites:', err);
      setError(err.message || 'Failed to remove from favorites');
      Alert.alert('Error', 'Failed to remove from favorites');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if an anime is in the user's favorites
  const isFavorite = useCallback((animeId: string) => {
    return favorites.some(anime => anime.id === animeId);
  }, [favorites]);

  // Navigate to library favorites tab
  const goToFavorites = useCallback(() => {
    router.push({
      pathname: '/library',
      params: { tab: 'favorites' }
    });
  }, [router]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    fetchFavorites();
  }, [user, fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    goToFavorites
  };
};

export default useFavorites;