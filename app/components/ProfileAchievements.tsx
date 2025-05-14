import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Trophy, Medal, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';
import { Achievement } from '../types/achievements';
import AchievementBadge from './AchievementBadge';

type ProfileAchievementsProps = {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  nextAchievements: Achievement[];
  handleAchievementPress: (achievement: Achievement) => void;
};

const ProfileAchievements = ({ 
  achievements, 
  unlockedAchievements, 
  nextAchievements, 
  handleAchievementPress 
}: ProfileAchievementsProps) => {
  const { colors } = useTheme();

  return (
    <View style={{ width: '100%', backgroundColor: colors.background }}>
      {/* Achievements Header */}
      <View style={styles.achievementsHeader}>
        <View style={styles.achievementsSummary}>
          <Trophy size={24} color={colors.primary} />
          <Text style={[styles.achievementsTitle, { color: colors.text }]}>
            Achievements
          </Text>
        </View>
        <Text style={[styles.achievementsSubtitle, { color: colors.textSecondary }]}>
          {unlockedAchievements.length} / {achievements.length} Unlocked
        </Text>
      </View>
      
      {/* Recent Achievements */}
      <View style={styles.achievementsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Unlocks
        </Text>
        
        {unlockedAchievements.length > 0 ? (
          <View style={styles.badgeGrid}>
            {unlockedAchievements.map((achievement: Achievement) => (
              <TouchableOpacity 
                key={achievement.id} 
                style={styles.badgeContainer}
                onPress={() => handleAchievementPress(achievement)}
              >
                <AchievementBadge achievement={achievement} />
                <Text style={[styles.badgeTitle, { color: colors.text }]} numberOfLines={1}>
                  {achievement.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Medal size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No achievements unlocked yet
            </Text>
          </View>
        )}
      </View>
      
      {/* Next Achievements */}
      <View style={styles.achievementsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Next Up
        </Text>
        
        {nextAchievements.length > 0 ? (
          <View style={styles.nextAchievements}>
            {nextAchievements.map((achievement: Achievement) => (
              <TouchableOpacity 
                key={achievement.id} 
                style={[styles.nextAchievement, { backgroundColor: colors.card }]}
                onPress={() => handleAchievementPress(achievement)}
              >
                <AchievementBadge achievement={achievement} size="small" />
                <View style={styles.nextAchievementInfo}>
                  <Text style={[styles.nextAchievementTitle, { color: colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.nextAchievementDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {achievement.description}
                  </Text>
                  <View style={[styles.nextAchievementProgress, { backgroundColor: colors.border }]}>
                    <View 
                      style={[styles.nextAchievementBar, { 
                        width: `${achievement.progress}%`,
                        backgroundColor: achievement.color 
                      }]} 
                    />
                  </View>
                </View>
                <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
                  {achievement.progress.toFixed(0)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Sparkles size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              All caught up!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  achievementsSubtitle: {
    fontSize: 14,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  badgeContainer: {
    width: '25%',
    padding: 4,
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  nextAchievements: {
    marginTop: 8,
  },
  nextAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  nextAchievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nextAchievementTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  nextAchievementDesc: {
    fontSize: 12,
    marginBottom: 6,
  },
  nextAchievementProgress: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  nextAchievementBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default ProfileAchievements;
