import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MoodIntro from './MoodIntro';
import MoodSelect from './MoodSelect';
import CustomMood from './CustomMood';
import MoodResults from './MoodResults';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { getUserIdFromSession, getMoodBasedRecommendations, AnimeItem, checkMoodMatcherAvailable } from './utils';

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

const MoodMatcher = ({ isVisible, onClose }: MoodMatcherProps) => {
  const [step, setStep] = useState(1); // 1: Intro, 2: Mood Select, 3: Custom Input, 4: Results
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customMood, setCustomMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AnimeItem[]>([]);
  const [onCooldown, setOnCooldown] = useState(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  // When the component becomes visible, fetch the user ID from the session
  // This ensures we have a fresh check of the user's authentication status
  useEffect(() => {
    const fetchUserSession = async () => {
      if (isVisible) {
        try {
          // Reset state at each opening
          setStep(1);
          setSelectedMood(null);
          setCustomMood('');
          setRecommendations([]);
          
          // Try to get userId from both context and direct session
          const sessionUserId = await getUserIdFromSession();
          const currentUserId = user?.id || sessionUserId;
          
          if (currentUserId) {
            // If we have a user ID from either source, use it
            setUserId(currentUserId);
            setError(null); // Clear any previous authentication errors
            
            // Check if feature is on cooldown
            const isAvailable = await checkMoodMatcherAvailable(currentUserId);
            if (!isAvailable) {
              // If on cooldown, notify the user
              setOnCooldown(true);
              // Get cooldown timestamp to calculate remaining time
              const lastUsageStr = await AsyncStorage.getItem(`mood_matcher_${currentUserId}`);
              if (lastUsageStr) {
                const expiryTime = new Date(lastUsageStr).getTime();
                const currentTime = new Date().getTime();
                const remainingSecs = Math.max(0, Math.ceil((expiryTime - currentTime) / 1000));
                setRemainingCooldown(remainingSecs);
                setError(`Please wait ${remainingSecs} seconds before using Mood Matcher again.`);
              }
            } else {
              setOnCooldown(false);
              setRemainingCooldown(0);
            }
          } else {
            console.warn('Could not identify authenticated user');
            setUserId(null);
            setError('You need to be logged in to use this feature.');
          }
        } catch (err) {
          console.error('Error checking session:', err);
        }
      }
    };

    fetchUserSession();
    
    // If component is visible and on cooldown, set up a countdown timer
    let timer: NodeJS.Timeout | null = null;
    if (isVisible && onCooldown && remainingCooldown > 0) {
      timer = setInterval(() => {
        setRemainingCooldown((prev) => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            // When cooldown is over, update the state
            setOnCooldown(false);
            setError(null);
            clearInterval(timer!);
            return 0;
          }
          setError(`Please wait ${newValue} seconds before using Mood Matcher again.`);
          return newValue;
        });
      }, 1000);
    }
    
    // Cleanup timer when component unmounts or when cooldown ends
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVisible, user, onCooldown, remainingCooldown]);

  const handleContinue = () => {
    // Check if the feature is on cooldown
    if (onCooldown) {
      setError(`Please wait ${remainingCooldown} seconds before using Mood Matcher again.`);
      return;
    }
    
    if (step === 1) {
      // Before proceeding, verify authentication
      if (!userId) {
        setError('You need to be logged in to use this feature.');
        return;
      }
      setStep(2);
    } else if (step === 2 && selectedMood) {
      processSelectedMood();
    } else if (step === 3 && customMood.trim()) {
      processCustomMood();
    }
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    if (mood === 'Other') {
      setStep(3);
    }
  };

  const processSelectedMood = async () => {
    setLoading(true);
    const result = await getMoodBasedRecommendations(selectedMood!, userId);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else {
      setRecommendations(result.recommendations);
      setStep(4);
    }
  };

  const processCustomMood = async () => {
    setLoading(true);
    const result = await getMoodBasedRecommendations(customMood, userId);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else {
      setRecommendations(result.recommendations);
      setStep(4);
    }
  };
  
  const handleAnimePress = (animeId: number) => {
    onClose();
    router.push(`/anime/${animeId}`);
  };

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
            <ErrorState error={error} onClose={onClose} />
          ) : loading ? (
            <LoadingState />
          ) : step === 1 ? (
            <MoodIntro onContinue={handleContinue} />
          ) : step === 2 ? (
            <MoodSelect 
              moods={MOODS} 
              selectedMood={selectedMood} 
              onMoodSelect={handleMoodSelect}
              onContinue={handleContinue}
            />
          ) : step === 3 ? (
            <CustomMood 
              customMood={customMood}
              onCustomMoodChange={setCustomMood}
              onContinue={handleContinue}
            />
          ) : (
            <MoodResults 
              recommendations={recommendations}
              selectedMood={selectedMood}
              customMood={customMood}
              onAnimePress={handleAnimePress}
              onClose={onClose}
            />
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
});

export default MoodMatcher;
