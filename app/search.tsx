import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import {
  Search as SearchIcon,
  ArrowLeft,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import AnimeGrid from "@/components/AnimeGrid";
import AuthModal from "@/auth/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeProvider";
import FilterBar from "@/components/FilterBar";
import { Anime, useAnimeStore, useErrorStore } from "@/lib/store";
import Header from "@/components/Header";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import supabase from "@/lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Animation for search bar
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(searchBarAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(searchBarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch anime data from Supabase
  const fetchAnimeData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .order("rating", { ascending: false });

      if (error) {
        console.error("Error fetching anime data:", error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Fetched ${data.length} anime from Supabase`);
        setAllAnime(data);
        
        // Extract all unique genres from the anime data
        const genres = new Set<string>();
        data.forEach(anime => {
          if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach((genre: string) => genres.add(genre));
          }
        });
        
        setAvailableGenres(Array.from(genres).sort());
      } else {
        console.warn("No anime data found in Supabase");
        setAllAnime([]);
      }
    } catch (err) {
      console.error("Failed to fetch anime data:", err);
      useErrorStore.getState().addError("Failed to load anime data. Please try again later.");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Load anime data on component mount
  useEffect(() => {
    fetchAnimeData();
  }, [fetchAnimeData]);

  // Search functionality with debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim() === "" && selectedGenres.length === 0) {
        setSearchResults([]);
        setIsLoading(false);
        setInitialLoad(false);
        return;
      }

      // Never show loading state during filtering to prevent placeholders
      setIsLoading(false);

      // Filter anime based on search query and selected genres
      setTimeout(() => {
        let results = [...allAnime];

        // Filter by search query if provided
        if (query.trim() !== "") {
          results = results.filter((anime) =>
            anime.title.toLowerCase().includes(query.toLowerCase()),
          );
        }

        // Apply genre filters if any are selected
        if (selectedGenres.length > 0) {
          results = results.filter((anime) =>
            anime.genres?.some((genre) => selectedGenres.includes(genre)),
          );
        }

        setSearchResults(results);
        setIsLoading(false);
        setInitialLoad(false);
      }, 300);
    }, 300),
    [allAnime, selectedGenres, searchResults.length, initialLoad],
  );

  // Improved debounce function with proper TypeScript typing
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function (this: any, ...args: Parameters<T>) {
      const context = this;

      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    };
  }

  // Use memo to prevent unnecessary re-renders
  const memoizedSearchResults = useMemo(() => {
    return searchResults;
  }, [searchResults]);

  // Call debounced search when search query changes, but not on every genre change
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => { };
  }, [searchQuery, debouncedSearch]);

  // Separate effect for genre changes to avoid constant refreshing
  useEffect(() => {
    // Only trigger search if we have either a query or selected genres
    if (searchQuery.trim() !== "" || selectedGenres.length > 0) {
      // Never set loading state for filtering to prevent placeholders
      setIsLoading(false);

      // Short delay to prevent UI jank during consecutive filter changes
      const timer = setTimeout(() => {
        debouncedSearch(searchQuery);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedGenres, debouncedSearch, searchQuery]);

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle filter press
  const handleFilterPress = (filter: string) => {
    // Never set loading state for filtering to prevent placeholders
    setIsLoading(false);
    
    setSelectedGenres((prev) => {
      const newFilters = prev.includes(filter)
        ? prev.filter((genre) => genre !== filter)
        : [...prev, filter];

      // Turn off initial load flag to prevent placeholders
      setInitialLoad(false);

      // Schedule the search update with a single debounce
      setTimeout(() => {
        debouncedSearch(searchQuery);
      }, 0);

      return newFilters;
    });
  };

  // Handle advanced filter button press
  const handleAdvancedFilterPress = () => {
    // Add haptic feedback
    try {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available, continue silently
    }

    Alert.alert("Advanced Filters", "More filter options coming soon!", [
      { text: "OK", style: "default" },
    ]);
  };

  // Handle anime press
  const handleAnimePress = (anime: Anime) => {
    console.log(`Anime pressed: ${anime.id}`);
    // Navigate to anime details
    router.push(`/anime/${anime.id}`);
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
        onPress: () => console.log(`Added ${anime.id} to watchlist`),
      },
      {
        text: "Currently Watching",
        onPress: () => console.log(`Added ${anime.id} to currently watching`),
      },
      {
        text: "Completed",
        onPress: () => console.log(`Added ${anime.id} to completed`),
      },
    ]);
  };

  // Handle favorite toggle
  const handleFavorite = (anime: Anime) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Use Zustand store action
    useAnimeStore.getState().toggleFavorite(anime.id);
  };

  // Calculate search bar scale based on keyboard visibility
  const searchBarScale = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  // Determine if we should show loading state
  const showLoading = isDataLoading || isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View style={{ flex: 1 }}>
        {/* Search Header */}
        <Animated.View
          style={[
            styles.searchHeader,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              transform: [{ scale: searchBarScale }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            style={[styles.backButton, { backgroundColor: colors.cardHover }]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <SearchIcon size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search anime..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.clearButton}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filter Bar */}
        <FilterBar
          filters={availableGenres}
          selectedFilters={selectedGenres}
          onFilterPress={handleFilterPress}
          isLoading={isDataLoading} // Show loading state only when initially loading data
        />

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          {isDataLoading ? (
            <View style={styles.emptyStateContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>
                Loading anime...
              </Text>
            </View>
          ) : searchQuery.trim() === "" && selectedGenres.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <SearchIcon
                size={48}
                color={colors.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Search for anime
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Enter a title or select genres to find anime
              </Text>
            </View>
          ) : memoizedSearchResults.length === 0 && !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No results found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Try a different search term or filters
              </Text>
            </View>
          ) : (
            <AnimeGrid
              animeList={memoizedSearchResults}
              loading={false} // Never show loading state for the grid to prevent placeholders
              onAnimePress={handleAnimePress}
              onAddToListPress={handleAddToList}
              onFavoritePress={handleFavorite}
              numColumns={2}
              refreshing={false}
              onRefresh={fetchAnimeData}
            />
          )}
        </View>

        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchHeader: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    marginRight: 4,
  },
  filterCount: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
});
