import { useState, useEffect, useCallback } from 'react';
import { ACHIEVEMENTS, Achievement } from '@/types/achievements';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import useUserAnimeLists from '../app/hooks/useUserAnimeLists';
import useFavorites from './useFavorites';

export default function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([...ACHIEVEMENTS]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { lists } = useUserAnimeLists();
  const { favorites } = useFavorites();

  // Calculate achievement progress based on user data
  const calculateAchievements = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const watchingCount = lists?.watching?.length || 0;
    const completedCount = lists?.completed?.length || 0;
    const planToWatchCount = lists?.plan_to_watch?.length || 0;
    const favoritesCount = favorites?.length || 0;

    // Get all anime from all lists to analyze genres
    const allAnime = [
      ...(lists?.watching || []),
      ...(lists?.completed || []),
      ...(lists?.plan_to_watch || [])
    ];

    // Count genres
    const genreCounts: Record<string, number> = {};
    allAnime.forEach(anime => {
      if (anime.genres && Array.isArray(anime.genres)) {
        anime.genres.forEach((genre: string) => {
          if (genre) {
            const normalizedGenre = genre.toLowerCase();
            genreCounts[normalizedGenre] = (genreCounts[normalizedGenre] || 0) + 1;
          }
        });
      }
    });

    // Update achievements
    const updatedAchievements = achievements.map(achievement => {
      let progress = 0;
      let unlocked = false;

      switch (achievement.category) {
        case 'watching':
          progress = Math.min(100, (watchingCount / achievement.threshold) * 100);
          unlocked = watchingCount >= achievement.threshold;
          break;
        case 'completed':
          progress = Math.min(100, (completedCount / achievement.threshold) * 100);
          unlocked = completedCount >= achievement.threshold;
          break;
        case 'genre':
          // Extract genre from id (e.g., 'genre_action' -> 'action')
          const genre = achievement.id.split('_')[1];
          const genreCount = genreCounts[genre] || 0;
          progress = Math.min(100, (genreCount / achievement.threshold) * 100);
          unlocked = genreCount >= achievement.threshold;
          break;
        case 'rating':
          // Assuming we have a count of rated anime
          // For now, just use the completed count as a proxy
          progress = Math.min(100, (completedCount / achievement.threshold) * 100);
          unlocked = completedCount >= achievement.threshold;
          break;
      }

      return {
        ...achievement,
        progress,
        unlocked
      };
    });

    setAchievements(updatedAchievements);
    setLoading(false);
  }, [user, lists, favorites]);

  // Load achievements when user data changes
  useEffect(() => {
    calculateAchievements();
  }, [calculateAchievements]);

  // Get achievements by category
  const getAchievementsByCategory = (category: string) => {
    return achievements.filter(a => a.category === category);
  };

  // Get unlocked achievements
  const getUnlockedAchievements = () => {
    return achievements.filter(a => a.unlocked);
  };

  // Get achievements in progress
  const getInProgressAchievements = () => {
    return achievements.filter(a => !a.unlocked && a.progress > 0);
  };

  // Get next achievements to unlock
  const getNextAchievements = (limit = 3) => {
    return achievements
      .filter(a => !a.unlocked && a.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit);
  };

  return {
    achievements,
    loading,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getInProgressAchievements,
    getNextAchievements
  };
}
