import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, TrendingUp, Eye, Heart, Award, BookmarkIcon } from "lucide-react-native";
import AnimeGrid from "@/components/AnimeGrid";
import FilterBar from "@/components/FilterBar";
import supabase from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import useUserAnimeLists from "@/hooks/useUserAnimeLists";
import useFavorites from "../hooks/useFavorites";
import AuthModal from "@/auth/components/AuthModal";
import { useAnimeStore, useErrorStore, Anime } from "@/lib/store";
import { useTheme } from "@/context/ThemeProvider";
import Header from "@/components/Header";
import AnimeCard from "@/components/AnimeCard";

// Extended Anime interface with trending metrics
interface TrendingAnime extends Anime {
  watch_count: number;
  currently_watching: number;
  completed_count: number;
  plan_to_watch_count: number;
  favorite_count: number;
  trending_score: number;
}

export default function TrendingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addAnimeToList } = useUserAnimeLists();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const addError = useErrorStore(state => state.addError);
  const { colors, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [filteredAnime, setFilteredAnime] = useState<TrendingAnime[]>([]);
  const [sortOrder, setSortOrder] = useState<"trending" | "watching" | "rating">("trending");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<TrendingAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { width } = Dimensions.get("window");
  const CARD_WIDTH = (width - 24 - 8) / 2;

  // Animation for fade-in
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (filteredAnime.length > 0 && !loading) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      opacityAnim.setValue(0);
    }
  }, [filteredAnime, loading, opacityAnim]);

  // Fetch trending anime from Supabase
  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Use the trending_anime view which includes watch counts
      const { data, error } = await supabase
        .from("trending_anime")
        .select("*")
        .order("trending_score", { ascending: false });
      
      if (error) {
        console.error("Error fetching trending anime:", error);
        addError("Failed to fetch trending anime");
        
        // Fallback to regular anime table if the view doesn't exist yet
        const fallbackResponse = await supabase
          .from("anime")
          .select("*")
          .order("rating", { ascending: false });
          
        if (!fallbackResponse.error && fallbackResponse.data) {
          // Add placeholder trending metrics
          const trendingData = fallbackResponse.data.map(anime => ({
            ...anime,
            watch_count: Math.floor(Math.random() * 100) + 1,
            currently_watching: Math.floor(Math.random() * 50) + 1,
            completed_count: Math.floor(Math.random() * 30) + 1,
            plan_to_watch_count: Math.floor(Math.random() * 20) + 1,
            favorite_count: Math.floor(Math.random() * 10) + 1,
            trending_score: Math.floor(Math.random() * 300) + 1
          }));
          setTrendingAnime(trendingData);
        }
      } else if (data) {
        console.log(`Fetched ${data.length} trending anime`);
        setTrendingAnime(data);
      }
    } catch (err) {
      console.error("Failed to fetch trending anime:", err);
      addError("Failed to fetch trending anime");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrending();
  };

  // Update filtered anime when trendingAnime, selectedGenres, or sortOrder changes
  useEffect(() => {
    let result = [...trendingAnime];
    
    // Apply genre filters
    if (selectedGenres.length > 0) {
      result = result.filter((anime) =>
        anime.genres?.some((genre) => selectedGenres.includes(genre)),
      );
    }
    
    // Apply type filters
    if (selectedFilters.length > 0) {
      result = result.filter((anime) =>
        selectedFilters.includes("All") || (anime.type && selectedFilters.includes(anime.type))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortOrder === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortOrder === "watching") {
        return (b.currently_watching || 0) - (a.currently_watching || 0);
      } else {
        // Default to trending score
        return (b.trending_score || 0) - (a.trending_score || 0);
      }
    });
    
    setFilteredAnime(result);
  }, [trendingAnime, selectedGenres, selectedFilters, sortOrder]);

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle filter change
  const handleFilterChange = (filters: string[]) => {
    setSelectedGenres(filters);
  };

  // Handle sort change
  const handleSortChange = (order: "trending" | "watching" | "rating") => {
    setSortOrder(order);
  };

  // Handle anime press
  const handleAnimePress = (anime: Anime) => {
    router.push(`/anime/${anime.id}`);
  };

  // Handle favorite toggle
  const handleFavorite = async (anime: Anime) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isFavorite(anime.id)) {
        await removeFromFavorites(anime.id);
      } else {
        await addToFavorites(anime.id);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      addError("Failed to update favorites");
    }
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
        text: "Plan to Watch",
        onPress: async () => {
          await addAnimeToList(anime.id, "plan_to_watch");
        }
      },
      {
        text: "Currently Watching",
        onPress: async () => {
          await addAnimeToList(anime.id, "watching");
        }
      },
      {
        text: "Completed",
        onPress: async () => {
          await addAnimeToList(anime.id, "completed");
        }
      },
    ]);
  };

  // Render anime card with trending metrics
  const renderAnimeCard = ({ item }: { item: TrendingAnime }) => {
    return (
      <TouchableOpacity
        onPress={() => handleAnimePress(item)}
        style={{
          width: CARD_WIDTH,
          margin: 4,
          borderRadius: 12,
          backgroundColor: colors.card,
          overflow: "hidden",
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
        }}
        activeOpacity={0.8}
      >
        <AnimeCard
          anime={item}
          onPress={() => handleAnimePress(item)}
          onAddToListPress={() => handleAddToList(item)}
          onFavoritePress={() => handleFavorite(item)}
        />
        
        {/* Trending Metrics */}
        <View style={{ padding: 8, backgroundColor: colors.card }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold' }}>
                #{filteredAnime.indexOf(item) + 1}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Eye size={14} color={colors.text} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.text }}>
                {item.currently_watching || 0}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Heart size={14} color="#ff6b6b" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.text }}>
                {item.favorite_count || 0}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Award size={14} color="#ffd700" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.text }}>
                {item.completed_count || 0}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Sort options
  const sortOptions = [
    { label: "Trending", value: "trending" },
    { label: "Watching", value: "watching" },
    { label: "Rating", value: "rating" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
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
            }}
          >
            Trending Anime
          </Text>
        </View>

        {/* Filter Bar */}
        <FilterBar
          filters={["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Slice of Life", "Sports"]}
          selectedFilters={selectedGenres}
          onFilterPress={(filter: string) => {
            // Handle single filter selection
            if (selectedGenres.includes(filter)) {
              setSelectedGenres(selectedGenres.filter(g => g !== filter));
            } else {
              setSelectedGenres([...selectedGenres, filter]);
            }
          }}
          isLoading={loading}
        />

        {/* Sort Options */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSortChange(option.value as "trending" | "watching" | "rating")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor:
                  sortOrder === option.value ? colors.primary : colors.card,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color:
                    sortOrder === option.value ? "#fff" : colors.textSecondary,
                  fontWeight: sortOrder === option.value ? "bold" : "normal",
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Anime Grid */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, color: colors.textSecondary }}>
              Loading trending anime...
            </Text>
          </View>
        ) : (
          <Animated.View
            style={{
              flex: 1,
              opacity: opacityAnim,
            }}
          >
            <FlatList
              data={filteredAnime}
              renderItem={renderAnimeCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={{ padding: 4 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 32,
                    height: 300,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    No trending anime found
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    Try adjusting your filters or check back later
                  </Text>
                </View>
              }
            />
          </Animated.View>
        )}

        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}
