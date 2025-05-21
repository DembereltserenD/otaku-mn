import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Film,
  Heart,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';

// Screen width for responsive charts
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Chart data types
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

// Analytics data types
interface AnalyticsData {
  userStats: {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    activeUsers: number;
    userGrowth: number;
  };
  contentStats: {
    totalAnime: number;
    totalEpisodes: number;
    totalFavorites: number;
    totalWatched: number;
    mostPopularAnime: { id: string; title: string; count: number }[];
  };
  engagementStats: {
    averageWatchTime: number;
    completionRate: number;
    favoriteRate: number;
    returningUsers: number;
  };
  userActivityChart: ChartData;
  contentPopularityChart: ChartData;
}

/**
 * Admin Analytics Dashboard
 * Provides administrators with insights into user engagement, content performance, and other metrics
 */
export default function AdminAnalytics() {
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userStats: {
      totalUsers: 0,
      newUsersToday: 0,
      newUsersWeek: 0,
      activeUsers: 0,
      userGrowth: 0,
    },
    contentStats: {
      totalAnime: 0,
      totalEpisodes: 0,
      totalFavorites: 0,
      totalWatched: 0,
      mostPopularAnime: [],
    },
    engagementStats: {
      averageWatchTime: 0,
      completionRate: 0,
      favoriteRate: 0,
      returningUsers: 0,
    },
    userActivityChart: {
      labels: [],
      datasets: [{ data: [] }],
    },
    contentPopularityChart: {
      labels: [],
      datasets: [{ data: [] }],
    },
  });

  // Fetch analytics data
  const fetchAnalyticsData = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Get total users count
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total anime count
      const { count: animeCount, error: animeError } = await supabase
        .from('anime')
        .select('*', { count: 'exact', head: true });

      // Get total episodes count
      const { count: episodeCount, error: episodeError } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true });

      // Get total favorites count
      const { count: favoritesCount, error: favoritesError } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true });

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday, error: newUsersTodayError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: newUsersWeek, error: newUsersWeekError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Get most popular anime
      const { data: popularAnime, error: popularAnimeError } = await supabase
        .from('trending_anime')
        .select('id, title, trending_score')
        .order('trending_score', { ascending: false })
        .limit(5);

      // Generate user activity chart data (mock data for now)
      const userActivityLabels = generateTimeLabels(timeRange);
      const userActivityData = generateMockData(userActivityLabels.length, 50, 200);

      // Generate content popularity chart data (mock data for now)
      const contentPopularityLabels = popularAnime?.map(anime => anime.title.substring(0, 10) + '...') || [];
      const contentPopularityData = popularAnime?.map(anime => anime.trending_score) || [];

      // Set analytics data
      setAnalyticsData({
        userStats: {
          totalUsers: userCount || 0,
          newUsersToday: newUsersToday || 0,
          newUsersWeek: newUsersWeek || 0,
          activeUsers: Math.floor(Math.random() * (userCount || 100)), // Mock data
          userGrowth: calculateGrowthRate(newUsersWeek || 0, userCount || 0),
        },
        contentStats: {
          totalAnime: animeCount || 0,
          totalEpisodes: episodeCount || 0,
          totalFavorites: favoritesCount || 0,
          totalWatched: Math.floor(Math.random() * 10000), // Mock data
          mostPopularAnime: popularAnime?.map(anime => ({
            id: anime.id,
            title: anime.title,
            count: anime.trending_score,
          })) || [],
        },
        engagementStats: {
          averageWatchTime: Math.floor(Math.random() * 60) + 10, // Mock data (minutes)
          completionRate: Math.random() * 0.8 + 0.1, // Mock data (10-90%)
          favoriteRate: Math.random() * 0.5 + 0.1, // Mock data (10-60%)
          returningUsers: Math.floor((userCount || 100) * (Math.random() * 0.8 + 0.1)), // Mock data
        },
        userActivityChart: {
          labels: userActivityLabels,
          datasets: [
            {
              data: userActivityData,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Primary color
              strokeWidth: 2,
            },
          ],
        },
        contentPopularityChart: {
          labels: contentPopularityLabels,
          datasets: [
            {
              data: contentPopularityData,
              color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`, // Pink color
              strokeWidth: 2,
            },
          ],
        },
      });

      if (userError || animeError || episodeError || favoritesError || newUsersTodayError || newUsersWeekError || popularAnimeError) {
        console.error('Error fetching analytics data:', {
          userError,
          animeError,
          episodeError,
          favoritesError,
          newUsersTodayError,
          newUsersWeekError,
          popularAnimeError,
        });
      }
    } catch (error) {
      console.error('Error in fetchAnalyticsData:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Generate labels for time-based charts
  const generateTimeLabels = (range: 'week' | 'month' | 'year'): string[] => {
    const labels: string[] = [];
    const date = new Date();
    
    if (range === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(date.getDate() - i);
        labels.push(days[d.getDay()]);
      }
    } else if (range === 'month') {
      for (let i = 0; i < 30; i += 3) {
        const d = new Date();
        d.setDate(date.getDate() - 29 + i);
        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      }
    } else if (range === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        labels.push(months[i]);
      }
    }
    
    return labels;
  };

  // Generate mock data for charts
  const generateMockData = (length: number, min: number, max: number): number[] => {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  };

  // Calculate growth rate
  const calculateGrowthRate = (newUsers: number, totalUsers: number): number => {
    if (totalUsers === 0) return 0;
    return (newUsers / totalUsers) * 100;
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  // Handle time range change
  const handleTimeRangeChange = (range: 'week' | 'month' | 'year') => {
    setTimeRange(range);
    // Refetch data with new time range
    fetchAnalyticsData(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Stat card component
  const StatCard = ({ 
    title, 
    value, 
    icon, 
    change, 
    isPositive = true,
    suffix = '',
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    change?: number; 
    isPositive?: boolean;
    suffix?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          {icon}
        </View>
        {change !== undefined && (
          <View style={[
            styles.changeIndicator, 
            { backgroundColor: isPositive ? `${colors.success}20` : `${colors.error}20` }
          ]}>
            {isPositive ? (
              <ArrowUp size={12} color={colors.success} />
            ) : (
              <ArrowDown size={12} color={colors.error} />
            )}
            <Typography 
              variant="caption" 
              color={isPositive ? colors.success : colors.error}
              style={styles.changeText}
            >
              {Math.abs(change).toFixed(1)}%
            </Typography>
          </View>
        )}
      </View>
      <Typography variant="h2" style={styles.statValue}>
        {typeof value === 'number' && value > 1000 
          ? `${(value / 1000).toFixed(1)}k` 
          : value}
        {suffix}
      </Typography>
      <Typography variant="bodySmall" color={colors.textSecondary}>
        {title}
      </Typography>
    </View>
  );

  // Chart component (simplified for this implementation)
  const ChartPlaceholder = ({ 
    title, 
    height = 200,
    data,
  }: { 
    title: string; 
    height?: number;
    data: ChartData;
  }) => (
    <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Typography variant="h3" style={styles.chartTitle}>
        {title}
      </Typography>
      
      <View style={[styles.chartPlaceholder, { height }]}>
        {data.labels.length > 0 ? (
          <View style={styles.mockChart}>
            {data.datasets[0].data.map((value, index) => (
              <View 
                key={index}
                style={[
                  styles.mockBar,
                  { 
                    height: `${(value / Math.max(...data.datasets[0].data)) * 80}%`,
                    backgroundColor: data.datasets[0].color ? data.datasets[0].color(0.7) : colors.primary,
                    width: `${90 / data.labels.length}%`,
                  }
                ]}
              />
            ))}
          </View>
        ) : (
          <Typography variant="body" color={colors.textSecondary}>
            No data available
          </Typography>
        )}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.labelsContainer}>
        {data.labels.map((label, index) => (
          <View key={index} style={styles.labelItem}>
            <Typography variant="caption" color={colors.textSecondary}>
              {label}
            </Typography>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Time range selector
  const TimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'week' && [styles.activeTimeRange, { backgroundColor: `${colors.primary}20` }]
        ]}
        onPress={() => handleTimeRangeChange('week')}
      >
        <Typography
          variant="bodySmall"
          color={timeRange === 'week' ? colors.primary : colors.textSecondary}
        >
          Week
        </Typography>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'month' && [styles.activeTimeRange, { backgroundColor: `${colors.primary}20` }]
        ]}
        onPress={() => handleTimeRangeChange('month')}
      >
        <Typography
          variant="bodySmall"
          color={timeRange === 'month' ? colors.primary : colors.textSecondary}
        >
          Month
        </Typography>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'year' && [styles.activeTimeRange, { backgroundColor: `${colors.primary}20` }]
        ]}
        onPress={() => handleTimeRangeChange('year')}
      >
        <Typography
          variant="bodySmall"
          color={timeRange === 'year' ? colors.primary : colors.textSecondary}
        >
          Year
        </Typography>
      </TouchableOpacity>
    </View>
  );

  // Popular anime list item
  const PopularAnimeItem = ({ 
    title, 
    count, 
    index 
  }: { 
    title: string; 
    count: number; 
    index: number 
  }) => (
    <View style={[styles.popularItem, { borderBottomColor: colors.border }]}>
      <Typography variant="bodySmall" style={styles.popularRank}>
        #{index + 1}
      </Typography>
      <Typography variant="body" numberOfLines={1} style={styles.popularTitle}>
        {title}
      </Typography>
      <Typography variant="bodySmall" color={colors.textSecondary}>
        {count} points
      </Typography>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography variant="body" style={{ marginTop: 16 }}>
          Loading analytics data...
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <BarChart3 size={24} color={colors.primary} style={styles.titleIcon} />
          <Typography variant="h1">Analytics</Typography>
        </View>
        
        <TimeRangeSelector />
      </View>
      
      {/* User Stats */}
      <View style={styles.section}>
        <Typography variant="h2" style={styles.sectionTitle}>
          User Statistics
        </Typography>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={analyticsData.userStats.totalUsers}
            icon={<Users size={20} color={colors.primary} />}
            change={analyticsData.userStats.userGrowth}
            isPositive={analyticsData.userStats.userGrowth > 0}
          />
          <StatCard
            title="New Users (Today)"
            value={analyticsData.userStats.newUsersToday}
            icon={<Users size={20} color={colors.primary} />}
          />
          <StatCard
            title="New Users (Week)"
            value={analyticsData.userStats.newUsersWeek}
            icon={<Users size={20} color={colors.primary} />}
          />
          <StatCard
            title="Active Users"
            value={analyticsData.userStats.activeUsers}
            icon={<Eye size={20} color={colors.primary} />}
          />
        </View>
      </View>
      
      {/* Content Stats */}
      <View style={styles.section}>
        <Typography variant="h2" style={styles.sectionTitle}>
          Content Statistics
        </Typography>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Anime"
            value={analyticsData.contentStats.totalAnime}
            icon={<Film size={20} color={colors.primary} />}
          />
          <StatCard
            title="Total Episodes"
            value={analyticsData.contentStats.totalEpisodes}
            icon={<Film size={20} color={colors.primary} />}
          />
          <StatCard
            title="Total Favorites"
            value={analyticsData.contentStats.totalFavorites}
            icon={<Heart size={20} color={colors.primary} />}
          />
          <StatCard
            title="Total Watched"
            value={analyticsData.contentStats.totalWatched}
            icon={<Eye size={20} color={colors.primary} />}
          />
        </View>
      </View>
      
      {/* Engagement Stats */}
      <View style={styles.section}>
        <Typography variant="h2" style={styles.sectionTitle}>
          Engagement Metrics
        </Typography>
        <View style={styles.statsGrid}>
          <StatCard
            title="Avg. Watch Time"
            value={analyticsData.engagementStats.averageWatchTime}
            icon={<Clock size={20} color={colors.primary} />}
            suffix=" min"
          />
          <StatCard
            title="Completion Rate"
            value={Math.round(analyticsData.engagementStats.completionRate * 100)}
            icon={<TrendingUp size={20} color={colors.primary} />}
            suffix="%"
          />
          <StatCard
            title="Favorite Rate"
            value={Math.round(analyticsData.engagementStats.favoriteRate * 100)}
            icon={<Heart size={20} color={colors.primary} />}
            suffix="%"
          />
          <StatCard
            title="Returning Users"
            value={analyticsData.engagementStats.returningUsers}
            icon={<Users size={20} color={colors.primary} />}
          />
        </View>
      </View>
      
      {/* Charts */}
      <View style={styles.section}>
        <Typography variant="h2" style={styles.sectionTitle}>
          User Activity
        </Typography>
        <ChartPlaceholder 
          title={`User Activity (${timeRange})`}
          height={200}
          data={analyticsData.userActivityChart}
        />
      </View>
      
      <View style={styles.section}>
        <Typography variant="h2" style={styles.sectionTitle}>
          Most Popular Anime
        </Typography>
        <View style={[styles.popularContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {analyticsData.contentStats.mostPopularAnime.length > 0 ? (
            analyticsData.contentStats.mostPopularAnime.map((anime, index) => (
              <PopularAnimeItem
                key={anime.id}
                title={anime.title}
                count={anime.count}
                index={index}
              />
            ))
          ) : (
            <Typography variant="body" color={colors.textSecondary} style={styles.noDataText}>
              No popularity data available
            </Typography>
          )}
        </View>
        
        <ChartPlaceholder 
          title="Popularity Distribution"
          height={200}
          data={analyticsData.contentPopularityChart}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimeRange: {
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: '1%',
    width: '48%',
    marginBottom: 16,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    marginLeft: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chartPlaceholder: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockChart: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  mockBar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  labelsContainer: {
    marginTop: 8,
  },
  labelItem: {
    marginRight: 16,
  },
  popularContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  popularRank: {
    width: 30,
    fontWeight: 'bold',
  },
  popularTitle: {
    flex: 1,
    marginRight: 8,
  },
  noDataText: {
    padding: 16,
    textAlign: 'center',
  },
});
