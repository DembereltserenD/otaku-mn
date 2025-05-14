import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility to clear the mood matcher restrictions
 * Run this to clear any stored usage timestamps
 */
export const clearMoodMatcherRestrictions = async (userId: string | undefined) => {
  if (!userId) {
    console.log('No user ID provided');
    return;
  }
  
  try {
    await AsyncStorage.removeItem(`mood_matcher_${userId}`);
    console.log('Mood matcher restrictions cleared for user', userId);
    return true;
  } catch (error) {
    console.error('Error clearing mood matcher restrictions:', error);
    return false;
  }
};

/**
 * Call this directly to reset the restriction for the current user
 */
export const resetCurrentUserRestriction = () => {
  // Run this in the developer console to clear restrictions
  console.log('To clear Mood Matcher restriction, run:');
  console.log('import { clearMoodMatcherRestrictions } from "./components/MoodMatcherResetTool";');
  console.log('import { useAuth } from "./context/AuthContext";');
  console.log('const { user } = useAuth();');
  console.log('clearMoodMatcherRestrictions(user?.id);');
};
