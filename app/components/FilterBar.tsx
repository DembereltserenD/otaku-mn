import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useTheme } from "@/context/ThemeProvider";
import { Filter as FilterIcon } from "lucide-react-native";

interface FilterBarProps {
  filters: string[];
  selectedFilters: string[];
  onFilterPress: (filter: string) => void;
  isLoading?: boolean;
  title?: string;
  onFilterButtonPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * FilterBar component displays a horizontal scrollable list of filter tags
 * with selection state and loading indicators
 *
 * @param props - Component props
 * @returns FilterBar component
 */
const FilterBar = React.memo(function FilterBar({
  filters = [],
  selectedFilters = [],
  onFilterPress,
  isLoading = false,
  title = "Filters",
  onFilterButtonPress,
}: FilterBarProps) {
  const { colors, isDarkMode } = useTheme();

  // Memoize the filter data to prevent re-renders
  const memoizedFilters = useMemo(() => filters, [filters]);
  const memoizedSelectedFilters = useMemo(() => selectedFilters, [selectedFilters]);

  // Handle filter press with haptic feedback
  const handleFilterPress = (filter: string) => {
    // Add haptic feedback
    try {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue silently
    }

    onFilterPress(filter);
  };

  // Memoize the renderFilterItem function
  const renderFilterItem = useMemo(() => {
    return ({ item: filter }: { item: string }) => {
      const isSelected = memoizedSelectedFilters.includes(filter);
      return (
        <TouchableOpacity
          onPress={() => handleFilterPress(filter)}
          style={[
            styles.filterButton,
            {
              backgroundColor: isSelected
                ? colors.primary
                : isDarkMode
                  ? colors.cardHover
                  : colors.card,
              borderColor: isSelected ? colors.primary : colors.border,
              shadowOpacity: isDarkMode ? 0.2 : 0.3,
            },
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Filter by ${filter}`}
          accessibilityState={{ selected: isSelected }}
          accessibilityHint={
            isSelected ? `Remove ${filter} filter` : `Add ${filter} filter`
          }
        >
          <Text
            style={[
              styles.filterText,
              {
                color: isSelected
                  ? '#FFFFFF'
                  : colors.textSecondary,
                fontWeight: isSelected ? "600" : "500",
              },
            ]}
            numberOfLines={1}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      );
    };
  }, [memoizedSelectedFilters, colors, isDarkMode]);

  // Optimization: Avoid re-rendering the empty text message
  const EmptyComponent = useMemo(() => {
    return (
      <View style={styles.scrollView}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No filters available
        </Text>
      </View>
    );
  }, [colors.textSecondary]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {onFilterButtonPress && (
          <TouchableOpacity
            onPress={onFilterButtonPress}
            style={[
              styles.filterAllButton,
              {
                backgroundColor: isDarkMode ? colors.cardHover : colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Advanced filters"
          >
            <FilterIcon size={16} color={colors.text} />
            <Text style={[styles.filterAllText, { color: colors.text }]}>
              All Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {memoizedFilters.length === 0 ? (
        EmptyComponent
      ) : (
        <FlatList
          horizontal
          data={memoizedFilters}
          renderItem={renderFilterItem}
          keyExtractor={(item, index) => `filter-${index}-${item}`}
          contentContainerStyle={styles.scrollContent}
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Filter options"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={2}
          removeClippedSubviews={true}
          decelerationRate="fast"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    width: "100%",
    paddingTop: 12,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filterAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterAllText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  scrollView: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
});

export default FilterBar;
