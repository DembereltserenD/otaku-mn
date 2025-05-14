import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Eye,
  BookmarkIcon,
  Heart,
  Award,
  Clock,
  MoreVertical,
  Star,
  Filter,
  BookOpen,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import useFavorites from "../hooks/useFavorites";
import useUserAnimeLists, { UserAnimeListItem } from "@/hooks/useUserAnimeLists";
import supabase from "@/lib/supabase";

export default function LibraryScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const { favorites, loading: favoritesLoading, fetchFavorites, removeFromFavorites, addToFavorites, isFavorite } = useFavorites();
  const { lists, loading: listsLoading, fetchUserAnimeLists, updateAnimeInList, removeAnimeFromList } = useUserAnimeLists();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState("library");
  const [selectedList, setSelectedList] = useState(params.tab || "favorites");
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  // Update selected list when params change
  useEffect(() => {
    if (params.tab) {
      setSelectedList(params.tab);
    }
  }, [params.tab]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserAnimeLists(),
      fetchFavorites()
    ]);
    setRefreshing(false);
  };

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setSelectedList(tab);
  };

  // Handle anime press
  const handleAnimePress = (anime: UserAnimeListItem) => {
    router.push(`/anime/${anime.anime_id}`);
  };

  // Handle remove from list
  const handleRemoveFromList = (anime: UserAnimeListItem) => {
    Alert.alert(
      "Remove Anime",
      `Are you sure you want to remove "${anime.title}" from your ${selectedList} list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const success = await removeAnimeFromList(anime.id);
            if (success) {
              showToast(`Removed from ${selectedList} list`);
            }
          },
        },
      ]
    );
  };

  // Handle update progress
  const handleUpdateProgress = (anime: UserAnimeListItem, newProgress: number) => {
    // If progress reaches 100%, ask if they want to move it to completed
    if (newProgress === 100) {
      Alert.alert(
        "Progress Complete",
        "Would you like to move this anime to your Completed list?",
        [
          {
            text: "Keep in Watching",
            style: "cancel",
            onPress: () => {
              updateAnimeInList(anime.id, { progress: newProgress })
                .then((success: boolean) => {
                  if (success) {
                    showToast(`Updated progress to ${newProgress}%`);
                  }
                });
            }
          },
          {
            text: "Move to Completed",
            onPress: () => {
              updateAnimeInList(anime.id, { 
                progress: 100, 
                list_type: "completed" 
              }).then((success: boolean) => {
                if (success) {
                  showToast(`Moved to completed list`);
                  // Switch to completed tab after a short delay
                  setTimeout(() => {
                    setSelectedList("completed");
                  }, 500);
                }
              });
            }
          }
        ]
      );
    } else {
      // Regular progress update
      updateAnimeInList(anime.id, { progress: newProgress })
        .then((success: boolean) => {
          if (success) {
            showToast(`Updated progress to ${newProgress}%`);
          }
        });
    }
  };

  // Handle move to list
  const handleMoveToList = (anime: UserAnimeListItem, newListType: 'watching' | 'completed' | 'plan_to_watch') => {
    // If moving to watching from plan_to_watch, set initial progress to 0
    let updates: any = { list_type: newListType };
    
    if (newListType === 'watching' && anime.list_type === 'plan_to_watch') {
      updates.progress = 0;
    }
    
    // If moving to completed, set progress to 100%
    if (newListType === 'completed') {
      updates.progress = 100;
    }
    
    updateAnimeInList(anime.id, updates)
      .then((success: boolean) => {
        if (success) {
          showToast(`Moved to ${newListType.replace('_', ' ')} list`);
        }
      });
  };

  // Get current list data
  const getCurrentListData = () => {
    if (selectedList === 'favorites' && favorites) {
      // Convert favorites to UserAnimeListItem format for consistent rendering
      return favorites.map(fav => ({
        id: fav.id,
        anime_id: fav.id, // Use the same ID for both
        title: fav.title,
        image_url: fav.image_url,
        rating: fav.rating || 0,
        progress: 0, // Favorites don't have progress
        list_type: 'favorites' as any, // Cast as any since 'favorites' is not in the union type
        created_at: new Date().toISOString(), // Use current date as default
        genres: fav.genres
      } as UserAnimeListItem));
    }
    
    return lists[selectedList as keyof typeof lists] || [];
  };

  // Check if user is authenticated
  if (!user && !authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <BookmarkIcon size={48} color={colors.primary} style={{ marginBottom: 16, opacity: 0.7 }} />
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, textAlign: "center", marginBottom: 8 }}>
            Sign in to view your library
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 24 }}>
            Keep track of anime you're watching, plan to watch, and have completed
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render list item
  const renderListItem = ({ item }: { item: UserAnimeListItem }) => {
    const progressPercentage = item.progress || 0;
    
    return (
      <TouchableOpacity
        onPress={() => handleAnimePress(item)}
        style={{
          flexDirection: "row",
          padding: 16,
          borderRadius: 16,
          marginBottom: 16,
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        activeOpacity={0.7}
      >
        {/* Anime Image with Favorite Icon */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.image_url }}
            style={{
              width: 100,
              height: 150,
              borderRadius: 12,
              backgroundColor: colors.cardHover,
            }}
            resizeMode="cover"
          />
          
          {/* Favorite Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 20,
              padding: 6,
            }}
            onPress={() => {
              if (isFavorite(item.anime_id)) {
                removeFromFavorites(item.anime_id);
              } else {
                addToFavorites(item.anime_id);
              }
            }}
          >
            <Heart 
              size={16} 
              color="#fff" 
              fill={isFavorite(item.anime_id) ? "#ff6b6b" : "transparent"}
            />
          </TouchableOpacity>
        </View>

        {/* Anime Details */}
        <View style={{ flex: 1, marginLeft: 16, justifyContent: "space-between" }}>
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {/* Genres */}
            {item.genres && item.genres.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {item.genres.slice(0, 2).map((genre: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.primary + '20',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.primary,
                        fontWeight: '600',
                      }}
                    >
                      {genre}
                    </Text>
                  </View>
                ))}
                {item.genres.length > 2 && (
                  <View
                    style={{
                      backgroundColor: colors.cardHover,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      +{item.genres.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Rating */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Star
                size={16}
                color="#FFD700"
                fill="#FFD700"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: '600',
                }}
              >
                {item.rating ? item.rating.toFixed(1) : "N/A"}
              </Text>
            </View>
          </View>

          {/* Progress Bar (only for watching) */}
          {selectedList === "watching" && (
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  Progress
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: progressPercentage >= 75 ? colors.primary : colors.textSecondary,
                    fontWeight: progressPercentage >= 75 ? 'bold' : '500',
                  }}
                >
                  {progressPercentage}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.border,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${progressPercentage}%`,
                    backgroundColor: progressPercentage < 25 ? '#FF9800' : 
                                    progressPercentage < 50 ? '#2196F3' : 
                                    progressPercentage < 75 ? '#8BC34A' : 
                                    '#4CAF50',
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 10,
              alignItems: 'center',
            }}
          >
            {/* List Type Badge */}
            <View
              style={{
                backgroundColor: 
                  selectedList === "watching" ? '#2196F3' + '30' : 
                  selectedList === "completed" ? '#4CAF50' + '30' : 
                  selectedList === "plan_to_watch" ? '#FF9800' + '30' : 
                  colors.primary + '30',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                marginRight: 'auto',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: 
                    selectedList === "watching" ? '#2196F3' : 
                    selectedList === "completed" ? '#4CAF50' : 
                    selectedList === "plan_to_watch" ? '#FF9800' : 
                    colors.primary,
                  fontWeight: '600',
                }}
              >
                {selectedList === "watching" ? "Watching" : 
                 selectedList === "completed" ? "Completed" : 
                 selectedList === "plan_to_watch" ? "Plan to Watch" : 
                 "Favorite"}
              </Text>
            </View>

            {/* Update Progress Button (only for watching) */}
            {selectedList === "watching" && (
              <TouchableOpacity
                onPress={() => {
                  // Calculate next progress increment (0, 25, 50, 75, 100)
                  const currentProgress = item.progress || 0;
                  let nextProgress = Math.ceil(currentProgress / 25) * 25;
                  if (nextProgress <= currentProgress) nextProgress += 25;
                  if (nextProgress > 100) nextProgress = 100;
                  
                  handleUpdateProgress(item, nextProgress);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  marginRight: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Clock size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                  Update
                </Text>
              </TouchableOpacity>
            )}

            {/* More Options Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  item.title,
                  "Choose an action",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "View Details",
                      onPress: () => handleAnimePress(item),
                    },
                    ...(selectedList !== "watching"
                      ? [
                          {
                            text: "Move to Watching",
                            onPress: () => handleMoveToList(item, "watching"),
                          },
                        ]
                      : []),
                    ...(selectedList !== "completed"
                      ? [
                          {
                            text: "Move to Completed",
                            onPress: () => handleMoveToList(item, "completed"),
                          },
                        ]
                      : []),
                    ...(selectedList !== "plan_to_watch"
                      ? [
                          {
                            text: "Move to Plan to Watch",
                            onPress: () => handleMoveToList(item, "plan_to_watch"),
                          },
                        ]
                      : []),
                    {
                      text: "Remove from List",
                      style: "destructive",
                      onPress: () => handleRemoveFromList(item),
                    },
                  ]
                );
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: colors.cardHover,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MoreVertical size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render tab selector
  const renderTabSelector = () => {
    const tabs = [
      {
        id: "favorites",
        label: "Favorites",
        icon: <Heart size={16} color={selectedList === "favorites" ? colors.primary : colors.textSecondary} fill={selectedList === "favorites" ? colors.primary : "transparent"} />,
        count: favorites?.length || 0,
      },
      {
        id: "watching",
        label: "Watching",
        icon: <Eye size={16} color={selectedList === "watching" ? colors.primary : colors.textSecondary} />,
        count: lists.watching?.length || 0,
      },
      {
        id: "completed",
        label: "Completed",
        icon: <Award size={16} color={selectedList === "completed" ? colors.primary : colors.textSecondary} />,
        count: lists.completed?.length || 0,
      },
      {
        id: "plan_to_watch",
        label: "Plan to Watch",
        icon: <BookmarkIcon size={16} color={selectedList === "plan_to_watch" ? colors.primary : colors.textSecondary} />,
        count: lists.plan_to_watch?.length || 0,
      }
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabChange(tab.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor:
                selectedList === tab.id ? colors.primary + "20" : "transparent",
              borderWidth: 1,
              borderColor:
                selectedList === tab.id ? colors.primary : colors.border,
            }}
          >
            {tab.icon}
            <Text
              style={{
                marginLeft: 4,
                fontSize: 14,
                fontWeight: selectedList === tab.id ? "bold" : "normal",
                color: selectedList === tab.id ? colors.primary : colors.text,
              }}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={{
                  backgroundColor:
                    selectedList === tab.id ? colors.primary : colors.cardHover,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginLeft: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    color: selectedList === tab.id ? "#fff" : colors.textSecondary,
                  }}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const emptyStateMessages: Record<string, { title: string; message: string }> = {
      watching: {
        title: "No anime in your watching list",
        message: "Add anime to your watching list to keep track of what you're currently watching",
      },
      completed: {
        title: "No anime in your completed list",
        message: "Add anime to your completed list to keep track of what you've finished watching",
      },
      plan_to_watch: {
        title: "No anime in your plan to watch list",
        message: "Add anime to your plan to watch list to keep track of what you want to watch in the future",
      },
      favorites: {
        title: "No anime in your favorites",
        message: "Add anime to your favorites to keep track of your favorite anime",
      },
    };

    const { title, message } = emptyStateMessages[selectedList] || {
      title: "No anime in this list",
      message: "Add anime to this list to see them here",
    };

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        {selectedList === "favorites" ? (
          <Heart
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 16, opacity: 0.7 }}
          />
        ) : selectedList === "watching" ? (
          <Eye
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 16, opacity: 0.7 }}
          />
        ) : selectedList === "completed" ? (
          <Award
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 16, opacity: 0.7 }}
          />
        ) : (
          <BookOpen
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 16, opacity: 0.7 }}
          />
        )}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: colors.text,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Browse Anime
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
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
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.cardHover,
          }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: colors.text,
          }}
        >
          My Library
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* List Type Tabs */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {renderTabSelector()}
      </View>

      {/* Content */}
      {authLoading || listsLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: colors.textSecondary,
            }}
          >
            Loading your library...
          </Text>
        </View>
      ) : (
        <FlatList<UserAnimeListItem>
          data={getCurrentListData()}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
