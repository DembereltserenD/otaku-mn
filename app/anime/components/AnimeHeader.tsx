import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import Typography from "@/components/Typography";
import Badge from "@/components/Badge";
import { ChevronLeft, Star, Calendar, Clock, Bookmark, Users, ChevronDown } from "lucide-react-native";
import { AnimeDetails } from "../../../hooks/useAnimeDetails";
import { useTheme } from "@/context/ThemeProvider";
import { router } from "expo-router";

interface AnimeHeaderProps {
  animeDetails: AnimeDetails;
}

const AnimeHeader: React.FC<AnimeHeaderProps> = ({ animeDetails }) => {
  const { colors } = useTheme();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const { width } = Dimensions.get("window");
  
  // Format season and year for display
  const formatSeasonYear = () => {
    let display = "";
    if (animeDetails.season) {
      display += animeDetails.season.charAt(0).toUpperCase() + animeDetails.season.slice(1).toLowerCase();
    }
    if (animeDetails.release_year) {
      if (display) display += " ";
      display += animeDetails.release_year;
    }
    return display || "Unknown";
  };
  
  // Calculate poster aspect ratio (usually around 2:3 for anime posters)
  const posterWidth = width * 0.35;
  const posterHeight = posterWidth * 1.5;

  return (
    <View style={styles.container}>
      {/* Status bar with translucent background */}
      <StatusBar translucent backgroundColor="transparent" />

      {/* Cover Image */}
      <View style={styles.coverImageContainer}>
        <Image
          source={{
            uri: animeDetails.cover_image_url || animeDetails.image_url || 
                "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80"
          }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        
        {/* Gradient overlay for better text visibility */}
        <View style={styles.coverGradient} />
        
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content area with poster and details */}
      <View style={styles.contentContainer}>
        {/* Poster with shadow */}
        <View style={[styles.posterContainer, { width: posterWidth, height: posterHeight }]}>
          <Image
            source={{
              uri: animeDetails.image_url || 
                  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80"
            }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        </View>

        {/* Title and key info section */}
        <View style={styles.infoContainer}>
          {/* Title */}
          <Typography
            variant="h1"
            color={colors.text}
            weight="700"
            numberOfLines={2}
            style={styles.title}
          >
            {animeDetails.title}
          </Typography>

          {/* Alternative title */}
          {animeDetails.alternative_titles && animeDetails.alternative_titles.length > 0 && (
            <Typography
              variant="bodySmall"
              color={colors.textSecondary}
              style={styles.altTitle}
              numberOfLines={1}
            >
              {animeDetails.alternative_titles[0]}
            </Typography>
          )}

          {/* Rating pill */}
          {animeDetails.rating && (
            <View style={styles.ratingPill}>
              <Star size={12} color="#FFC107" fill="#FFC107" />
              <Typography variant="caption" color="white" weight="600" style={styles.ratingText}>
                {animeDetails.rating.toFixed(1)}
              </Typography>
            </View>
          )}

          {/* Key metadata badges */}
          <View style={styles.badgesContainer}>
            {animeDetails.status && (
              <View style={[styles.infoBadge, { backgroundColor: getStatusColor(animeDetails.status) }]}>
                <Typography variant="caption" color="white" weight="500">
                  {animeDetails.status}
                </Typography>
              </View>
            )}

            {(animeDetails.season || animeDetails.release_year) && (
              <View style={[styles.infoBadge, { backgroundColor: colors.card }]}>
                <Calendar size={12} color={colors.text} style={{ marginRight: 4 }} />
                <Typography variant="caption" color={colors.text}>
                  {formatSeasonYear()}
                </Typography>
              </View>
            )}

            {animeDetails.episodes && animeDetails.episodes.length > 0 && (
              <View style={[styles.infoBadge, { backgroundColor: colors.card }]}>
                <Clock size={12} color={colors.text} style={{ marginRight: 4 }} />
                <Typography variant="caption" color={colors.text}>
                  {animeDetails.episodes.length} eps
                </Typography>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Genres horizontal scroll */}
      {animeDetails.genres && animeDetails.genres.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genresScrollContent}
          style={styles.genresScroll}
        >
          {animeDetails.genres.map((genre, index) => (
            <Badge
              key={index}
              label={genre}
              variant="secondary"
              style={styles.genreBadge}
            />
          ))}
        </ScrollView>
      )}

      {/* Synopsis section */}
      <View style={styles.synopsisContainer}>
        <View style={styles.synopsisHeader}>
          <Typography
            variant="h3"
            color={colors.text}
            weight="600"
          >
            Synopsis
          </Typography>
        </View>
        
        <Pressable onPress={() => setSynopsisExpanded(!synopsisExpanded)}>
          <Typography
            variant="body"
            color={colors.textSecondary}
            style={styles.synopsis}
            numberOfLines={synopsisExpanded ? undefined : 3}
          >
            {animeDetails.description || "No description available."}
          </Typography>
          
          <View style={styles.synopsisExpander}>
            <Typography 
              variant="caption" 
              color={colors.primary} 
              style={{ marginRight: 4 }}
            >
              {synopsisExpanded ? "Show Less" : "Read More"}
            </Typography>
            <ChevronDown size={16} color={colors.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

// Helper function to get color based on anime status
const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('airing') || statusLower.includes('ongoing')) return '#4CAF50';
  if (statusLower.includes('finished') || statusLower.includes('completed')) return '#2196F3';
  if (statusLower.includes('upcoming') || statusLower.includes('not yet aired')) return '#FF9800';
  return '#9E9E9E'; // Default gray for unknown status
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  coverImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    // Note: We can't use CSS gradients directly in React Native styles
    // For web, we would need to use a different approach
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  contentContainer: {
    flexDirection: "row",
    padding: 16,
    marginTop: -60,
  },
  posterContainer: {
    borderRadius: 8,
    overflow: "hidden",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 5,
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  altTitle: {
    marginTop: 2,
    marginBottom: 8,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(33, 33, 33, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  genresScroll: {
    marginTop: 8,
  },
  genresScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  genreBadge: {
    marginRight: 8,
    marginBottom: 0,
  },
  synopsisContainer: {
    padding: 16,
    paddingTop: 8,
  },
  synopsisHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  synopsis: {
    lineHeight: 22,
  },
  synopsisExpander: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
});

export default AnimeHeader;
