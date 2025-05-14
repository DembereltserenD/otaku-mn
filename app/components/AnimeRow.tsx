import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from "react-native";
import { Anime } from "@/lib/store";
import { Star } from "lucide-react-native";
import * as Haptics from 'expo-haptics';
import AnimeCard from "@/components/AnimeCard";

interface AnimeRowProps {
    data: Anime[];
    loading?: boolean;
    onAnimePress: (anime: Anime) => void;
    onRefresh?: () => void;
    refreshing?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;

const AnimeRow: React.FC<AnimeRowProps> = ({
    data,
    loading = false,
    onAnimePress,
    onRefresh,
    refreshing = false,
}) => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Fade in the content when data changes
    useEffect(() => {
        if (data.length > 0 && !loading) {
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        } else {
            opacityAnim.setValue(0);
        }
    }, [data, loading, opacityAnim]);

    const handlePress = (anime: Anime) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.log('Haptics not available');
        }
        onAnimePress(anime);
    };

    if (loading) {
        // Loading skeleton
        return (
            <FlatList
                horizontal
                data={[1, 2, 3, 4, 5]}
                keyExtractor={(item) => `skeleton-${item}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item, index }) => {
                    // Staggered animation for skeletons
                    const translateX = new Animated.Value(20);
                    const opacity = new Animated.Value(0.5);

                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 300,
                        delay: index * 100,
                        useNativeDriver: true,
                    }).start();

                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(opacity, {
                                toValue: 1,
                                duration: 800,
                                useNativeDriver: true,
                            }),
                            Animated.timing(opacity, {
                                toValue: 0.5,
                                duration: 800,
                                useNativeDriver: true,
                            }),
                        ])
                    ).start();

                    return (
                        <Animated.View
                            style={[
                                styles.card,
                                styles.skeletonCard,
                                {
                                    opacity,
                                    transform: [{ translateX }]
                                }
                            ]}
                        >
                            <View style={styles.skeletonImage} />
                            <View style={styles.skeletonTitle} />
                            <View style={styles.skeletonRating} />
                        </Animated.View>
                    );
                }}
            />
        );
    }

    return (
        <Animated.View style={{ opacity: opacityAnim }}>
            <Animated.FlatList
                horizontal
                data={data}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                renderItem={({ item, index }) => {
                    // Card animation based on scroll position
                    const inputRange = [
                        (index - 1) * CARD_WIDTH,
                        index * CARD_WIDTH,
                        (index + 1) * CARD_WIDTH
                    ];

                    const scale = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.95, 1, 0.95],
                        extrapolate: 'clamp'
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.7, 1, 0.7],
                        extrapolate: 'clamp'
                    });

                    return (
                        <Animated.View
                            style={[
                                styles.animatedCard,
                                {
                                    transform: [{ scale }],
                                    opacity
                                }
                            ]}
                        >
                            <AnimeCard
                                anime={item}
                                onPress={() => handlePress(item)}
                                showRating={true}
                                style={{ width: CARD_WIDTH, marginHorizontal: 4 }}
                            />
                        </Animated.View>
                    );
                }}
            />
        </Animated.View>
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
    animatedCard: {
        width: CARD_WIDTH,
        marginHorizontal: 4,
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