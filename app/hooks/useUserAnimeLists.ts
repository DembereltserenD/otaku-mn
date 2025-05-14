import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { useErrorStore } from '@/lib/store';

export interface UserAnimeListItem {
  id: string;
  anime_id: string;
  title: string;
  image_url: string;
  rating: number;
  progress: number;
  list_type: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';
  created_at: string;
  genres?: string[];
  notes?: string;
}

interface UserAnimeLists {
  watching: UserAnimeListItem[];
  completed: UserAnimeListItem[];
  plan_to_watch: UserAnimeListItem[];
  on_hold: UserAnimeListItem[];
  dropped: UserAnimeListItem[];
}

const useUserAnimeLists = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<UserAnimeLists>({
    watching: [],
    completed: [],
    plan_to_watch: [],
    on_hold: [],
    dropped: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addError = useErrorStore(state => state.addError);

  // Fetch user anime lists from Supabase
  const fetchUserAnimeLists = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query user anime lists with joined anime data
      const { data, error: fetchError } = await supabase
        .from('user_anime_lists')
        .select(`
          id,
          list_type,
          progress,
          rating,
          notes,
          created_at,
          anime:anime_id (
            id,
            title,
            image_url,
            genres,
            rating
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        // Transform data into the expected format
        const transformedData: UserAnimeLists = {
          watching: [],
          completed: [],
          plan_to_watch: [],
          on_hold: [],
          dropped: []
        };

        // Use any type to bypass TypeScript checking for the Supabase response
        (data as any[]).forEach(item => {
          if (item.anime) {
            const listItem: UserAnimeListItem = {
              id: item.id,
              anime_id: item.anime.id,
              title: item.anime.title,
              image_url: item.anime.image_url,
              rating: item.rating || item.anime.rating || 0,
              progress: item.progress || 0,
              list_type: item.list_type as 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped',
              created_at: item.created_at,
              genres: item.anime.genres,
              notes: item.notes || undefined
            };

            // Add to the appropriate list
            const listType = item.list_type as keyof UserAnimeLists;
            if (transformedData[listType]) {
              transformedData[listType].push(listItem);
            }
          }
        });

        setLists(transformedData);
      }
    } catch (err) {
      console.error('Error fetching user anime lists:', err);
      setError('Failed to fetch your anime lists');
      addError('Failed to fetch your anime lists. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, addError]);

  // Add anime to a list
  const addAnimeToList = useCallback(async (
    animeId: string,
    listType: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped',
    progress: number = 0,
    rating: number | null = null,
    notes: string = ''
  ) => {
    if (!user) return false;

    try {
      // Check if anime exists in any list
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
        // Update existing entry
        const { error: updateError } = await supabase
          .from('user_anime_lists')
          .update({
            list_type: listType,
            progress,
            rating,
            notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from('user_anime_lists')
          .insert({
            user_id: user.id,
            anime_id: animeId,
            list_type: listType,
            progress,
            rating,
            notes
          });

        if (insertError) throw insertError;
      }

      // Refresh lists
      await fetchUserAnimeLists();
      return true;
    } catch (err) {
      console.error('Error adding anime to list:', err);
      addError('Failed to add anime to your list. Please try again later.');
      return false;
    }
  }, [user, fetchUserAnimeLists, addError]);

  // Update anime in a list
  const updateAnimeInList = useCallback(async (
    listItemId: string,
    updates: {
      progress?: number;
      rating?: number | null;
      notes?: string;
      list_type?: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';
    }
  ) => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('user_anime_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', listItemId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refresh lists
      await fetchUserAnimeLists();
      return true;
    } catch (err) {
      console.error('Error updating anime in list:', err);
      addError('Failed to update anime in your list. Please try again later.');
      return false;
    }
  }, [user, fetchUserAnimeLists, addError]);

  // Remove anime from a list
  const removeAnimeFromList = useCallback(async (listItemId: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('user_anime_lists')
        .delete()
        .eq('id', listItemId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Refresh lists
      await fetchUserAnimeLists();
      return true;
    } catch (err) {
      console.error('Error removing anime from list:', err);
      addError('Failed to remove anime from your list. Please try again later.');
      return false;
    }
  }, [user, fetchUserAnimeLists, addError]);

  // Fetch lists on component mount or when user changes
  useEffect(() => {
    if (user) {
      fetchUserAnimeLists();
    } else {
      setLists({
        watching: [],
        completed: [],
        plan_to_watch: [],
        on_hold: [],
        dropped: []
      });
      setLoading(false);
    }
  }, [user, fetchUserAnimeLists]);

  return {
    lists,
    loading,
    error,
    fetchUserAnimeLists,
    addAnimeToList,
    updateAnimeInList,
    removeAnimeFromList
  };
};

export default useUserAnimeLists;
