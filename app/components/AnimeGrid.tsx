import React, { useRef, useEffect, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  ListRenderItem,
  Dimensions,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import AnimeCard from "@/components/AnimeCard";
import { useTheme } from "@/context/ThemeProvider";
import { router } from "expo-router";
import { Anime } from "@/lib/store";
import * as Haptics from 'expo-haptics';

type UUID = string;

interface AnimeGridProps {
  animeList: Anime[];
  data?: Anime[]; // For backward compatibility 
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onAnimePress?: (anime: Anime) => void;
  onAddToListPress?: (anime: Anime) => void;
  onFavoritePress?: (anime: Anime) => void;
  // For backward compatibility
  onAddToList?: (anime: Anime) => void;
  onFavorite?: (anime: Anime) => void;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  numColumns?: number;
  scrollEnabled?: boolean;
  showRating?: boolean;
  showHeader?: boolean;
}

/**
 * AnimeGrid component displays a grid of anime cards with support for
 * refreshing, pagination, and interactions.
 *
 * @param props - Component props
 * @returns AnimeGrid component
 */
const AnimeGrid = React.memo(function AnimeGrid({
  animeList: propAnimeList,
  data,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onAnimePress,
  onAddToListPress,
  onFavoritePress,
  onAddToList, // For backward compatibility
  onFavorite, // For backward compatibility
  ListEmptyComponent,
  ListHeaderComponent,
  numColumns = 2,
  scrollEnabled = true,
  showRating = true,
  showHeader = true,
}: AnimeGridProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 32) / numColumns; // 32 = padding (16) * 2
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start at 1 to avoid initial fade-in
  const prevAnimeListRef = useRef<Anime[]>([]);
  const isInitialRender = useRef(true);
  const animationOngoing = useRef(false);

  // Support both animeList and data props for backward compatibility
  const animeList = propAnimeList || data || [];

  // Memoize the anime list to prevent unnecessary re-renders
  const memoizedAnimeList = useMemo(() => animeList, [animeList]);

  // Only fade in when data actually changes in meaningful ways
  useEffect(() => {
    // Skip animation on first render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevAnimeListRef.current = [...memoizedAnimeList];
      return;
    }

    // Skip animation if loading is in progress or list is empty
    if (loading || memoizedAnimeList.length === 0) return;

    // Calculate a similarity score between previous and current lists
    const currentIds = new Set(memoizedAnimeList.map(anime => anime.id));
    const prevIds = new Set(prevAnimeListRef.current.map(anime => anime.id));

    // If it's just a filter operation (subset of original data), don't animate
    const isFilterOperation =
      [...currentIds].every(id => prevIds.has(id)) ||
      [...prevIds].every(id => currentIds.has(id));

    if (!isFilterOperation && !animationOngoing.current) {
      // Only animate if this is a new set of data, not just filtering
      animationOngoing.current = true;

      // Fast, subtle animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        animationOngoing.current = false;
      });
    }

    // Update the ref with current list
    prevAnimeListRef.current = [...memoizedAnimeList];
  }, [memoizedAnimeList, loading, fadeAnim]);

  const handleRefresh = () => {
    if (onRefresh) {
      // Provide haptic feedback on refresh
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptics not available');
      }
      onRefresh();
    }
  };

  const renderItem: ListRenderItem<Anime> = ({ item, index }) => {
    const handlePress = () => {
      if (onAnimePress) {
        onAnimePress(item);
      } else {
        // Navigate to anime details screen
        router.push({
          pathname: `/anime/${item.id}`,
        });
      }
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            width: cardWidth,
            opacity: fadeAnim,
          }
        ]}
      >
        <AnimeCard
          anime={item}
          onPress={() => handlePress()}
          onFavoritePress={() => {
            // Add haptic feedback when toggling favorite
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              console.log('Haptics not available');
            }
            // Support both onFavoritePress and onFavorite
            if (onFavoritePress) {
              onFavoritePress(item);
            } else if (onFavorite) {
              onFavorite(item);
            }
          }}
          onAddToListPress={
            onAddToListPress
              ? () => onAddToListPress(item)
              : onAddToList
                ? () => onAddToList(item)
                : undefined
          }
          showRating={showRating}
        />
      </Animated.View>
    );
  };

  const keyExtractor = (item: Anime) => item.id.toString();

  // Create repeating array for skeleton loading
  const renderSkeletonLoading = () => {
    return (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={`skeleton-${index}`} style={[styles.cardContainer, { width: cardWidth }]}>
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSubtitle} />
                <View style={styles.skeletonRating} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Default empty state component
  const defaultEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          {renderSkeletonLoading()}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        {renderSkeletonLoading()}
      </View>
    );
  };

  // Disable skeleton loaders during filter operations - only show on initial load
  if (loading && !refreshing && animeList.length === 0 && isInitialRender.current) {
    return (
      <View
        style={[
          styles.fullScreenLoading,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.skeletonGrid}>
          {renderSkeletonLoading()}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 0 }]}>
      <FlatList
        removeClippedSubviews={true}
        data={memoizedAnimeList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={8}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        numColumns={numColumns}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        scrollEnabled={scrollEnabled}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={10}
              progressBackgroundColor={colors.card}
            />
          ) : undefined
        }
        ListEmptyComponent={ListEmptyComponent || defaultEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={
          loading && animeList.length > 0 && !isInitialRender.current ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
  },
  fullScreenLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: "center",
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  skeletonCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    overflow: 'hidden',
    height: 220,
    width: '100%',
  },
  skeletonImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#3A3A3A',
  },
  skeletonContent: {
    padding: 8,
  },
  skeletonTitle: {
    height: 14,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 12,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonRating: {
    height: 10,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    width: '40%',
  },
});

export default AnimeGrid;
