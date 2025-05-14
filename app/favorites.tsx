import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Star, Calendar } from "lucide-react-native";
import useFavorites from "../hooks/useFavorites";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { favorites, loading, error, fetchFavorites, removeFromFavorites } = useFavorites();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleBackPress = () => {
    router.back();
  };

  const handleAnimePress = (animeId: string) => {
    router.push(`/anime/${animeId}`);
  };

  const handleRemoveFavorite = async (animeId: string) => {
    await removeFromFavorites(animeId);
  };

  const renderAnimeItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-gray-800 rounded-lg mb-4 overflow-hidden"
      onPress={() => handleAnimePress(item.id)}
    >
      <View className="flex-row">
        <Image
          source={{ uri: item.image_url }}
          className="w-24 h-36"
          resizeMode="cover"
        />
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-white font-semibold text-base" numberOfLines={2}>
              {item.title}
            </Text>

            <View className="flex-row items-center mt-1">
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Text className="text-white text-xs ml-1">{item.rating}</Text>
            </View>

            <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
              {item.release_date && (
                <>
                  <Calendar size={12} className="mr-1" color="#9CA3AF" />
                  {new Date(item.release_date).toLocaleDateString()}
                </>
              )}
            </Text>

            {item.genres && item.genres.length > 0 && (
              <View className="flex-row flex-wrap mt-1">
                {item.genres.slice(0, 2).map((genre: string) => (
                  <View
                    key={genre}
                    className="bg-gray-700 rounded-full px-2 py-0.5 mr-1 mt-1"
                  >
                    <Text className="text-gray-300 text-xs">{genre}</Text>
                  </View>
                ))}
                {item.genres.length > 2 && (
                  <View className="bg-gray-700 rounded-full px-2 py-0.5 mt-1">
                    <Text className="text-gray-300 text-xs">
                      +{item.genres.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-red-600 rounded-lg px-3 py-1 mt-2 self-start"
            onPress={() => handleRemoveFavorite(item.id)}
          >
            <Text className="text-white text-xs">Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View className="flex-1">
        {/* Header */}
        <View className="w-full h-[60px] bg-gray-900 flex-row items-center px-4 border-b border-gray-800">
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg ml-4">My Favorites</Text>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-gray-400 mt-4">Loading favorites...</Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderAnimeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10">
                <Text className="text-gray-400 text-lg">
                  {error
                    ? "Error loading favorites"
                    : user
                      ? "You haven't added any favorites yet"
                      : "Please login to see your favorites"}
                </Text>
                {!user && (
                  <TouchableOpacity
                    className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
                    onPress={() => setShowAuthModal(true)}
                  >
                    <Text className="text-white">Login</Text>
                  </TouchableOpacity>
                )}
                {user && !error && (
                  <TouchableOpacity
                    className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
                    onPress={() => router.push("/")}
                  >
                    <Text className="text-white">Explore Anime</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
      {showAuthModal && <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />}
    </SafeAreaView>
  );
}
