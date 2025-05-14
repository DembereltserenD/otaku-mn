import React from "react";
import { Dimensions, View as RNView, ScrollView as RNScrollView } from "react-native";
import { View, ScrollView } from "@/lib/nativewind-setup";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeProvider";

const { width } = Dimensions.get("window");

/**
 * Props for the SkeletonView component
 */
interface SkeletonViewProps {
  children?: React.ReactNode;
}

/**
 * Base skeleton view component
 */
const SkeletonView = React.memo(({ children }: SkeletonViewProps) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>
  );
});

SkeletonView.displayName = "SkeletonView";

/**
 * Banner skeleton component.
 * Displays a loading placeholder for the featured anime banner.
 */
const BannerSkeleton = React.memo(() => {
  const { colors } = useTheme();
  return (
    <View className="relative w-full h-56">
      <View className="w-full h-full rounded-lg animate-pulse" style={{ backgroundColor: colors.cardHover }} />
      <View className="absolute bottom-4 left-4 right-4">
        <View className="h-6 w-2/3 mb-2 rounded-md" style={{ backgroundColor: colors.skeleton }} />
        <View className="h-4 w-1/3 rounded-md" style={{ backgroundColor: colors.skeleton }} />
      </View>
    </View>
  );
});

BannerSkeleton.displayName = "BannerSkeleton";

/**
 * Section header skeleton component.
 * Displays a loading placeholder for section headings.
 */
const SectionHeaderSkeleton = React.memo(() => {
  const { colors } = useTheme();
  return (
    <View className="flex-row justify-between items-center mx-4 mb-2">
      <View className="h-6 w-40 rounded-md" style={{ backgroundColor: colors.skeleton }} />
      <View className="h-4 w-14 rounded-md" style={{ backgroundColor: colors.skeleton }} />
    </View>
  );
});

SectionHeaderSkeleton.displayName = "SectionHeaderSkeleton";

/**
 * Grid item skeleton component.
 * Displays a loading placeholder for an anime card.
 */
const GridItem = React.memo(() => {
  const { colors } = useTheme();
  const cardWidth = (width - 32) / 2 - 8;

  return (
    <View style={{ width: cardWidth }} className="p-2">
      <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
        <View
          style={{ height: cardWidth * 1.5, backgroundColor: colors.skeleton }}
          className="animate-pulse"
        />
        <View className="p-2">
          <View className="h-4 w-3/4 mb-1 rounded-md" style={{ backgroundColor: colors.skeleton }} />
          <View className="h-4 w-1/2 rounded-md" style={{ backgroundColor: colors.skeleton }} />
        </View>
      </View>
    </View>
  );
});

GridItem.displayName = "GridItem";

/**
 * Filter item skeleton component.
 * Displays a loading placeholder for a filter option.
 */
const FilterItem = React.memo(() => {
  const { colors } = useTheme();
  return (
    <View className="h-8 w-20 mx-1 rounded-full animate-pulse" style={{ backgroundColor: colors.skeleton }} />
  );
});

FilterItem.displayName = "FilterItem";

/**
 * Grid skeleton component.
 * Displays a grid of anime card loading placeholders.
 */
const SkeletonGrid = React.memo(() => (
  <View className="flex-row flex-wrap px-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <GridItem key={`grid-${index}`} />
    ))}
  </View>
));

SkeletonGrid.displayName = "SkeletonGrid";

/**
 * Filter bar skeleton component.
 * Displays loading placeholders for filter options.
 */
const FilterSkeleton = React.memo(() => {
  const { colors } = useTheme();
  return (
    <View className="py-2 px-4 flex-row items-center">
      <View className="flex-row items-center">
        <View className="h-4 w-4 mr-1 rounded" style={{ backgroundColor: colors.skeleton }} />
        <View className="h-4 w-16 rounded" style={{ backgroundColor: colors.skeleton }} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="ml-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <FilterItem key={`filter-${index}`} />
        ))}
      </ScrollView>
    </View>
  );
});

FilterSkeleton.displayName = "FilterSkeleton";

/**
 * HomeScreenSkeleton component.
 * Displays loading placeholders for the home screen content.
 */
const HomeScreenSkeleton = React.memo(() => (
  <SkeletonView>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-16"
    >
      <View className="p-4">
        <BannerSkeleton />
      </View>

      <View className="mb-6">
        <SectionHeaderSkeleton />
        <FilterSkeleton />
      </View>

      <View className="mb-6">
        <SectionHeaderSkeleton />
        <SkeletonGrid />
      </View>

      <View className="mb-6">
        <SectionHeaderSkeleton />
        <SkeletonGrid />
      </View>
    </ScrollView>
  </SkeletonView>
));

export default HomeScreenSkeleton;
