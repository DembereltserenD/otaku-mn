import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import useAnimeDetails from "../../hooks/useAnimeDetails";
import { supabase } from "@/lib/supabase";
import Typography from "@/components/Typography";
import Button from "@/components/Button";

// Import components
import AnimeHeader from "./components/AnimeHeader";
import ActionButtons from "./components/ActionButtons";
import EpisodesList from "./components/EpisodesList";
import RelatedAnime from "./components/RelatedAnime";

/**
 * AnimeDetailsScreen displays detailed information about a specific anime
 */
export default function AnimeDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const animeId = params.id;
  
  const { animeDetails, loading, error } = useAnimeDetails(animeId || null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<"episodes" | "related">("episodes");

  // Check favorite and watchlist status
  useEffect(() => {
    const checkUserLists = async () => {
      if (!user || !animeId) return;
      
      try {
        // Check if anime is in favorites
        const { data: favData } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("anime_id", animeId)
          .single();
        
        setIsFavorite(!!favData);
        
        // Check if anime is in watchlist
        const { data: watchlistData } = await supabase
          .from("user_anime_lists")
          .select("id")
          .eq("user_id", user.id)
          .eq("anime_id", animeId)
          .single();
        
        setIsInWatchlist(!!watchlistData);
      } catch (err) {
        console.error("Error checking user lists:", err);
      }
    };

    checkUserLists();
  }, [user, animeId]);

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!user || !animeId) {
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("anime_id", animeId);
        
        setIsFavorite(false);
      } else {
        // Add to favorites
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, anime_id: animeId });
        
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error toggling favorite status:", err);
    }
  };

  // Toggle watchlist status
  const toggleWatchlist = async () => {
    if (!user || !animeId) {
      router.push("/login");
      return;
    }

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await supabase
          .from("user_anime_lists")
          .delete()
          .eq("user_id", user.id)
          .eq("anime_id", animeId);
        
        setIsInWatchlist(false);
      } else {
        // Add to watchlist
        await supabase
          .from("user_anime_lists")
          .insert({
            user_id: user.id,
            anime_id: animeId,
            list_type: "plan_to_watch",
            progress: 0,
          });
        
        setIsInWatchlist(true);
      }
    } catch (err) {
      console.error("Error toggling watchlist status:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body" color={colors.textSecondary} style={styles.loadingText}>
            Loading anime details...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !animeDetails) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Typography variant="h2" color={colors.error} style={styles.errorText}>
            {error || "Failed to load anime details"}
          </Typography>
          <Button
            onPress={() => router.back()}
            variant="primary"
            title="Go Back"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView}>
        {/* Anime Header with Cover, Title and Metadata */}
        <AnimeHeader animeDetails={animeDetails} />

        {/* Action Buttons */}
        <ActionButtons
          animeId={animeId || ""}
          episodes={animeDetails.episodes}
          isFavorite={isFavorite}
          isInWatchlist={isInWatchlist}
          toggleFavorite={toggleFavorite}
          toggleWatchlist={toggleWatchlist}
        />

        {/* Tabs for Episodes and Related */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "episodes" && styles.activeTab]}
            onPress={() => setActiveTab("episodes")}
          >
            <Typography
              variant="body"
              color={activeTab === "episodes" ? colors.primary : colors.textSecondary}
              weight={activeTab === "episodes" ? "600" : "400"}
            >
              Episodes
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "related" && styles.activeTab]}
            onPress={() => setActiveTab("related")}
          >
            <Typography
              variant="body"
              color={activeTab === "related" ? colors.primary : colors.textSecondary}
              weight={activeTab === "related" ? "600" : "400"}
            >
              Related
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Episodes List */}
        {activeTab === "episodes" && animeDetails.episodes && (
          <EpisodesList episodes={animeDetails.episodes} animeId={animeId || ""} />
        )}

        {/* Related Anime */}
        {activeTab === "related" && animeDetails.related_anime && (
          <RelatedAnime relatedAnime={animeDetails.related_anime} />
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#6200ee",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    minWidth: 120,
  },
  bottomSpacing: {
    height: 40,
  },
});