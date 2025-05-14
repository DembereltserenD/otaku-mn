import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { ChevronRight } from "lucide-react-native";
import * as Haptics from 'expo-haptics';
import { useTheme } from "@/context/ThemeProvider";

interface SectionHeaderProps {
    title: string;
    onSeeAllPress?: () => void;
    delay?: number; // Delay for entrance animation
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    onSeeAllPress,
    delay = 0
}) => {
    const { colors } = useTheme();
    const translateY = useRef(new Animated.Value(20)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [translateY, opacity, delay]);

    const handleSeeAllPress = () => {
        // Scale animation when pressing See All
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Haptic feedback
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.log('Haptics not available');
        }

        if (onSeeAllPress) {
            onSeeAllPress();
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }]
                }
            ]}
        >
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {onSeeAllPress && (
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={handleSeeAllPress}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                        <ChevronRight size={16} color={colors.primary} />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    seeAllText: {
        fontSize: 14,
        marginRight: 4,
    },
});

export default SectionHeader; 