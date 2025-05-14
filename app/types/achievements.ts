export type AchievementCategory = 'watching' | 'completed' | 'genre' | 'rating';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name from Lucide
  category: AchievementCategory;
  threshold: number; // Number needed to unlock
  color: string; // Color for the badge
  unlocked: boolean;
  progress: number; // Current progress (0-100)
};

// Define achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Watching achievements
  {
    id: 'watching_1',
    title: 'First Steps',
    description: 'Start watching 1 anime',
    icon: 'Eye',
    category: 'watching',
    threshold: 1,
    color: '#3B82F6', // Blue
    unlocked: false,
    progress: 0,
  },
  {
    id: 'watching_5',
    title: 'Getting Started',
    description: 'Watch 5 different anime',
    icon: 'Eye',
    category: 'watching',
    threshold: 5,
    color: '#3B82F6', // Blue
    unlocked: false,
    progress: 0,
  },
  {
    id: 'watching_10',
    title: 'Regular Viewer',
    description: 'Watch 10 different anime',
    icon: 'Eye',
    category: 'watching',
    threshold: 10,
    color: '#3B82F6', // Blue
    unlocked: false,
    progress: 0,
  },
  
  // Completed achievements
  {
    id: 'completed_1',
    title: 'Completion Beginner',
    description: 'Complete 1 anime',
    icon: 'CheckCircle',
    category: 'completed',
    threshold: 1,
    color: '#10B981', // Green
    unlocked: false,
    progress: 0,
  },
  {
    id: 'completed_5',
    title: 'Dedicated Fan',
    description: 'Complete 5 anime',
    icon: 'CheckCircle',
    category: 'completed',
    threshold: 5,
    color: '#10B981', // Green
    unlocked: false,
    progress: 0,
  },
  {
    id: 'completed_10',
    title: 'Completion Master',
    description: 'Complete 10 anime',
    icon: 'Award',
    category: 'completed',
    threshold: 10,
    color: '#10B981', // Green
    unlocked: false,
    progress: 0,
  },
  
  // Genre achievements
  {
    id: 'genre_action',
    title: 'Action Enthusiast',
    description: 'Watch 3 action anime',
    icon: 'Swords',
    category: 'genre',
    threshold: 3,
    color: '#F59E0B', // Amber
    unlocked: false,
    progress: 0,
  },
  {
    id: 'genre_romance',
    title: 'Romance Lover',
    description: 'Watch 3 romance anime',
    icon: 'Heart',
    category: 'genre',
    threshold: 3,
    color: '#EC4899', // Pink
    unlocked: false,
    progress: 0,
  },
  {
    id: 'genre_fantasy',
    title: 'Fantasy Explorer',
    description: 'Watch 3 fantasy anime',
    icon: 'Sparkles',
    category: 'genre',
    threshold: 3,
    color: '#8B5CF6', // Purple
    unlocked: false,
    progress: 0,
  },
  
  // Rating achievements
  {
    id: 'rating_first',
    title: 'First Rating',
    description: 'Rate your first anime',
    icon: 'Star',
    category: 'rating',
    threshold: 1,
    color: '#F59E0B', // Amber
    unlocked: false,
    progress: 0,
  },
  {
    id: 'rating_five',
    title: 'Rating Enthusiast',
    description: 'Rate 5 anime',
    icon: 'Star',
    category: 'rating',
    threshold: 5,
    color: '#F59E0B', // Amber
    unlocked: false,
    progress: 0,
  }
];
