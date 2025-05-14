import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList } from "react-native";
import Typography from "@/components/Typography";
import Badge from "@/components/Badge";
import { useTheme } from "@/context/ThemeProvider";
import { router } from "expo-router";
import { RelatedAnime as RelatedAnimeType } from "../../../hooks/useAnimeDetails";
import { ArrowUpRight } from "lucide-react-native";

interface RelatedAnimeProps {
  relatedAnime: RelatedAnimeType[];
}

// Function to format relation type for display
const formatRelationType = (type: string): string => {
  // Convert snake_case to Title Case with spaces
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const RelatedAnime: React.FC<RelatedAnimeProps> = ({ relatedAnime }) => {
  const { colors } = useTheme();
  const { width } = Dimensions.get("window");
  const itemWidth = (width - 48) / 2;

  // Handle related anime selection
  const handleRelatedAnimeSelect = (relatedAnimeId: string) => {
    router.push({
      pathname: `/anime/${relatedAnimeId}`,
    });
  };

  if (!relatedAnime || relatedAnime.length === 0) {
    return (
      <View style={styles.noRelatedContainer}>
        <Typography variant="body" color={colors.textSecondary}>
          No related anime available.
        </Typography>
      </View>
    );
  }

  // Get color for relation badge based on relation type
  const getRelationColor = (relationType: string) => {
    switch(relationType.toLowerCase()) {
      case 'sequel':
        return '#4CAF50'; // Green
      case 'prequel':
        return '#2196F3'; // Blue
      case 'side_story':
        return '#FF9800'; // Orange
      case 'spin_off':
        return '#9C27B0'; // Purple
      case 'adaptation':
        return '#E91E63'; // Pink
      default:
        return colors.primary;
    }
  };

  const renderItem = ({ item }: { item: RelatedAnimeType }) => (
    <TouchableOpacity
      style={[styles.relatedAnimeItem, { width: itemWidth }]}
      onPress={() => handleRelatedAnimeSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.image_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
          }}
          style={styles.relatedAnimeImage}
          resizeMode="cover"
        />
        
        <View style={[styles.relationTypeBadge, { backgroundColor: getRelationColor(item.relation_type) }]}>
          <Typography variant="caption" color="white" weight="600" numberOfLines={1}>
            {formatRelationType(item.relation_type)}
          </Typography>
        </View>
        
        <View style={styles.iconOverlay}>
          <ArrowUpRight size={20} color="white" />
        </View>
      </View>
      
      <View style={styles.relatedAnimeInfo}>
        <Typography
          variant="bodySmall"
          color={colors.text}
          weight="500"
          numberOfLines={2}
        >
          {item.title}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Typography variant="h3" color={colors.text} weight="600">
          Related Titles
        </Typography>
      </View>

      <FlatList
        data={relatedAnime}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        style={styles.list}
        scrollEnabled={false}
      />
    </View>
  );
};

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
  list: {
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  noRelatedContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  relatedAnimeItem: {
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  relatedAnimeImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
  },
  relationTypeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  iconOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  relatedAnimeInfo: {
    marginTop: 8,
  }
});

export default RelatedAnime;
