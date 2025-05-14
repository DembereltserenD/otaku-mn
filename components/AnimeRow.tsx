import React from "react";
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from "react-native";
import { Anime } from "@/lib/types";
import { Star } from "lucide-react-native";

interface AnimeRowProps {
    data: Anime[];
    loading?: boolean;
    onAnimePress: (anime: Anime) => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;

const AnimeRow: React.FC<AnimeRowProps> = ({
    data,
    loading = false,
    onAnimePress,
}) => {
    if (loading) {
        // Loading skeleton
        return (
            <FlatList
                horizontal
                data={[1, 2, 3, 4, 5]}
                keyExtractor={(item) => `skeleton-${item}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                renderItem={() => (
                    <View style={[styles.card, styles.skeletonCard]}>
                        <View style={styles.skeletonImage} />
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonRating} />
                    </View>
                )}
            />
        );
    }

    return (
        <FlatList
            horizontal
            data={data}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => onAnimePress(item)}
                    activeOpacity={0.7}
                >
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>
                    {item.rating && (
                        <View style={styles.ratingContainer}>
                            <Star size={12} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    card: {
        width: CARD_WIDTH,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: "#2A2A2A",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: CARD_WIDTH * 1.5,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    titleContainer: {
        padding: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    rating: {
        marginLeft: 4,
        fontSize: 12,
        color: "#FFFFFF",
    },
    // Skeleton styles
    skeletonCard: {
        backgroundColor: "#2A2A2A",
    },
    skeletonImage: {
        width: "100%",
        height: CARD_WIDTH * 1.5,
        backgroundColor: "#3A3A3A",
    },
    skeletonTitle: {
        width: "80%",
        height: 14,
        backgroundColor: "#3A3A3A",
        borderRadius: 4,
        margin: 8,
    },
    skeletonRating: {
        width: 40,
        height: 12,
        backgroundColor: "#3A3A3A",
        borderRadius: 4,
        margin: 8,
    },
});

export default AnimeRow; 