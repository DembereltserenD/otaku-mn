import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '../Typography';
import { useTheme } from '@/context/ThemeProvider';

interface ErrorStateProps {
  error: string | null;
  onClose: () => void;
}

const ErrorState = ({ error, onClose }: ErrorStateProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.stepContainer, styles.errorContainer]}>
      <Typography
        variant="body"
        color={colors.error}
        style={styles.errorText}
      >
        {error}
      </Typography>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onClose}
      >
        <Typography variant="button" color="#FFFFFF">
          Close
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
  errorContainer: {
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    textAlign: 'center',
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

export default ErrorState;
