import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AnimeDetails {
  id: string;
  title: string;
  alternative_titles?: string[];
  description: string;
  image_url?: string;
  cover_image_url?: string;
  release_date?: string;
  release_year?: number;
  season?: string;
  status?: string;
  rating?: number;
  popularity?: number;
  genres?: string[];
  episodes?: Episode[];
  related_anime?: RelatedAnime[];
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  episode_number: number;
  watched?: boolean;
  progress?: number;
}

export interface RelatedAnime {
  id: string;
  title: string;
  image_url?: string;
  relation_type: string; // e.g., "sequel", "prequel", "side_story"
}

/**
 * Custom hook to fetch and manage anime details
 */
const useAnimeDetails = (animeId: string | null) => {
  const [animeDetails, setAnimeDetails] = useState<AnimeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch anime details from Supabase
   */
  const fetchAnimeDetails = useCallback(async (id?: string) => {
    const targetId = id || animeId;
    
    if (!targetId) {
      setError('Anime ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch anime details
      const { data: animeData, error: animeError } = await supabase
        .from('anime')
        .select('*')
        .eq('id', targetId)
        .single();

      if (animeError) throw animeError;

      if (animeData) {
        // Format anime details
        const formattedAnime: AnimeDetails = {
          id: animeData.id,
          title: animeData.title,
          alternative_titles: animeData.alternative_titles || [],
          description: animeData.description || "No description available",
          image_url: animeData.image_url,
          cover_image_url: animeData.cover_image_url || animeData.image_url,
          release_date: animeData.release_date,
          release_year: animeData.release_year,
          season: animeData.season,
          status: animeData.status,
          rating: animeData.rating,
          popularity: animeData.popularity,
          genres: animeData.genres || [],
        };

        // Fetch episodes for this anime
        const { data: episodesData, error: episodesError } = await supabase
          .from('episodes')
          .select('*')
          .eq('anime_id', targetId)
          .order('episode_number', { ascending: true });

        if (episodesError) throw episodesError;

        if (episodesData && episodesData.length > 0) {
          // Format episodes data
          formattedAnime.episodes = episodesData.map((ep) => ({
            id: ep.id,
            title: `Episode ${ep.episode_number}: ${ep.title}`,
            description: ep.description || "",
            thumbnail_url: ep.thumbnail_url || animeData.image_url,
            video_url: ep.video_url || "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
            duration: ep.duration || "24:00",
            episode_number: ep.episode_number,
            watched: false,
            progress: 0,
          }));
        } else {
          formattedAnime.episodes = [];
        }

        // Fetch related anime
        const { data: relatedData, error: relatedError } = await supabase
          .from('anime_relations')
          .select(`
            relation_type,
            related_anime_id,
            related_anime:related_anime_id(id, title, image_url)
          `)
          .eq('anime_id', targetId);

        if (!relatedError && relatedData && relatedData.length > 0) {
          formattedAnime.related_anime = relatedData.map((relation: any) => ({
            id: relation.related_anime?.id,
            title: relation.related_anime?.title,
            image_url: relation.related_anime?.image_url,
            relation_type: relation.relation_type,
          }));
        } else {
          formattedAnime.related_anime = [];
        }

        setAnimeDetails(formattedAnime);
      }
    } catch (err: any) {
      console.error('Error fetching anime details:', err);
      setError(err.message || 'Failed to load anime details');
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  // Automatically fetch details when animeId changes
  useEffect(() => {
    if (animeId) {
      fetchAnimeDetails();
    }
  }, [animeId, fetchAnimeDetails]);

  return {
    animeDetails,
    loading,
    error,
    fetchAnimeDetails,
    setAnimeDetails
  };
};

export default useAnimeDetails;