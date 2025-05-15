import React from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Typography from '../Typography';
import { useTheme } from '@/context/ThemeProvider';

interface CustomMoodProps {
  customMood: string;
  onCustomMoodChange: (text: string) => void;
  onContinue: () => void;
}

const CustomMood = ({ customMood, onCustomMoodChange, onContinue }: CustomMoodProps) => {
  const { colors } = useTheme();

  return (
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
          onChangeText={onCustomMoodChange}
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
          onPress={onContinue}
          disabled={!customMood.trim()}
        >
          <Typography variant="button" color="#FFFFFF">
            Find Anime
          </Typography>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
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
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
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

export default CustomMood;
