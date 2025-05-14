import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import Typography from "@/components/Typography";
import VideoThumbnail from "@/components/VideoThumbnail";
import { useTheme } from "@/context/ThemeProvider";
import { router } from "expo-router";
import { Episode } from "../../../hooks/useAnimeDetails";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface EpisodesListProps {
  episodes: Episode[];
  animeId: string;
}

const EpisodesList: React.FC<EpisodesListProps> = ({ episodes, animeId }) => {
  const { colors } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 3;

  // Handle episode selection
  const handleEpisodeSelect = (episode: Episode) => {
    router.push({
      pathname: "/watch",
      params: { animeId: animeId, episodeId: episode.id },
    });
  };

  if (!episodes || episodes.length === 0) {
    return (
      <View style={styles.noEpisodesContainer}>
        <Typography variant="body" color={colors.textSecondary}>
          No episodes available yet.
        </Typography>
      </View>
    );
  }

  // Decide which episodes to display based on showAll state
  const displayedEpisodes = showAll 
    ? episodes 
    : episodes.slice(0, initialDisplayCount);
  
  const renderEpisodeItem = ({ item }: { item: Episode }) => (
    <View style={styles.episodeItem}>
      <VideoThumbnail
        title={`Episode ${item.episode_number}`}
        episodeInfo={item.title}
        duration={item.duration}
        thumbnailUri={item.thumbnail_url}
        onPress={() => handleEpisodeSelect(item)}
      />
      
      {/* Progress bar for watched episodes */}
      {item.watched && (
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress || 0}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Typography variant="h3" color={colors.text} weight="600">
          Episodes
        </Typography>
        <Typography variant="bodySmall" color={colors.textSecondary}>
          {episodes.length} total
        </Typography>
      </View>

      <FlatList
        data={displayedEpisodes}
        renderItem={renderEpisodeItem}
        keyExtractor={(item) => item.id}
        style={styles.episodesList}
        scrollEnabled={false}
      />
      
      {/* Show More/Less button */}
      {episodes.length > initialDisplayCount && (
        <Pressable 
          style={[styles.showMoreButton, { borderColor: colors.border }]}
          onPress={() => setShowAll(!showAll)}
          android_ripple={{ color: colors.border }}
        >
          <Typography 
            variant="bodySmall" 
            color={colors.primary}
            style={{ marginRight: 8 }}
          >
            {showAll ? "Show Less" : `Show All Episodes (${episodes.length})`}
          </Typography>
          {showAll ? (
            <ChevronUp size={16} color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.primary} />
          )}
        </Pressable>
      )}
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  episodesList: {
    paddingHorizontal: 16,
  },
  noEpisodesContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  episodeItem: {
    marginBottom: 16,
    width: "100%",
  },
  progressBar: {
    height: 3,
    width: "100%",
    borderRadius: 1.5,
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed"
  }
});

export default EpisodesList;
