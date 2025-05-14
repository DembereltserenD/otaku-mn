import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, Award, BookmarkIcon, Heart, LogOut } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeProvider';

type ProfileListsProps = {
  watchingCount: number;
  completedCount: number;
  planToWatchCount: number;
  favoritesCount: number;
  handleListNavigation: (listType: string) => void;
  handleLogout: () => void;
};

const ProfileLists = ({
  watchingCount,
  completedCount,
  planToWatchCount,
  favoritesCount,
  handleListNavigation,
  handleLogout
}: ProfileListsProps) => {
  const { colors } = useTheme();

  return (
    <View>
      {/* Lists Section */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          My Lists
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={() => handleListNavigation("Currently Watching")}
        >
          <Eye size={20} color={colors.primary} />
          <Text style={{ color: colors.text, marginLeft: 12, flex: 1 }}>
            Currently Watching
          </Text>
          <Text style={{ color: colors.textSecondary }}>{watchingCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={() => handleListNavigation("Completed")}
        >
          <Award size={20} color={colors.success} />
          <Text style={{ color: colors.text, marginLeft: 12, flex: 1 }}>
            Completed
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {completedCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={() => handleListNavigation("Plan to Watch")}
        >
          <BookmarkIcon size={20} color={colors.warning} />
          <Text style={{ color: colors.text, marginLeft: 12, flex: 1 }}>
            Plan to Watch
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {planToWatchCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={() => handleListNavigation("Favorites")}
        >
          <Heart size={20} color={colors.error} fill={colors.error} />
          <Text style={{ color: colors.text, marginLeft: 12, flex: 1 }}>
            Favorites
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {favoritesCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={{ padding: 16, marginTop: 16, marginBottom: 40 }}>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            borderRadius: 8,
          }}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text
            style={{
              color: colors.error,
              marginLeft: 8,
              fontWeight: "500",
            }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileLists;
