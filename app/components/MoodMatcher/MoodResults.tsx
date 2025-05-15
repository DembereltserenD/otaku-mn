import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import Typography from '../Typography';
import { useTheme } from '@/context/ThemeProvider';
import { Star, Film } from 'lucide-react-native';
import { AnimeItem } from './utils';

interface MoodResultsProps {
  recommendations: AnimeItem[];
  selectedMood: string | null;
  customMood: string;
  onAnimePress: (animeId: number) => void;
  onClose: () => void;
}

const MoodResults = ({ 
  recommendations, 
  selectedMood, 
  customMood, 
  onAnimePress, 
  onClose 
}: MoodResultsProps) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.stepContainer, { paddingHorizontal: 0 }]}>
      <View style={{ paddingHorizontal: 16 }}>
        <Typography variant="h3" style={styles.subtitle}>
          Your Mood Matches
        </Typography>
        <Typography
          variant="bodySmall"
          color={colors.textSecondary}
          style={styles.matchDescription}
        >
          Based on your {selectedMood === 'Other' ? customMood : selectedMood?.toLowerCase()} mood,
          here are anime recommendations just for you:
        </Typography>
      </View>

      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {recommendations.map((anime) => (
          <TouchableOpacity
            key={anime.id}
            style={[styles.animeItem, { backgroundColor: colors.card }]}
            onPress={() => onAnimePress(anime.id)}
          >
            <Image
              source={{ uri: anime.cover_image || anime.image_url }}
              style={styles.animeImage}
              resizeMode="cover"
            />
            <View style={styles.animeInfo}>
              <Typography variant="h3" numberOfLines={1} style={styles.animeTitle}>
                {anime.title}
              </Typography>
              
              <View style={styles.animeMetaRow}>
                {anime.score && (
                  <View style={styles.metaItem}>
                    <Star size={14} color={colors.warning} />
                    <Typography variant="caption" color={colors.textSecondary} style={styles.metaText}>
                      {anime.score.toFixed(1)}
                    </Typography>
                  </View>
                )}
                
                {anime.release_year && (
                  <View style={styles.metaItem}>
                    <Film size={14} color={colors.textSecondary} />
                    <Typography variant="caption" color={colors.textSecondary} style={styles.metaText}>
                      {anime.release_year}
                    </Typography>
                  </View>
                )}
              </View>
              
              <View style={styles.genreContainer}>
                {anime.genres?.slice(0, 3).map((genre: string, index: number) => (
                  <View
                    key={index}
                    style={[styles.genreTag, { backgroundColor: colors.cardHover }]}
                  >
                    <Typography variant="caption" color={colors.textSecondary}>
                      {genre}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Typography variant="button" color="#FFFFFF" style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Done
          </Typography>
        </TouchableOpacity>
      </View>
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
  matchDescription: {
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsContainer: {
    width: '100%',
    maxHeight: 400,
    marginVertical: 16,
  },
  resultsContent: {
    paddingHorizontal: 16,
  },
  animeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  animeImage: {
    width: 100,
    height: 140,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  animeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  animeTitle: {
    marginBottom: 8,
  },
  animeMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
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
  buttonContainer: {
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  doneButton: {
    backgroundColor: '#4CAF50', // Bright green color for better visibility
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MoodResults;
