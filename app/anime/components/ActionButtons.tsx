import React from "react";
import { View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { Heart, BookmarkPlus, Download } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { Episode } from "../../../hooks/useAnimeDetails";
import WatchButton from "@/components/WatchButton";
import Typography from "@/components/Typography";

interface ActionButtonsProps {
  animeId: string;
  episodes: Episode[] | undefined;
  isFavorite: boolean;
  isInWatchlist: boolean;
  toggleFavorite: () => Promise<void>;
  toggleWatchlist: () => Promise<void>;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  animeId,
  episodes,
  isFavorite,
  isInWatchlist,
  toggleFavorite,
  toggleWatchlist,
}) => {
  const { colors } = useTheme();
  
  // Find first unwatched episode or the first episode
  const getEpisodeToWatch = () => {
    if (!episodes || episodes.length === 0) return undefined;
    return episodes.find(ep => !ep.watched) || episodes[0];
  };
  
  const episodeToWatch = getEpisodeToWatch();
  
  return (
    <View style={styles.container}>
      {/* Main action button */}
      <View style={styles.mainActionContainer}>
        <WatchButton
          animeId={animeId}
          episodeId={episodeToWatch?.id}
          label="Watch Now"
          size="large"
          style={styles.watchButton}
        />
      </View>
      
      {/* Secondary actions with labels */}
      <View style={styles.secondaryActionsContainer}>
        <Pressable 
          style={styles.actionItem} 
          onPress={toggleFavorite} 
          android_ripple={{ color: colors.border, radius: 20 }}
        >
          <View style={[styles.iconContainer, isFavorite && { backgroundColor: colors.error + '20' }]}>
            <Heart
              size={22}
              color={isFavorite ? colors.error : colors.text}
              fill={isFavorite ? colors.error : "transparent"}
            />
          </View>
          <Typography 
            variant="caption" 
            color={colors.textSecondary}
            style={styles.actionLabel}
          >
            {isFavorite ? 'Favorited' : 'Favorite'}
          </Typography>
        </Pressable>

        <Pressable 
          style={styles.actionItem} 
          onPress={toggleWatchlist}
          android_ripple={{ color: colors.border, radius: 20 }}
        >
          <View style={[styles.iconContainer, isInWatchlist && { backgroundColor: colors.primary + '20' }]}>
            <BookmarkPlus
              size={22}
              color={isInWatchlist ? colors.primary : colors.text}
              fill={isInWatchlist ? colors.primary : "transparent"}
            />
          </View>
          <Typography 
            variant="caption" 
            color={colors.textSecondary}
            style={styles.actionLabel}
          >
            {isInWatchlist ? 'In Watchlist' : 'Add to List'}
          </Typography>
        </Pressable>

        <Pressable 
          style={styles.actionItem}
          android_ripple={{ color: colors.border, radius: 20 }}
        >
          <View style={styles.iconContainer}>
            <Download size={22} color={colors.text} />
          </View>
          <Typography 
            variant="caption" 
            color={colors.textSecondary}
            style={styles.actionLabel}
          >
            Download
          </Typography>
        </Pressable>
      </View>

      {/* Episode info */}
      {episodes && episodes.length > 0 && (
        <View style={styles.episodeInfoContainer}>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''} available
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
  },
  mainActionContainer: {
    marginBottom: 16,
  },
  watchButton: {
    width: '100%',
  },
  secondaryActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  actionItem: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginBottom: 4,
  },
  actionLabel: {
    marginTop: 4,
    textAlign: "center",
  },
  episodeInfoContainer: {
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  }
});

export default ActionButtons;
