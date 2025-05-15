import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '../Typography';
import { useTheme } from '@/context/ThemeProvider';

interface MoodSelectProps {
  moods: string[];
  selectedMood: string | null;
  onMoodSelect: (mood: string) => void;
  onContinue: () => void;
}

const MoodSelect = ({ moods, selectedMood, onMoodSelect, onContinue }: MoodSelectProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <Typography variant="h3" style={styles.subtitle}>
        How are you feeling today?
      </Typography>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
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
            onPress={() => onMoodSelect(mood)}
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
          onPress={() => onMoodSelect('Other')}
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
        onPress={onContinue}
        disabled={!selectedMood}
      >
        <Typography variant="button" color="#FFFFFF">
          Continue
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    padding: 24,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 16,
  },
});

export default MoodSelect;
