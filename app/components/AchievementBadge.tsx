import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award, CheckCircle, Eye, Heart, Sparkles, Star, Swords } from 'lucide-react-native';
import { Achievement } from '@/types/achievements';
import { useTheme } from '@/context/ThemeProvider';

type AchievementBadgeProps = {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showProgress?: boolean;
};

const AchievementBadge = ({ 
  achievement, 
  size = 'medium', 
  onPress,
  showProgress = true
}: AchievementBadgeProps) => {
  const { colors, isDarkMode } = useTheme();
  
  // Determine icon size based on badge size
  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24;
    }
  };
  
  // Determine badge size
  const getBadgeSize = () => {
    switch (size) {
      case 'small': return 40;
      case 'large': return 80;
      default: return 60;
    }
  };
  
  // Render the appropriate icon based on achievement
  const renderIcon = () => {
    const iconSize = getIconSize();
    const iconColor = achievement.unlocked ? '#FFFFFF' : isDarkMode ? colors.textSecondary : '#9CA3AF';
    
    switch (achievement.icon) {
      case 'Eye':
        return <Eye size={iconSize} color={iconColor} />;
      case 'CheckCircle':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'Award':
        return <Award size={iconSize} color={iconColor} />;
      case 'Swords':
        return <Swords size={iconSize} color={iconColor} />;
      case 'Heart':
        return <Heart size={iconSize} color={iconColor} />;
      case 'Sparkles':
        return <Sparkles size={iconSize} color={iconColor} />;
      case 'Star':
        return <Star size={iconSize} color={iconColor} />;
      default:
        return <Award size={iconSize} color={iconColor} />;
    }
  };
  
  const badgeSize = getBadgeSize();
  const badgeColor = achievement.unlocked 
    ? achievement.color 
    : isDarkMode ? colors.cardHover : colors.skeleton;
  
  const BadgeContent = () => (
    <View style={[
      styles.badge, 
      { 
        width: badgeSize, 
        height: badgeSize, 
        backgroundColor: badgeColor,
        borderColor: achievement.unlocked ? achievement.color : colors.border,
      }
    ]}>
      {renderIcon()}
      
      {showProgress && !achievement.unlocked && achievement.progress > 0 && (
        <View style={[styles.progressContainer, { backgroundColor: isDarkMode ? colors.card : colors.border }]}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${achievement.progress}%`,
                backgroundColor: achievement.color
              }
            ]} 
          />
        </View>
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <BadgeContent />
      </TouchableOpacity>
    );
  }
  
  return <BadgeContent />;
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  progressBar: {
    height: '100%',
  }
});

export default AchievementBadge;
