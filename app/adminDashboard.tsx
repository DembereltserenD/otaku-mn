import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { supabase } from '@/lib/supabase';
import Typography from '@/components/Typography';
import { 
  Users, 
  Film, 
  Play, 
  Heart, 
  TrendingUp, 
  Bell, 
  AlertTriangle,
  Plus,
  Sun,
  Moon,
  Laptop
} from 'lucide-react-native';

// Dashboard stat card interface
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  positive?: boolean;
  onPress?: () => void;
}

// Quick action button interface
interface QuickActionProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

/**
 * Admin Dashboard component
 * Displays key metrics and quick actions for administrators
 */
export default function AdminDashboard() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnime: 0,
    totalEpisodes: 0,
    totalFavorites: 0,
    newUsersToday: 0,
    activeUsers: 0,
    pendingReports: 0,
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
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
      const { count: newUsersCount, error: newUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Set stats
      setStats({
        totalUsers: userCount || 0,
        totalAnime: animeCount || 0,
        totalEpisodes: episodeCount || 0,
        totalFavorites: favoritesCount || 0,
        newUsersToday: newUsersCount || 0,
        activeUsers: Math.floor(Math.random() * 100), // Placeholder for active users
        pendingReports: Math.floor(Math.random() * 10), // Placeholder for pending reports
      });

      if (userError || animeError || episodeError || favoritesError || newUsersError) {
        console.error('Error fetching stats:', { 
          userError, animeError, episodeError, favoritesError, newUsersError 
        });
      }
    } catch (error) {
      console.error('Error in fetchDashboardStats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardStats();
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Stat Card Component
  const StatCard = ({ title, value, icon, change, positive, onPress }: StatCardProps) => (
    <TouchableOpacity 
      style={[
        styles.statCard, 
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.statCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          {icon}
        </View>
        {change && (
          <View style={[
            styles.changeIndicator, 
            { backgroundColor: positive ? `${colors.success}20` : `${colors.error}20` }
          ]}>
            <Typography 
              variant="caption" 
              color={positive ? colors.success : colors.error}
            >
              {change}
            </Typography>
          </View>
        )}
      </View>
      <Typography variant="h2" style={styles.statValue}>
        {value}
      </Typography>
      <Typography variant="bodySmall" color={colors.textSecondary}>
        {title}
      </Typography>
    </TouchableOpacity>
  );

  // Quick Action Button Component
  const QuickAction = ({ title, icon, onPress }: QuickActionProps) => (
    <TouchableOpacity 
      style={[
        styles.quickAction, 
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}20` }]}>
        {icon}
      </View>
      <Typography variant="bodySmall" style={styles.quickActionText}>
        {title}
      </Typography>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography variant="body" style={{ marginTop: 16 }}>
          Loading dashboard data...
        </Typography>
      </View>
    );
  }

  // Theme Switcher Component
  const ThemeSwitcher = () => (
    <View style={[styles.themeSwitcherContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Typography variant="bodySmall" color={colors.textSecondary} style={styles.themeSwitcherTitle}>
        Admin Theme
      </Typography>
      <View style={styles.themeSwitcherButtons}>
        <TouchableOpacity
          style={[
            styles.themeButton,
            themeMode === 'light' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setThemeMode('light')}
        >
          <Sun size={16} color={themeMode === 'light' ? colors.primary : colors.text} />
          <Typography 
            variant="caption" 
            color={themeMode === 'light' ? colors.primary : colors.text}
            style={styles.themeButtonText}
          >
            Light
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.themeButton,
            themeMode === 'dark' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setThemeMode('dark')}
        >
          <Moon size={16} color={themeMode === 'dark' ? colors.primary : colors.text} />
          <Typography 
            variant="caption" 
            color={themeMode === 'dark' ? colors.primary : colors.text}
            style={styles.themeButtonText}
          >
            Dark
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.themeButton,
            themeMode === 'black' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setThemeMode('black')}
        >
          <Laptop size={16} color={themeMode === 'black' ? colors.primary : colors.text} />
          <Typography 
            variant="caption" 
            color={themeMode === 'black' ? colors.primary : colors.text}
            style={styles.themeButtonText}
          >
            Admin
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Typography variant="h1">Dashboard</Typography>
        <Typography variant="bodySmall" color={colors.textSecondary}>
          Welcome to the admin dashboard
        </Typography>
      </View>

      {/* Key Stats */}
      <View style={styles.statsSection}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Overview
        </Typography>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users size={20} color={colors.primary} />}
            change="+5%"
            positive={true}
          />
          <StatCard
            title="Total Anime"
            value={stats.totalAnime}
            icon={<Film size={20} color={colors.primary} />}
          />
          <StatCard
            title="Total Episodes"
            value={stats.totalEpisodes}
            icon={<Play size={20} color={colors.primary} />}
          />
          <StatCard
            title="Total Favorites"
            value={stats.totalFavorites}
            icon={<Heart size={20} color={colors.primary} />}
          />
        </View>
      </View>

      {/* Activity Stats */}
      <View style={styles.statsSection}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Recent Activity
        </Typography>
        <View style={styles.statsGrid}>
          <StatCard
            title="New Users Today"
            value={stats.newUsersToday}
            icon={<Users size={20} color={colors.primary} />}
            change="+2"
            positive={true}
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<TrendingUp size={20} color={colors.primary} />}
            change="+12%"
            positive={true}
          />
          <StatCard
            title="Pending Reports"
            value={stats.pendingReports}
            icon={<AlertTriangle size={20} color={colors.warning} />}
            change="+3"
            positive={false}
          />
        </View>
      </View>

      {/* Theme Switcher */}
      <ThemeSwitcher />
      
      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Add New Anime"
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => {}}
          />
          <QuickAction
            title="Manage Users"
            icon={<Users size={20} color={colors.primary} />}
            onPress={() => {}}
          />
          <QuickAction
            title="Send Notification"
            icon={<Bell size={20} color={colors.primary} />}
            onPress={() => {}}
          />
          <QuickAction
            title="View Reports"
            icon={<AlertTriangle size={20} color={colors.primary} />}
            onPress={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeSwitcherContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeSwitcherTitle: {
    marginBottom: 12,
  },
  themeSwitcherButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  themeButtonText: {
    marginLeft: 4,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  statsSection: {
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: '1%',
    width: '48%',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  quickAction: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: '1%',
    width: '48%',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
});
