import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';
import { Achievement } from '@/types/achievements';
import AchievementBadge from './AchievementBadge';

type AchievementModalProps = {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
};

const AchievementModal = ({ visible, achievement, onClose }: AchievementModalProps) => {
  const { colors } = useTheme();
  
  if (!achievement) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Achievement Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            <View style={styles.achievementContainer}>
              <AchievementBadge achievement={achievement} size="large" showProgress={true} />
              
              <View style={styles.detailsContainer}>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>
                  {achievement.title}
                </Text>
                
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {achievement.description}
                </Text>
                
                {!achievement.unlocked && (
                  <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${achievement.progress}%`,
                            backgroundColor: achievement.color
                          }
                        ]} 
                      />
                    </View>
                    
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {achievement.progress.toFixed(0)}% Complete
                    </Text>
                  </View>
                )}
                
                <View style={[styles.statusBadge, { 
                  backgroundColor: achievement.unlocked 
                    ? achievement.color + '20'
                    : colors.cardHover
                }]}>
                  <Text style={[styles.statusText, { 
                    color: achievement.unlocked 
                      ? achievement.color
                      : colors.textSecondary
                  }]}>
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.requirementsContainer, { borderColor: colors.border }]}>
              <Text style={[styles.requirementsTitle, { color: colors.text }]}>
                Requirements
              </Text>
              
              <Text style={[styles.requirementsText, { color: colors.textSecondary }]}>
                {achievement.description}
              </Text>
              
              <Text style={[styles.progressDetails, { color: colors.text }]}>
                Progress: {Math.round((achievement.progress / 100) * achievement.threshold)} / {achievement.threshold}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsContainer: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressDetails: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AchievementModal;
