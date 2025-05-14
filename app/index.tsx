import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, SafeAreaView, StatusBar, Alert, Platform, ScrollView, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import AnimeGrid from "@/components/AnimeGrid";
import AuthModal from "@/auth/components/AuthModal";
import MenuDrawer from "@/components/MenuDrawer";
import { useAuth } from "@/context/AuthContext";
import SectionHeader from "./components/SectionHeader";
import AnimeRow from "./components/AnimeRow";
import AnimeCard from "./components/AnimeCard";
import supabase from "@/lib/supabase";
import useFavorites from "../hooks/useFavorites";
import { Anime, useAnimeStore, useErrorStore } from "@/lib/store";
import Typography from "@/components/Typography";
import useAnimeData from "@/hooks/useAnimeData";
import useUserAnimeLists from "@/hooks/useUserAnimeLists";

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("Guest");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [currentSortOrder, setCurrentSortOrder] = useState<"asc" | "desc">(
    "desc",
  );
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Get favorites data
  const {
    favorites,
    loading: favoritesLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  } = useFavorites();

  // Get user anime lists data
  const { 
    addAnimeToList, 
    loading: listsLoading 
  } = useUserAnimeLists();

  // Get anime data from the hook that now fetches from Supabase
  const { 
    newReleases, 
    trending, 
    popular,
    loading: animeDataLoading,
    error: animeDataError,
    fetchNewReleases,
    fetchTrending,
    fetchPopular
  } = useAnimeData();

  // Extract individual loading states to fix TypeScript errors
  const isTrendingLoading = animeDataLoading?.trending || false;
  const isNewReleasesLoading = animeDataLoading?.newReleases || false;
  const isPopularLoading = animeDataLoading?.popular || false;
  // Combined loading state for UI that needs a single boolean
  const isAnyAnimeDataLoading = isTrendingLoading || isNewReleasesLoading || isPopularLoading;

  // Fetch all anime from Supabase
  const fetchAnime = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("anime").select("*");
      if (error) {
        console.error("Error fetching anime:", error);
        throw error;
      }
      if (data) {
        console.log("Fetched anime data:", data.length, "items");
        setAnimeList(data);
        
        // Extract unique genres from anime data
        const uniqueGenres = new Set<string>();
        data.forEach(anime => {
          if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach((genre: string) => {
              if (genre) uniqueGenres.add(genre);
            });
          }
        });
        
        // Convert Set to sorted Array
        const genreArray = Array.from(uniqueGenres).sort();
        setAvailableGenres(genreArray);
        console.log("Extracted genres:", genreArray);
      }
    } catch (err) {
      console.error("Failed to fetch anime:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread notification count from Supabase
  const fetchNotificationCount = useCallback(async () => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) {
        console.error('Error fetching notification count:', error);
        return;
      }
      
      // Set the notification count
      const unreadCount = count || 0;
      setNotificationCount(unreadCount);
      console.log('Unread notifications:', unreadCount);
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  }, [user]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAnime(),
        fetchNewReleases(),
        fetchTrending(),
        fetchPopular(),
        fetchNotificationCount()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnime, fetchNewReleases, fetchTrending, fetchPopular, fetchNotificationCount]);

  useEffect(() => {
    // Fetch data when component mounts
    fetchAnime();
    fetchNewReleases();
    fetchTrending();
    fetchPopular();
    fetchNotificationCount();
    
    // Check authentication status
    if (user) {
      setIsAuthenticated(true);
      setUsername(user.email?.split("@")[0] || "User");
    } else {
      setIsAuthenticated(false);
      setUsername("Guest");
    }
  }, [fetchAnime, fetchNewReleases, fetchTrending, fetchPopular, fetchNotificationCount, user]);

  // Define filter options based on available genres from Supabase
  const filterOptions = useMemo(
    () => availableGenres.map(genre => ({
      id: genre.toLowerCase().replace(/\s+/g, '-'),
      label: genre,
      value: genre
    })),
    [availableGenres],
  );

  // Update filtered anime when animeList, selectedGenres, or currentSortOrder changes
  const filteredAnimeList = useMemo(() => {
    let result = [...animeList];
    if (selectedGenres.length > 0) {
      result = result.filter((anime) =>
        anime.genres?.some((genre: string) => selectedGenres.includes(genre)),
      );
    }
    return result.sort((a, b) => {
      if (currentSortOrder === "asc") {
        return (a.rating ?? 0) - (b.rating ?? 0);
      } else {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
    });
  }, [animeList, selectedGenres, currentSortOrder]);

  // Filter trending anime based on selected genres
  const filteredTrending = useMemo(() => {
    if (selectedGenres.length === 0) return trending;
    return trending.filter((anime) =>
      anime.genres?.some((genre: string) => selectedGenres.includes(genre))
    );
  }, [trending, selectedGenres]);

  // Filter new releases based on selected genres
  const filteredNewReleases = useMemo(() => {
    if (selectedGenres.length === 0) return newReleases;
    return newReleases.filter((anime) =>
      anime.genres?.some((genre: string) => selectedGenres.includes(genre))
    );
  }, [newReleases, selectedGenres]);

  // Filter popular anime based on selected genres
  const filteredPopular = useMemo(() => {
    if (selectedGenres.length === 0) return popular;
    return popular.filter((anime) =>
      anime.genres?.some((genre: string) => selectedGenres.includes(genre))
    );
  }, [popular, selectedGenres]);

  // Get current route for bottom navigation
  const currentRoute = useMemo(() => {
    if (pathname === "/") return "/";
    if (pathname.startsWith("/search")) return "/search";
    if (pathname.startsWith("/favorites")) return "/favorites";
    if (pathname.startsWith("/profile")) return "/profile";
    return "/";
  }, [pathname]);

  // Simulate loading state
  const [isLoading, setIsLoading] = useState(false);

  // Handle user profile press
  const handleProfilePress = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      // Navigate to profile page
      router.push("/profile");
    }
  };

  // Handle menu press
  const handleMenuPress = () => {
    setShowMenuDrawer(true);
  };

  // Handle menu item press
  const handleMenuItemPress = (item: string) => {
    setShowMenuDrawer(false);

    switch (item) {
      case "home":
        router.push("/");
        break;
      case "search":
        router.push("/search");
        break;
      case "lists":
        if (isAuthenticated) {
          router.push("/lists");
        } else {
          setShowAuthModal(true);
        }
        break;
      case "profile":
        if (isAuthenticated) {
          router.push("/profile");
        } else {
          setShowAuthModal(true);
        }
        break;
      case "trending":
        router.push("/trending");
        break;
      case "new_releases":
        router.push("/new-releases");
        break;
      case "top_rated":
        Alert.alert("Top Rated", "Top rated anime page is coming soon");
        break;
      case "popular":
        Alert.alert("Most Popular", "Most popular anime page is coming soon");
        break;
      case "settings":
        Alert.alert("Settings", "Settings page is under construction");
        break;
      case "about":
        Alert.alert(
          "About",
          "Otaku Mongolia - Version 1.0.0\n\nA React Native Expo app for Mongolian anime enthusiasts.",
        );
        break;
      case "login":
        setShowAuthModal(true);
        break;
      case "logout":
        handleLogout();
        break;
      case "notifications":
        router.push("/notifications");
        break;
      default:
        break;
    }
  };

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // In a real implementation, this would use the auth hook
      // const { data, error } = await signIn(email, password);
      // if (error) throw error;

      // Simulate login for now
      console.log(`Login with ${email} and ${password}`);
      setIsAuthenticated(true);
      setUsername(email.split("@")[0]); // Use part of email as username
      setShowAuthModal(false);
      setShowMenuDrawer(false);
      Alert.alert("Success", "You have successfully logged in!");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error instanceof Error
          ? error.message
          : "Please check your credentials and try again",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = (
    email: string,
    password: string,
    username: string,
  ) => {
    // Simulate registration
    console.log(`Register with ${email}, ${password}, and ${username}`);
    setIsAuthenticated(true);
    setUsername(username);
    setShowAuthModal(false);
    setShowMenuDrawer(false);
    Alert.alert("Success", "Your account has been created successfully!");
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("Guest");
    Alert.alert("Logged Out", "You have been logged out successfully");
  };

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    // Simulate social login
    console.log(`Login with ${provider}`);
    setIsAuthenticated(true);
    setUsername(`${provider}_user`);
    setShowAuthModal(false);
    setShowMenuDrawer(false);
    Alert.alert("Success", `You have successfully logged in with ${provider}!`);
  };

  // Handle anime press
  const handleAnimePress = useCallback((anime: Anime) => {
    router.push({
      pathname: `/anime/${anime.id}`,
    });
  }, [router]);

  // Handle favorite toggle with our new hook
  const handleFavorite = useCallback(async (anime: Anime) => {
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
    }
  }, [user, isFavorite, addToFavorites, removeFromFavorites]);

  // Handle add to list
  const handleAddToList = useCallback((anime: Anime) => {
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
  }, [user, addAnimeToList]);

  // Handle filter change
  const handleFilterChange = (filters: string[]) => {
    setSelectedGenres(filters);
    console.log("Filters changed:", JSON.stringify(filters));
  };

  // Handle sort change
  const handleSortChange = (sortOrder: "asc" | "desc") => {
    console.log("Sort order changed:", sortOrder);
    setCurrentSortOrder(sortOrder);
  };

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && filteredAnimeList.length >= 8) {
      setIsLoading(true);
      // Simulate loading more data
      setTimeout(() => {
        setIsLoading(false);
        // Don't show "End of List" alert
        // Add more anime to the list if needed
      }, 1500);
    }
  }, [isLoading, filteredAnimeList.length]);

  // Handle refresh with pull-to-refresh gesture
  const handleRefresh = useCallback(() => {
    console.log("Refreshing anime list");
    setIsLoading(true);

    // Provide haptic feedback for refresh
    try {
      const Haptics = require("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available, continue silently
    }

    // Instead of modifying animeList directly, trigger a refresh of data
    // using our data fetching hooks
    fetchAnime();

    // Then end the loading state after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [fetchAnime]);

  // Handle search press
  const handleSearchPress = () => {
    router.push("/search");
  };

  // Handle filter button press
  const handleFilterButtonPress = () => {
    Alert.alert("Advanced Filters", "Select filters to apply", [
      { text: "Cancel", style: "cancel" },
      { text: "Apply", onPress: () => console.log("Applied advanced filters") },
    ]);
  };

  // Close AuthModal on route change away from /profile
  useEffect(() => {
    if (showAuthModal && pathname !== "/profile") {
      setShowAuthModal(false);
    }
  }, [pathname, showAuthModal]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        <Header
          title="AnimeTempo"
          showBack={false}
          showSearch={true}
          showNotifications={true}
          showMenu={true}
          onSearchPress={handleSearchPress}
          onNotificationsPress={() => handleMenuItemPress("notifications")}
          onMenuPress={handleMenuPress}
          notificationCount={notificationCount}
        />

        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <FilterBar
            filters={filterOptions.map((option) => option.value)}
            selectedFilters={selectedGenres}
            onFilterPress={(filter: string) => {
              if (selectedGenres.includes(filter)) {
                handleFilterChange(
                  selectedGenres.filter((genre) => genre !== filter),
                );
              } else {
                handleFilterChange([...selectedGenres, filter]);
              }
            }}
            isLoading={isAnyAnimeDataLoading}
          />

          {/* Trending Section - Moved to top */}
          <View style={{ marginTop: 4 }}>
            <SectionHeader
              title="Trending Now"
              onSeeAllPress={() => router.push("/trending")}
            />
            <View className="h-[280px]">
              {isTrendingLoading ? (
                <View className="flex-row justify-center items-center h-full">
                  <ActivityIndicator color="#6366F1" />
                </View>
              ) : (
                <FlatList
                  data={filteredTrending}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <AnimeCard
                      anime={{
                        id: item.id,
                        title: item.title,
                        image_url: item.image_url,
                        rating: item.rating,
                        genres: item.genres,
                        release_date: item.release_date,
                        is_favorite: isFavorite(item.id),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }}
                      onPress={() => handleAnimePress({
                        id: item.id,
                        title: item.title,
                        image_url: item.image_url,
                        rating: item.rating,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })}
                      onFavoritePress={() => handleFavorite({
                        id: item.id,
                        title: item.title,
                        image_url: item.image_url,
                        rating: item.rating,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })}
                      style={{ width: 140, marginHorizontal: 4 }}
                    />
                  )}
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                />
              )}
            </View>
          </View>

          {/* New Releases Section - Moved to top */}
          <SectionHeader
            title="New Releases"
            onSeeAllPress={() => router.push("/new-releases")}
            delay={500}
          />
          <AnimeRow
            data={filteredNewReleases}
            loading={isNewReleasesLoading}
            onAnimePress={handleAnimePress}
            onRefresh={fetchNewReleases}
            refreshing={false}
          />

          {/* Favorites Section - Only show if user is logged in and has favorites */}
          {user && favorites.length > 0 && (
            <View className="mt-4">
              <SectionHeader
                title="My Favorites"
                onSeeAllPress={() => router.push("/favorites")}
              />
              <View className="h-[280px]">
                {favoritesLoading ? (
                  <View className="flex-row justify-center items-center h-full">
                    <ActivityIndicator color="#6366F1" />
                  </View>
                ) : (
                  <FlatList
                    data={favorites}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <AnimeCard
                        anime={{
                          id: item.id,
                          title: item.title,
                          image_url: item.image_url,
                          rating: item.rating || 0,
                          genres: item.genres || [],
                          release_date: item.release_date || "",
                          is_favorite: true,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        }}
                        onPress={() => handleAnimePress({
                          id: item.id,
                          title: item.title,
                          image_url: item.image_url,
                          rating: item.rating || 0,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        })}
                        onFavoritePress={() => handleFavorite({
                          id: item.id,
                          title: item.title,
                          image_url: item.image_url,
                          rating: item.rating || 0,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        })}
                        style={{ width: 140, marginHorizontal: 8 }}
                      />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Filtered Anime Grid - Moved below trending and new releases */}
          <View style={{ paddingBottom: 8 }}>
            <AnimeGrid
              animeList={filteredAnimeList}
              loading={isAnyAnimeDataLoading}
              refreshing={false}
              onAnimePress={handleAnimePress}
              onAddToListPress={handleAddToList}
              onFavoritePress={handleFavorite}
              numColumns={2}
              scrollEnabled={false}
            />
          </View>

          {/* Show more content from filteredAnimeList if needed */}
          <SectionHeader
            title="Recommended For You"
            delay={700}
          />
          <View style={{ paddingBottom: Platform.OS === "ios" ? 80 : 60 }}>
            <AnimeGrid
              animeList={filteredAnimeList}
              loading={false}
              onAnimePress={handleAnimePress}
              onAddToListPress={handleAddToList}
              onFavoritePress={handleFavorite}
              numColumns={2}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>

        {showAuthModal && (
          <AuthModal
            visible={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}

        <MenuDrawer
          visible={showMenuDrawer}
          onClose={() => setShowMenuDrawer(false)}
          onMenuItemPress={handleMenuItemPress}
          isAuthenticated={isAuthenticated}
          username={username}
          avatarUrl={
            isAuthenticated
              ? `https://api.dicebear.com/7.x/avataaars/png?seed=${username}`
              : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}
