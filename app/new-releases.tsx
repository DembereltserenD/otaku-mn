import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import AnimeGrid from "@/components/AnimeGrid";
import FilterBar from "@/components/FilterBar";
import useAnimeData from "@/hooks/useAnimeData";
import { useAuth } from "@/context/AuthContext";
import useAnimeLists from "@/hooks/useAnimeLists";
import AuthModal from "@/auth/components/AuthModal";
import { Anime, useAnimeStore, useErrorStore } from "@/lib/store";
import { useTheme } from "@/context/ThemeProvider";
import AnimeCard from "@/components/AnimeCard";

export default function NewReleasesScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { newReleases, loading, error, fetchNewReleases } = useAnimeData();
  const { addToList } = useAnimeLists(user?.id || null);
  const addError = useErrorStore(state => state.addError);
  const { colors, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { width } = Dimensions.get("window");
  const CARD_WIDTH = (width - 24 - 8) / 2;

  // Fetch new releases on component mount
  useEffect(() => {
    fetchNewReleases();
  }, [fetchNewReleases]);

  // Show error notifications if fetch fails
  useEffect(() => {
    if (error?.newReleases) {
      addError(`Failed to load new releases: ${error.newReleases}`, 'error');
    }
  }, [error, addError]);

  // Update filtered anime when newReleases, selectedGenres, or sortOrder changes
  useEffect(() => {
    // No need to convert since we're already using the same Anime type from store
    let result = [...newReleases];

    // Apply genre filters if any are selected
    if (selectedGenres.length > 0) {
      result = result.filter((anime) =>
        anime.genres?.some((genre: string) => selectedGenres.includes(genre)),
      );
    }

    // Apply filters
    if (selectedFilters.length > 0) {
      result = result.filter((anime) =>
        selectedFilters.includes("All") || (anime.type && selectedFilters.includes(anime.type))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortOrder === "asc") {
        return (a.rating || 0) - (b.rating || 0);
      } else {
        return (b.rating || 0) - (a.rating || 0);
      }
    });

    setFilteredAnime(result);
  }, [newReleases, selectedGenres, selectedFilters, sortOrder]);

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle filter change
  const handleFilterChange = (filters: string[]) => {
    setSelectedGenres(filters);
  };

  // Handle sort change
  const handleSortChange = (order: "asc" | "desc") => {
    setSortOrder(order);
  };

  // Handle anime press
  const handleAnimePress = (anime: Anime) => {
    Alert.alert("Anime Details", `Viewing details for ${anime.title}`);
  };

  // Handle favorite toggle
  const handleFavorite = (anime: Anime) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    Alert.alert(
      "Favorites",
      `${anime.is_favorite ? "Remove from" : "Add to"} favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            // Use the store's toggleFavorite action
            useAnimeStore.getState().toggleFavorite(anime.id);
            addError(
              `${anime.is_favorite ? "Removed from" : "Added to"} favorites successfully`,
              'info'
            );
          },
        },
      ],
    );
  };

  // Handle add to list
  const handleAddToList = (anime: Anime) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    Alert.alert("Add to List", `Add "${anime.title}" to your list`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Watchlist",
        onPress: () => {
          addToList(anime.id, "watchlist");
          addError(`Added "${anime.title}" to watchlist`, 'info');
        },
      },
      {
        text: "Currently Watching",
        onPress: () => {
          addToList(anime.id, "watching");
          addError(`Added "${anime.title}" to currently watching`, 'info');
        },
      },
      {
        text: "Completed",
        onPress: () => {
          addToList(anime.id, "completed");
          addError(`Added "${anime.title}" to completed`, 'info');
        },
      },
    ]);
  };

  // Update AnimeGrid usage
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: colors.background,
          }}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.card,
            }}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              marginLeft: 16,
              textAlign: "center",
            }}
          >
            New Releases
          </Text>
          <View style={{ width: 40 }} /> {/* Empty view for balance */}
        </View>

        <FilterBar
          filters={["All", "TV", "Movie", "OVA", "Special"]}
          selectedFilters={selectedFilters}
          onFilterPress={(filter: string) => {
            // Toggle the filter in the selectedFilters array
            if (selectedFilters.includes(filter)) {
              setSelectedFilters(selectedFilters.filter(f => f !== filter));
            } else {
              setSelectedFilters([...selectedFilters, filter]);
            }
          }}
        />

        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <FlatList
            data={filteredAnime}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            renderItem={({ item }) => (
              <AnimeCard
                anime={item}
                onPress={() => handleAnimePress(item)}
                onFavoritePress={() => handleFavorite(item)}
                onAddToListPress={() => handleAddToList(item)}
                showRating={true}
                style={{ width: CARD_WIDTH, marginHorizontal: 4 }}
              />
            )}
            refreshing={loading.newReleases}
            onRefresh={fetchNewReleases}
          />
        </View>

        {showAuthModal && (
          <AuthModal
            visible={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
