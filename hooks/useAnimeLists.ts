import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Alert } from 'react-native';

export type AnimeListType = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface UserAnimeList {
  id: string;
  user_id: string;
  anime_id: string;
  list_type: AnimeListType;
  progress: number;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  anime?: {
    id: string;
    title: string;
    image_url: string;
    genres: string[];
    rating: number | null;
    description: string | null;
    release_date: string | null;
  };
}

const useAnimeLists = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<Record<AnimeListType, UserAnimeList[]>>({
    watching: [],
    completed: [],
    plan_to_watch: [],
    on_hold: [],
    dropped: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's anime lists
  const fetchAnimeLists = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all user anime lists with anime details
      const { data, error: fetchError } = await supabase
        .from('user_anime_lists')
        .select(`
          *,
          anime:anime_id (
            id, 
            title, 
            image_url, 
            genres, 
            rating, 
            description,
            release_date
          )
        `)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (data) {
        // Organize by list type
        const organizedLists: Record<AnimeListType, UserAnimeList[]> = {
          watching: [],
          completed: [],
          plan_to_watch: [],
          on_hold: [],
          dropped: [],
        };

        data.forEach((item) => {
          if (item.list_type in organizedLists) {
            organizedLists[item.list_type as AnimeListType].push(item as UserAnimeList);
          }
        });

        setLists(organizedLists);
      }
    } catch (err: any) {
      console.error('Error fetching anime lists:', err);
      setError(err.message || 'Failed to fetch anime lists');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add anime to a list
  const addToList = useCallback(async (animeId: string, listType: AnimeListType, progress: number = 0, rating?: number, notes?: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to manage your anime lists');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if anime is already in any list
      const { data: existingData, error: checkError } = await supabase
        .from('user_anime_lists')
        .select('id, list_type')
        .eq('user_id', user.id)
        .eq('anime_id', animeId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
        throw checkError;
      }

      if (existingData) {
        // Update existing entry if list type is different
        if (existingData.list_type !== listType) {
          const { error: updateError } = await supabase
            .from('user_anime_lists')
            .update({
              list_type: listType,
              progress: progress,
              rating: rating,
              notes: notes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingData.id);

          if (updateError) throw updateError;

          // Refresh lists after update
          await fetchAnimeLists();
          Alert.alert('Success', `Moved to ${listType.replace('_', ' ')}`);
        } else {
          Alert.alert('Info', `Anime is already in your ${listType.replace('_', ' ')} list`);
        }
      } else {
        // Insert new entry
        const { error: insertError } = await supabase
          .from('user_anime_lists')
          .insert({
            user_id: user.id,
            anime_id: animeId,
            list_type: listType,
            progress: progress,
            rating: rating,
            notes: notes,
          });

        if (insertError) throw insertError;

        // Refresh lists after insert
        await fetchAnimeLists();
        Alert.alert('Success', `Added to ${listType.replace('_', ' ')}`);
      }

      return true;
    } catch (err: any) {
      console.error(`Error adding anime to ${listType}:`, err);
      setError(err.message || `Failed to add anime to ${listType}`);
      Alert.alert('Error', `Failed to add anime to ${listType.replace('_', ' ')}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchAnimeLists]);

  // Remove anime from a list
  const removeFromList = useCallback(async (animeId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to manage your anime lists');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('user_anime_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);

      if (deleteError) throw deleteError;

      // Refresh lists after delete
      await fetchAnimeLists();
      Alert.alert('Success', 'Removed from list');
      return true;
    } catch (err: any) {
      console.error('Error removing anime from list:', err);
      setError(err.message || 'Failed to remove anime from list');
      Alert.alert('Error', 'Failed to remove anime from list');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchAnimeLists]);

  // Update anime progress
  const updateProgress = useCallback(async (animeId: string, progress: number) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to update progress');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_anime_lists')
        .update({
          progress: progress,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('anime_id', animeId);

      if (updateError) throw updateError;

      // Refresh lists after update
      await fetchAnimeLists();
      return true;
    } catch (err: any) {
      console.error('Error updating progress:', err);
      setError(err.message || 'Failed to update progress');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchAnimeLists]);

  // Check if anime is in any list and return the list type
  const getAnimeListStatus = useCallback((animeId: string): { inList: boolean, listType?: AnimeListType } => {
    for (const [listType, animeList] of Object.entries(lists)) {
      if (animeList.some(item => item.anime_id === animeId)) {
        return { inList: true, listType: listType as AnimeListType };
      }
    }
    return { inList: false };
  }, [lists]);

  // Load lists on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchAnimeLists();
    } else {
      // Reset lists when user logs out
      setLists({
        watching: [],
        completed: [],
        plan_to_watch: [],
        on_hold: [],
        dropped: [],
      });
    }
  }, [user, fetchAnimeLists]);

  return {
    lists,
    loading,
    error,
    fetchAnimeLists,
    addToList,
    removeFromList,
    updateProgress,
    getAnimeListStatus,
  };
};

export default useAnimeLists;