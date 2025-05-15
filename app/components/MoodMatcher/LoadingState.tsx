import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Typography from '../Typography';
import { useTheme } from '@/context/ThemeProvider';

const LoadingState = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.stepContainer, styles.loadingContainer]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Typography
        variant="body"
        color={colors.textSecondary}
        style={styles.loadingText}
      >
        Finding your perfect anime match...
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LoadingState;
