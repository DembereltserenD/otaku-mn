import { useCallback } from 'react';
import { useAnimeStore } from '@/lib/store';
import { transformAnimeList, formatErrorMessage } from '@/lib/transformers';
import supabase from '@/lib/supabase';

interface AnimeItem {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  releaseDate?: string;
  rating?: number;
  isFavorite?: boolean;
  genres?: string[];
  type?: string;
}

interface AnimeDataState {
  newReleases: AnimeItem[];
  trending: AnimeItem[];
  popular: AnimeItem[];
}

interface LoadingState {
  newReleases: boolean;
  trending: boolean;
  popular: boolean;
}

// Mock data arrays are kept as fallback in case of API failures
const mockNewReleases = [
  {
    id: "101",
    title: "Demon Slayer: Entertainment District Arc",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
    description: "Tanjiro and his friends join the Sound Hashira to battle demons in a district full of entertainment.",
    releaseDate: "2022-12-05",
    rating: 4.9,
    isFavorite: false,
    genres: ["Action", "Fantasy", "Supernatural"],
    type: "TV"
  },
  {
    id: "102",
    title: "Attack on Titan: Final Season",
    imageUrl: "https://images.unsplash.com/photo-1541562232579-512a21325720?w=400&q=80",
    description: "The final battle begins as Eren pursues a path that will lead to destruction.",
    releaseDate: "2022-01-09",
    rating: 4.8,
    isFavorite: false,
    genres: ["Action", "Drama", "Fantasy"],
    type: "TV"
  },
  {
    id: "103",
    title: "Jujutsu Kaisen 0",
    imageUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&q=80",
    description: "A prequel focusing on Yuta Okkotsu who becomes a sorcerer when his childhood friend turns into a curse.",
    releaseDate: "2021-12-24",
    rating: 4.7,
    isFavorite: false,
    genres: ["Action", "Fantasy", "Horror"],
    type: "Movie"
  },
  {
    id: "104",
    title: "My Hero Academia: World Heroes' Mission",
    imageUrl: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&q=80",
    description: "A terrorist group threatens the lives of quirk users around the world.",
    releaseDate: "2021-08-06",
    rating: 4.5,
    isFavorite: false,
    genres: ["Action", "Adventure", "Sci-Fi"],
    type: "Movie"
  }
];

const mockTrending = [
  {
    id: "201",
    title: "Chainsaw Man",
    imageUrl: "https://images.unsplash.com/photo-1641154748135-8032aa150ae9?w=400&q=80",
    description: "Denji becomes a devil hunter to pay off his father's debts and has dreams of a comfortable life.",
    releaseDate: "2022-10-11",
    rating: 4.9,
    isFavorite: false,
    genres: ["Action", "Horror", "Supernatural"],
    type: "TV"
  },
  {
    id: "202",
    title: "Spy x Family",
    imageUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&q=80",
    description: "A spy forms a fake family to complete his mission, unaware that his adopted daughter is a telepath and his wife is an assassin.",
    releaseDate: "2022-04-09",
    rating: 4.8,
    isFavorite: false,
    genres: ["Action", "Comedy", "Slice of Life"],
    type: "TV"
  }
];

/**
 * Hook to fetch and manage anime data from Supabase
 * Falls back to mock data only if the Supabase fetch fails
 */
const useAnimeData = () => {
  // Get data and actions from the store
  const { 
    trending, 
    newReleases, 
    popular,
    loading,
    error,
    setTrending,
    setNewReleases, 
    setPopular,
    setLoading,
    setError
  } = useAnimeStore();

  // Fetch new releases from Supabase
  const fetchNewReleases = useCallback(async () => {
    // Set loading state
    setLoading('newReleases', true);
    // Clear previous errors
    setError('newReleases', null);
    
    try {
      // Fetch data from Supabase - sort by release_date for new releases
      const { data, error: supabaseError } = await supabase
        .from('anime')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(10);
      
      if (supabaseError) throw supabaseError;
      
      if (data && data.length > 0) {
        // Transform and store the real data
        const transformedData = transformAnimeList(data);
        setNewReleases(transformedData);
      } else {
        console.warn('No new releases found in Supabase, using mock data as fallback');
        // Fall back to mock data only if no data was found
        const transformedData = transformAnimeList(mockNewReleases);
        setNewReleases(transformedData);
      }
    } catch (err) {
      // Format error consistently
      const errorMessage = formatErrorMessage(err);
      setError('newReleases', errorMessage);
      console.error("Error fetching new releases:", err);
      
      // Fall back to mock data on error
      console.warn('Falling back to mock data due to error');
      const transformedData = transformAnimeList(mockNewReleases);
      setNewReleases(transformedData);
    } finally {
      setLoading('newReleases', false);
    }
  }, [setLoading, setNewReleases, setError]);

  // Fetch trending anime from Supabase
  const fetchTrending = useCallback(async () => {
    setLoading('trending', true);
    setError('trending', null);
    
    try {
      // Fetch data from Supabase - sort by rating for trending
      const { data, error: supabaseError } = await supabase
        .from('anime')
        .select('*')
        .order('rating', { ascending: false })
        .limit(10);
      
      if (supabaseError) throw supabaseError;
      
      if (data && data.length > 0) {
        // Transform and store the real data
        const transformedData = transformAnimeList(data);
        setTrending(transformedData);
      } else {
        console.warn('No trending anime found in Supabase, using mock data as fallback');
        // Fall back to mock data only if no data was found
        const transformedData = transformAnimeList(mockTrending);
        setTrending(transformedData);
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError('trending', errorMessage);
      console.error("Error fetching trending anime:", err);
      
      // Fall back to mock data on error
      console.warn('Falling back to mock data due to error');
      const transformedData = transformAnimeList(mockTrending);
      setTrending(transformedData);
    } finally {
      setLoading('trending', false);
    }
  }, [setLoading, setTrending, setError]);

  // Fetch popular anime from Supabase
  const fetchPopular = useCallback(async () => {
    setLoading('popular', true);
    setError('popular', null);
    
    try {
      // Fetch data from Supabase
      const { data, error: supabaseError } = await supabase
        .from('anime')
        .select('*')
        .order('rating', { ascending: false })
        .limit(10);
      
      if (supabaseError) throw supabaseError;
      
      if (data && data.length > 0) {
        // Transform and store the real data
        const transformedData = transformAnimeList(data);
        setPopular(transformedData);
      } else {
        console.warn('No popular anime found in Supabase, using mock data as fallback');
        // Fall back to mock data only if no data was found
        setPopular([]);
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError('popular', errorMessage);
      console.error("Error fetching popular anime:", err);
      
      // Don't set any fallback data for popular if there's an error
      setPopular([]);
    } finally {
      setLoading('popular', false);
    }
  }, [setLoading, setPopular, setError]);

  return {
    newReleases,
    trending,
    popular,
    loading,
    error,
    fetchNewReleases,
    fetchTrending,
    fetchPopular
  };
};

export default useAnimeData;