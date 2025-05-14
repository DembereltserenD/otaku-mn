import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface SectionHeaderProps {
    title: string;
    onSeeAllPress?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onSeeAllPress }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {onSeeAllPress && (
                <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAllPress}>
                    <Text style={styles.seeAllText}>See All</Text>
                    <ChevronRight size={16} color="#FF5500" />
                </TouchableOpacity>
            )}
        </View>
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
        color: "#FFFFFF",
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    seeAllText: {
        fontSize: 14,
        color: "#FF5500",
        marginRight: 4,
    },
});

export default SectionHeader; 