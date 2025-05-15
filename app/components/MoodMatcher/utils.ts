import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnimeItem {
  id: number;
  title: string;
  cover_image?: string;
  image_url?: string;
  score?: number;
  release_year?: number;
  genres?: string[];
}

// Calculate cosine similarity between two vectors
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must be of the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Mock function to sort anime based on mood without API
export function sortAnimeMock(animeList: AnimeItem[], mood: string) {
  // Define mood vectors (simplified for example)
  const moodVectors: { [key: string]: number[] } = {
    happy: [0.8, 0.7, 0.2, 0.1, 0.9],
    sad: [0.2, 0.3, 0.8, 0.7, 0.1],
    excited: [0.9, 0.8, 0.3, 0.2, 0.7],
    relaxed: [0.4, 0.6, 0.5, 0.3, 0.2],
    thoughtful: [0.5, 0.4, 0.6, 0.8, 0.3],
  };

  // Default to 'happy' if mood not found
  const moodVector = moodVectors[mood.toLowerCase()] || moodVectors.happy;

  // Assign random vectors to anime (in a real app, these would be derived from anime attributes)
  const animeWithVectors = animeList.map(anime => {
    // Generate a random vector for this example
    const vector = Array(5)
      .fill(0)
      .map(() => Math.random());
    return {
      ...anime,
      similarity: calculateCosineSimilarity(vector, moodVector),
    };
  });

  // Sort by similarity
  return animeWithVectors.sort((a, b) => b.similarity - a.similarity);
}

// Function to check authentication and get user ID
export async function getUserIdFromSession(): Promise<string | null> {
  try {
    // Check if user is logged in
    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      console.log('No active session found');
      return null;
    }
    
    const userId = session.data.session.user.id;
    console.log('User ID from session:', userId);
    return userId;
  } catch (error) {
    console.error('Error getting user ID from session:', error);
    return null;
  }
}

// Fetches all available genres from the database
// This ensures we're always using up-to-date genres from the database
// instead of hardcoded values
// 
// @returns Array of all unique genres in the database
export async function getAvailableGenres(): Promise<string[]> {
  try {
    // First try to get from cache
    const cachedGenres = await AsyncStorage.getItem('availableGenres');
    if (cachedGenres) {
      const parsed = JSON.parse(cachedGenres);
      const cacheTime = parsed.timestamp;
      const now = Date.now();
      
      // If cache is less than 24 hours old, use it
      if (now - cacheTime < 24 * 60 * 60 * 1000) {
        console.log('Using cached genres');
        return parsed.genres;
      }
    }
    
    // If no cache or cache is old, fetch from database
    const { data, error } = await supabase
      .from('anime')
      .select('genres');
    
    if (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No anime found in database');
      return [];
    }
    
    // Extract all genres from all anime
    const allGenres: string[] = [];
    data.forEach(anime => {
      if (anime.genres && Array.isArray(anime.genres)) {
        anime.genres.forEach((genre: string) => {
          if (!allGenres.includes(genre)) {
            allGenres.push(genre);
          }
        });
      }
    });
    
    // Sort alphabetically
    allGenres.sort();
    
    // Cache the result
    await AsyncStorage.setItem('availableGenres', JSON.stringify({
      genres: allGenres,
      timestamp: Date.now()
    }));
    
    return allGenres;
  } catch (error) {
    console.error('Error in getAvailableGenres:', error);
    return [];
  }
}

// Function to set cooldown - modified to use 10 seconds instead of 24 hours
export async function setMoodMatcherCooldown(userId: string | null): Promise<void> {
  if (!userId) {
    console.log('No user ID provided for cooldown');
    return;
  }
  
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(`moodmatcher_cooldown_${userId}`, now);
    console.log('Cooldown set for user:', userId);
  } catch (error) {
    console.error('Error setting cooldown:', error);
  }
}

// Function to check if cooldown period has passed
export async function checkMoodMatcherAvailable(userId: string | null): Promise<boolean> {
  if (!userId) {
    console.log('No user ID provided for cooldown check');
    return false;
  }
  
  try {
    const lastUsed = await AsyncStorage.getItem(`moodmatcher_cooldown_${userId}`);
    
    if (!lastUsed) {
      console.log('No cooldown found, feature available');
      return true;
    }
    
    const lastUsedDate = new Date(lastUsed);
    const now = new Date();
    
    // Calculate difference in hours
    const diffHours = (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60);
    
    // For testing: 10 seconds cooldown
    const diffSeconds = (now.getTime() - lastUsedDate.getTime()) / 1000;
    console.log(`Time since last use: ${diffHours.toFixed(2)} hours (${diffSeconds.toFixed(0)} seconds)`);
    
    // Available if more than 24 hours have passed
    // For testing: 10 seconds
    return diffSeconds > 10;
  } catch (error) {
    console.error('Error checking cooldown:', error);
    return false;
  }
}

// Function to get anime recommendations based on mood
export async function getMoodBasedRecommendations(
  mood: string,
  userId: string | null
): Promise<{ recommendations: AnimeItem[]; error: string | null }> {
  try {
    // Fetch anime from database
    const { data: animeData, error: animeError } = await supabase
      .from('anime')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);
    
    if (animeError) {
      console.error('Error fetching anime:', animeError);
      return { recommendations: [], error: 'Failed to fetch anime data' };
    }
    
    if (!animeData || animeData.length === 0) {
      throw new Error('No anime found in the database');
    }

    // Get API key from environment variables
    const apiKey = process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY;
    // Log only that we're using the API key, not the actual key
    console.log('Using API key from environment variables');
    
    // Try to use the API with the new token
    // If it fails, we'll fall back to our algorithm
    const skipApi = false;
    
    if (!skipApi && apiKey) {
      try {
        console.log('Attempting to use Hugging Face API for mood analysis');
        
        // Define the model endpoint
        const API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";
        
        // Prepare anime titles for embedding
        const animeTitles = animeData.map(anime => anime.title);
        
        // Add the mood to the list of texts to embed
        const textsToEmbed = [...animeTitles, `A ${mood} anime`];
        
        // Call the API to get embeddings
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: textsToEmbed,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const embeddings = await response.json();
        
        if (!Array.isArray(embeddings) || embeddings.length !== textsToEmbed.length) {
          throw new Error('Invalid response format from API');
        }
        
        // Get the mood embedding (last item in the array)
        const moodEmbedding = embeddings[embeddings.length - 1];
        
        // Calculate similarity between each anime title and the mood
        const animeWithSimilarity = animeData.map((anime, index) => {
          const animeEmbedding = embeddings[index];
          const similarity = calculateCosineSimilarity(animeEmbedding, moodEmbedding);
          
          return {
            ...anime,
            similarity
          };
        });
        
        // Sort by similarity (highest first)
        const sortedAnime = animeWithSimilarity.sort((a, b) => b.similarity - a.similarity);
        
        // Take top 10 results
        const topResults = sortedAnime.slice(0, 10);
        
        console.log('Successfully got recommendations using Hugging Face API');
        
        // Set cooldown for this user
        await setMoodMatcherCooldown(userId);
        
        return { 
          recommendations: topResults.map(anime => ({
            id: anime.id,
            title: anime.title,
            cover_image: anime.cover_image,
            image_url: anime.image_url,
            score: anime.score,
            release_year: anime.release_year,
            genres: anime.genres
          })), 
          error: null 
        };
      } catch (apiError) {
        console.error('Error using Hugging Face API:', apiError);
        console.log('Falling back to local algorithm');
        // Continue to fallback method
      }
    }
    
    // Fallback: Use our local algorithm
    console.log('Using local algorithm for mood-based recommendations');
    
    // Map mood to genres that might match
    const moodToGenres: { [key: string]: string[] } = {
      happy: ['Comedy', 'Slice of Life', 'Sports'],
      sad: ['Drama', 'Tragedy', 'Psychological'],
      excited: ['Action', 'Adventure', 'Shounen'],
      relaxed: ['Slice of Life', 'Iyashikei', 'Music'],
      thoughtful: ['Mystery', 'Psychological', 'Sci-Fi'],
      romantic: ['Romance', 'Shoujo', 'Drama'],
      scared: ['Horror', 'Thriller', 'Mystery'],
      angry: ['Action', 'Martial Arts', 'Seinen'],
      confused: ['Mystery', 'Psychological', 'Thriller'],
      nostalgic: ['Slice of Life', 'Historical', 'Drama']
    };
    
    // Default mood is 'happy' if not found
    const targetGenres = moodToGenres[mood.toLowerCase()] || moodToGenres.happy;
    
    // Score each anime based on genre match
    const scoredAnime = animeData.map(anime => {
      let genreScore = 0;
      
      // Check how many target genres match this anime
      if (anime.genres && Array.isArray(anime.genres)) {
        anime.genres.forEach((genre: string) => {
          if (targetGenres.includes(genre)) {
            genreScore += 1;
          }
        });
      }
      
      // Normalize score (0-1)
      const normalizedScore = genreScore / targetGenres.length;
      
      // Combine with anime rating (if available)
      const ratingFactor = anime.score ? anime.score / 10 : 0.5;
      
      // Final score is weighted combination
      const finalScore = (normalizedScore * 0.7) + (ratingFactor * 0.3);
      
      return {
        ...anime,
        moodScore: finalScore
      };
    });
    
    // Sort by mood score
    const sortedResults = scoredAnime.sort((a, b) => b.moodScore - a.moodScore);
    
    // Take top 10
    const recommendations = sortedResults.slice(0, 10);
    
    // Set cooldown for this user
    await setMoodMatcherCooldown(userId);
    
    return { 
      recommendations: recommendations.map(anime => ({
        id: anime.id,
        title: anime.title,
        cover_image: anime.cover_image,
        image_url: anime.image_url,
        score: anime.score,
        release_year: anime.release_year,
        genres: anime.genres
      })), 
      error: null 
    };
  } catch (error) {
    console.error('Error in getMoodBasedRecommendations:', error);
    return { recommendations: [], error: 'Failed to get recommendations' };
  }
}
