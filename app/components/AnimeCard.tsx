import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import { Heart, Plus, Play } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';
import { Anime } from '@/lib/store';

interface AnimeCardProps {
  anime: Anime;
  onPress?: (anime: Anime) => void;
  onFavoritePress?: (anime: Anime) => void;
  onAddToListPress?: (anime: Anime) => void;
  onPlayPress?: (anime: Anime) => void;
  showRating?: boolean;
  showControls?: boolean;
  imageOnly?: boolean;
  style?: object;
}

/**
 * AnimeCard component displays an anime card with image, title, and actions
 */
const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onPress,
  onFavoritePress,
  onAddToListPress,
  onPlayPress,
  showRating = true,
  showControls = true,
  imageOnly = false,
  style,
}) => {
  const { colors } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract release year from release_date if available
  const releaseYear = anime.release_date
    ? new Date(anime.release_date).getFullYear()
    : undefined;

  // Handle card press
  const handlePress = () => {
    if (onPress) {
      onPress(anime);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {/* Show favorite icon */}
        {showControls && (
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: colors.background }]}
            onPress={() => onFavoritePress?.(anime)}
          >
            <Heart
              size={16}
              color={anime.is_favorite ? colors.primary : colors.text}
              fill={anime.is_favorite ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        )}

        {/* Show play button for watchable content */}
        {showControls && onPlayPress && (
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.background }]}
            onPress={() => onPlayPress(anime)}
          >
            <Play size={16} color={colors.text} />
          </TouchableOpacity>
        )}

        {/* Anime Image */}
        <Image
          source={{
            uri:
              anime.image_url && anime.image_url.trim() !== ''
                ? anime.image_url
                : 'https://placehold.co/300x450?text=No+Image',
          }}
          style={styles.image}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Rating badge */}
        {showRating && anime.rating !== undefined && (
          <View style={[styles.ratingBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              ★ {anime.rating.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Add to list button */}
        {showControls && onAddToListPress && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.background }]}
            onPress={() => onAddToListPress(anime)}
          >
            <Plus size={16} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Only show text info if not imageOnly */}
      {!imageOnly && (
        <View style={styles.infoContainer}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {anime.title}
          </Text>

          <View style={styles.metaContainer}>
            {/* Show release year if available */}
            {releaseYear && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {releaseYear}
              </Text>
            )}

            {/* Genres text */}
            {anime.genres && anime.genres.length > 0 && (
              <Text
                style={[styles.metaText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {anime.genres.slice(0, 2).join(' • ')}
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 2 / 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  playButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 10,
    opacity: 0.8,
  },
});

export default AnimeCard;
