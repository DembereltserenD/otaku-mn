import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeProvider';
import Typography from './Typography';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Bot, X, Heart, Star, Film } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOODS = [
  'Happy',
  'Sad',
  'Energetic',
  'Calm',
  'Excited',
  'Curious',
  'Nostalgic',
  'Inspired',
  'Romantic',
];

interface MoodMatcherProps {
  isVisible: boolean;
  onClose: () => void;
}

// Calculate cosine similarity between two vectors
const calculateCosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
};

const MoodMatcher = ({ isVisible, onClose }: MoodMatcherProps) => {
  const [step, setStep] = useState(1); // 1: Intro, 2: Mood Select, 3: Custom Input, 4: Results
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customMood, setCustomMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // Clear any existing restrictions when the component opens
  useEffect(() => {
    const clearRestrictions = async () => {
      try {
        // Get session data for when user context might not be available
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = user?.id || sessionData?.session?.user?.id;
        
        if (!userId) {
          console.warn('No user ID available');
          return;
        }
        
        // Clear any existing usage restrictions
        await AsyncStorage.removeItem(`mood_matcher_${userId}`);
        console.log('Mood matcher restrictions cleared for this session');
      } catch (err) {
        console.error('Error clearing mood matcher restrictions:', err);
      }
    };

    if (isVisible) {
      clearRestrictions();
    }
  }, [isVisible, user]);

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && selectedMood) {
      getMoodBasedRecommendations(selectedMood);
    } else if (step === 3 && customMood.trim()) {
      getMoodBasedRecommendations(customMood);
    }
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    if (mood === 'Other') {
      setStep(3);
    }
  };

  const getMoodBasedRecommendations = async (mood: string) => {
    console.log('Authentication state:', { user, isAuthenticated: !!user });
    
    // Get session data for when user context might not be available
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session data check:', sessionData);
    
    // Debug auth state
    if (!user && !sessionData?.session?.user) {
      console.warn('User not detected in MoodMatcher');
      setError('You need to be logged in to use this feature.');
      return;
    }
    
    // Get the user ID from either source
    const userId = user?.id || sessionData?.session?.user?.id;
    if (!userId) {
      setError('User ID not found. Please try logging in again.');
      return;
    }
    
    // Log which user we're using
    console.log('Using user with ID:', userId);

    setLoading(true);
    setError(null);

    try {
      // First, get available anime from Supabase
      const { data: animeData, error: animeError } = await supabase
        .from('anime')
        .select('*')
        .limit(30);

      if (animeError) throw animeError;
      if (!animeData || animeData.length === 0) {
        throw new Error('No anime found in the database');
      }

      // Then make a request to Hugging Face for mood matching
      const apiKey = process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY;
      console.log('Using Hugging Face API key (first 4 chars):', apiKey?.substring(0, 4));
      
      // For demo purposes, use a mock response if no API key is provided
      if (!apiKey || apiKey === 'your_huggingface_api_key') {
        console.log('Using mock response due to missing API key');
        
        // Sort anime based on a simple algorithm matching mood to genres/themes
        const sortedAnime = sortAnimeMock(animeData, mood);
        setRecommendations(sortedAnime.slice(0, 5));
        
        // Save usage timestamp
        await AsyncStorage.setItem(`mood_matcher_${userId}`, new Date().toISOString());
        
        setStep(4);
        return;
      }

      try {
        console.log('Attempting Hugging Face API call for mood:', mood);
        
        // Using a smaller, more accessible model that should work with most API tokens
        // gpt2 is one of the most widely accessible models and should work with most API keys
        console.log('Using gpt2 model for mood matching - widely accessible');
        const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: [
              {
                "role": "system",
                "content": "You are an anime recommendation expert. Based on a user's mood, recommend appropriate anime genres and explain why they fit the mood."
              },
              {
                "role": "user",
                "content": `I'm feeling ${mood}. What anime genres would best match this mood and why? Please format your answer as a JSON object with 'genres' as an array of strings in order of relevance, and 'explanation' as a string.`
              }
            ],
            parameters: {
              max_new_tokens: 250,
              temperature: 0.7,
              return_full_text: false
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Falcon model response:', result);
        
        let recommendedGenres = [];
        
        try {
          // Try to parse the model's response as JSON
          const responseText = result[0]?.generated_text || '';
          console.log('Generated text:', responseText);
          
          // Extract the JSON part from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/m);
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            console.log('Parsed response:', parsedResponse);
            recommendedGenres = parsedResponse.genres || [];
          }
        } catch (parseError) {
          console.error('Error parsing model response:', parseError);
        }
        
        if (recommendedGenres.length > 0) {
          console.log('Recommended genres from Falcon model:', recommendedGenres);
          // Match anime by recommended genres
          const sortedAnime = animeData.sort((a, b) => {
            const aRelevance = a.genres?.filter((g: string) => 
              recommendedGenres.includes(g)).length || 0;
            const bRelevance = b.genres?.filter((g: string) => 
              recommendedGenres.includes(g)).length || 0;
            
            // If same relevance, sort by score
            if (aRelevance === bRelevance) {
              return (b.score || 0) - (a.score || 0);
            }
            
            return bRelevance - aRelevance;
          });
          setRecommendations(sortedAnime.slice(0, 5));
        } else {
          // Fallback to our original algorithm if we couldn't get genres
          const sortedAnime = sortAnimeMock(animeData, mood);
          setRecommendations(sortedAnime.slice(0, 5));
        }
        
        // Save usage timestamp
        await AsyncStorage.setItem(`mood_matcher_${userId}`, new Date().toISOString());
        
        setStep(4);
      } catch (error) {
        console.error('Error in Hugging Face API call:', error);
        
        // Check for specific error types and provide more helpful messages
        // Properly type check the error object
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('403')) {
          setError('API access denied. Your token may not have permission for this model.');
          
          // Try another publicly accessible model as a backup
          try {
            console.log('Attempting with alternative model...');
            const backupResponse = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-xxl', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: `For someone feeling ${mood}, what are the best anime genres to watch?`
              }),
            });
            
            if (!backupResponse.ok) {
              throw new Error(`Backup API responded with status: ${backupResponse.status}`);
            }
            
            const backupResult = await backupResponse.json();
            console.log('Backup model response:', backupResult);
            
            // Use the backup model's response to sort anime
            const responseText = backupResult[0]?.generated_text || '';
            
            // Extract genre names from the text response using common anime genre keywords
            const genreKeywords = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
              'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 
              'Supernatural', 'Thriller', 'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Mecha'];
              
            const mentionedGenres = genreKeywords.filter(genre => 
              responseText.toLowerCase().includes(genre.toLowerCase()));
              
            if (mentionedGenres.length > 0) {
              console.log('Genres extracted from backup model:', mentionedGenres);
              const sortedAnime = animeData.sort((a, b) => {
                const aRelevance = a.genres?.filter((g: string) => 
                  mentionedGenres.includes(g)).length || 0;
                const bRelevance = b.genres?.filter((g: string) => 
                  mentionedGenres.includes(g)).length || 0;
                
                if (aRelevance === bRelevance) {
                  return (b.score || 0) - (a.score || 0);
                }
                
                return bRelevance - aRelevance;
              });
              setRecommendations(sortedAnime.slice(0, 5));
              return;
            }
          } catch (backupError) {
            console.error('Backup API call also failed:', backupError);
            setError('We encountered an issue with our recommendation system. Please try again later.');
          }
        }
        
        // As a last resort, fall back to our algorithm
        console.log('All API attempts failed, using algorithm');
        const sortedAnime = sortAnimeMock(animeData, mood);
        setRecommendations(sortedAnime.slice(0, 5));
        
        // Save usage timestamp
        await AsyncStorage.setItem(`mood_matcher_${userId}`, new Date().toISOString());
        
        setStep(4);
      }
    } catch (err: any) {
      console.error('Error getting recommendations:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Mock function to sort anime based on mood without API
  const sortAnimeMock = (animeList: any[], mood: string) => {
    const moodToGenreMap: Record<string, string[]> = {
      'Happy': ['Comedy', 'Slice of Life', 'Sports'],
      'Sad': ['Drama', 'Tragedy', 'Psychological'],
      'Energetic': ['Action', 'Adventure', 'Shounen'],
      'Calm': ['Slice of Life', 'Iyashikei', 'Music'],
      'Excited': ['Action', 'Thriller', 'Sports'],
      'Curious': ['Mystery', 'Sci-Fi', 'Psychological'],
      'Nostalgic': ['Drama', 'Historical', 'Music'],
      'Inspired': ['Sports', 'Music', 'School'],
      'Romantic': ['Romance', 'Drama', 'Shoujo'],
    };
    
    // Default to 'Happy' if mood not found
    const relevantGenres = moodToGenreMap[mood] || moodToGenreMap['Happy'];
    
    return animeList.sort((a, b) => {
      const aRelevance = a.genres?.filter((g: string) => 
        relevantGenres.includes(g)).length || 0;
      const bRelevance = b.genres?.filter((g: string) => 
        relevantGenres.includes(g)).length || 0;
      
      // If same relevance, sort by score
      if (aRelevance === bRelevance) {
        return (b.score || 0) - (a.score || 0);
      }
      
      return bRelevance - aRelevance;
    });
  };
  
  const handleAnimePress = (animeId: number) => {
    onClose();
    router.push(`/anime/${animeId}`);
  };

  const renderIntro = () => (
    <View style={styles.stepContainer}>
      <View style={styles.robotIconContainer}>
        <Bot size={60} color={colors.primary} />
      </View>
      <Typography variant="h2" style={styles.title}>
        Mood Matcher
      </Typography>
      <Typography
        variant="body"
        color={colors.textSecondary}
        style={styles.description}
      >
        Tell me how you're feeling today, and I'll recommend anime that matches your mood!
      </Typography>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleContinue}
      >
        <Typography variant="button" color="#FFFFFF">
          Get Started
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderMoodSelect = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h3" style={styles.subtitle}>
        How are you feeling today?
      </Typography>
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[
              styles.moodItem,
              {
                backgroundColor:
                  selectedMood === mood ? colors.primary : colors.cardHover,
                borderColor:
                  selectedMood === mood ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleMoodSelect(mood)}
          >
            <Typography
              variant="bodySmall"
              color={selectedMood === mood ? '#FFFFFF' : colors.text}
            >
              {mood}
            </Typography>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.moodItem,
            {
              backgroundColor:
                selectedMood === 'Other' ? colors.primary : colors.cardHover,
              borderColor:
                selectedMood === 'Other' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => handleMoodSelect('Other')}
        >
          <Typography
            variant="bodySmall"
            color={selectedMood === 'Other' ? '#FFFFFF' : colors.text}
          >
            Other
          </Typography>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: selectedMood ? colors.primary : colors.inactive,
            opacity: selectedMood ? 1 : 0.7,
          },
        ]}
        onPress={handleContinue}
        disabled={!selectedMood}
      >
        <Typography variant="button" color="#FFFFFF">
          Continue
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderCustomMood = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.stepContainer}>
        <Typography variant="h3" style={styles.subtitle}>
          Describe your mood
        </Typography>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.cardHover,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholderTextColor={colors.textSecondary}
          placeholder="E.g., Melancholic, Adventurous, etc."
          value={customMood}
          onChangeText={setCustomMood}
          maxLength={40}
        />
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: customMood.trim() ? colors.primary : colors.inactive,
              opacity: customMood.trim() ? 1 : 0.7,
            },
          ]}
          onPress={handleContinue}
          disabled={!customMood.trim()}
        >
          <Typography variant="button" color="#FFFFFF">
            Find Anime
          </Typography>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );

  const renderResults = () => (
    <View style={[styles.stepContainer, { paddingHorizontal: 0 }]}>
      <View style={{ paddingHorizontal: 16 }}>
        <Typography variant="h3" style={styles.subtitle}>
          Your Mood Matches
        </Typography>
        <Typography
          variant="bodySmall"
          color={colors.textSecondary}
          style={styles.matchDescription}
        >
          Based on your {selectedMood === 'Other' ? customMood : selectedMood?.toLowerCase()} mood,
          here are anime recommendations just for you:
        </Typography>
      </View>

      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {recommendations.map((anime) => (
          <TouchableOpacity
            key={anime.id}
            style={[styles.animeItem, { backgroundColor: colors.card }]}
            onPress={() => handleAnimePress(anime.id)}
          >
            <Image
              source={{ uri: anime.cover_image || anime.image_url }}
              style={styles.animeImage}
              resizeMode="cover"
            />
            <View style={styles.animeInfo}>
              <Typography variant="h3" numberOfLines={1} style={styles.animeTitle}>
                {anime.title}
              </Typography>
              
              <View style={styles.animeMetaRow}>
                {anime.score && (
                  <View style={styles.metaItem}>
                    <Star size={14} color={colors.warning} />
                    <Typography variant="caption" color={colors.textSecondary} style={styles.metaText}>
                      {anime.score.toFixed(1)}
                    </Typography>
                  </View>
                )}
                
                {anime.release_year && (
                  <View style={styles.metaItem}>
                    <Film size={14} color={colors.textSecondary} />
                    <Typography variant="caption" color={colors.textSecondary} style={styles.metaText}>
                      {anime.release_year}
                    </Typography>
                  </View>
                )}
              </View>
              
              <View style={styles.genreContainer}>
                {anime.genres?.slice(0, 3).map((genre: string, index: number) => (
                  <View
                    key={index}
                    style={[styles.genreTag, { backgroundColor: colors.cardHover }]}
                  >
                    <Typography variant="caption" color={colors.textSecondary}>
                      {genre}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Typography variant="button" color="#FFFFFF">
            Done
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={[styles.stepContainer, styles.loadingContainer]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Typography
        variant="body"
        color={colors.textSecondary}
        style={styles.loadingText}
      >
        Finding your perfect anime match...
      </Typography>
    </View>
  );

  const renderError = () => (
    <View style={[styles.stepContainer, styles.errorContainer]}>
      <Typography
        variant="body"
        color={colors.error}
        style={styles.errorText}
      >
        {error}
      </Typography>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onClose}
      >
        <Typography variant="button" color="#FFFFFF">
          Close
        </Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background },
          ]}
        >
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.cardHover }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>

          {error ? (
            renderError()
          ) : loading ? (
            renderLoading()
          ) : step === 1 ? (
            renderIntro()
          ) : step === 2 ? (
            renderMoodSelect()
          ) : step === 3 ? (
            renderCustomMood()
          ) : (
            renderResults()
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  stepContainer: {
    padding: 24,
    alignItems: 'center',
  },
  robotIconContainer: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  moodItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  resultsContainer: {
    width: '100%',
    maxHeight: 400,
    marginVertical: 16,
  },
  resultsContent: {
    paddingHorizontal: 16,
  },
  animeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  animeImage: {
    width: 100,
    height: 140,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  animeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  animeTitle: {
    marginBottom: 8,
  },
  animeMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  matchDescription: {
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default MoodMatcher;
