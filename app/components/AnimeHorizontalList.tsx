import React from "react";
import {
  FlatList,
  ListRenderItem,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import AnimeCard from "@/components/AnimeCard";
import { useTheme } from "@/context/ThemeProvider";
import { router } from "expo-router";
import type { Database } from "@/lib/database.types";
import { Anime as StoreAnime } from "@/lib/store";

type UUID = string;
type Tables = Database["public"]["Tables"];
type Anime = Tables["anime"]["Row"] & {
  is_favorite?: boolean;
  episode_count?: number;
  release_year?: number;
  is_new?: boolean;
};

interface AnimeHorizontalListProps {
  title: string;
  data: Anime[];
  loading?: boolean;
  onSeeAllPress?: () => void;
  onAnimePress?: (anime: Anime) => void;
  onFavorite?: (anime: Anime) => void;
}

/**
 * AnimeHorizontalList component displays a horizontal scrollable list of anime
 * with a title and optional "See All" button.
 */
const AnimeHorizontalList = React.memo(function AnimeHorizontalList({
  title,
  data = [],
  loading = false,
  onSeeAllPress,
  onAnimePress,
  onFavorite,
}: AnimeHorizontalListProps) {
  const { colors } = useTheme();

  const renderItem: ListRenderItem<Anime> = ({ item }) => {
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

    // Convert database anime to store anime format
    const animeData: StoreAnime = {
      id: item.id,
      title: item.title,
      image_url: item.image_url,
      rating: item.rating === null ? undefined : item.rating,
      is_favorite: item.is_favorite,
      description: item.description === null ? undefined : item.description,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      genres: [],
      release_date: item.release_year ? `${item.release_year}-01-01` : undefined,
      episode_count: item.episode_count,
      release_year: item.release_year,
      is_new: item.is_new
    };

    return (
      <AnimeCard
        anime={animeData}
        onPress={() => handlePress()}
        onFavoritePress={() => onFavorite?.(item)}
      />
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No anime available
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {onSeeAllPress && (
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={onSeeAllPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    marginRight: 4,
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  separator: {
    width: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
    width: 240,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
    width: 240,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
  },
});

export default AnimeHorizontalList;
