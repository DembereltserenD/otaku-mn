import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper component to manage the cooldown for the Mood Matcher feature
 * This ensures users can use the feature multiple times with a short cooldown
 */

// Set the cooldown to 10 seconds
const COOLDOWN_SECONDS = 10;

/**
 * Save the usage timestamp with a 10-second cooldown
 */
export const setMoodMatcherUsage = async (userId: string | null) => {
  if (!userId) return;
  
  // Calculate expiry time (current time + 10 seconds)
  const expiryTime = new Date();
  expiryTime.setSeconds(expiryTime.getSeconds() + COOLDOWN_SECONDS);
  
  // Store the expiry timestamp
  await AsyncStorage.setItem(`mood_matcher_${userId}`, expiryTime.toISOString());
  console.log(`Mood matcher cooldown set for ${COOLDOWN_SECONDS} seconds`);
};

/**
 * Check if the mood matcher is available based on the 10-second cooldown
 * @returns boolean - true if available, false if on cooldown
 */
export const checkMoodMatcherAvailability = async (userId: string | null): Promise<boolean> => {
  if (!userId) return true;
  
  try {
    // Get the last usage timestamp
    const lastUsageStr = await AsyncStorage.getItem(`mood_matcher_${userId}`);
    
    if (!lastUsageStr) return true;
    
    // Parse the expiry time
    const expiryTime = new Date(lastUsageStr);
    const currentTime = new Date();
    
    // Calculate time remaining in seconds
    const timeRemainingMs = expiryTime.getTime() - currentTime.getTime();
    const timeRemainingSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
    
    if (timeRemainingSeconds > 0) {
      console.log(`Mood matcher on cooldown for ${timeRemainingSeconds} more seconds`);
      return false;
    }
    
    // Cooldown expired, ready to use
    return true;
  } catch (error) {
    console.error('Error checking mood matcher availability:', error);
    return true; // Default to allowing usage if there's an error
  }
};

/**
 * Clear any existing usage restrictions
 */
export const clearMoodMatcherRestrictions = async (userId: string | null) => {
  if (!userId) return;
  
  try {
    await AsyncStorage.removeItem(`mood_matcher_${userId}`);
    console.log('Mood matcher restrictions cleared');
  } catch (error) {
    console.error('Error clearing mood matcher restrictions:', error);
  }
};
