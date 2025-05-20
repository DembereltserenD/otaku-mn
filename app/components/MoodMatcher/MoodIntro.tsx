import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '../Typography';
import { Bot } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';

interface MoodIntroProps {
  onContinue: () => void;
}

const MoodIntro = ({ onContinue }: MoodIntroProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <View style={styles.robotIconContainer}>
        <Bot size={60} color={colors.primary} />
      </View>
      <Typography variant="h2" style={styles.title}>
        Mood Matcher
      </Typography>
      <Typography
        variant="body"
        color={colors.textSecondary}
        style={styles.description}
      >
        Tell me how you're feeling today, and I'll recommend anime that matches your mood!
      </Typography>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onContinue}
      >
        <Typography variant="button" color="#FFFFFF">
          Get Started
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
  robotIconContainer: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
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

export default MoodIntro;
