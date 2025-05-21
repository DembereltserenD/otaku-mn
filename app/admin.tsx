import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Shield, Film, Users, Tag, Bell, Settings, BarChart3, LogOut, Home } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeProvider";
import Typography from "@/components/Typography";
import BottomNavigation from "./components/BottomNavigation";

// Import admin screens
// Import admin components
// Using require instead of import to avoid TypeScript module resolution issues
const AdminDashboard = require('./adminDashboard').default;
const AdminAnime = require('./adminAnime').default;
const AdminUsers = require('./adminUsers').default;
const AdminGenres = require('./adminGenres').default;
const AdminNotifications = require('./adminNotifications').default;
const AdminModeration = require('./adminModeration').default;
const AdminAnalytics = require('./adminAnalytics').default;
const AdminSettings = require('./adminSettings').default;
const AdminAnimeEpisodes = require('./adminAnimeEpisodes').default;

// Define admin screen types
type AdminScreen = 
  | 'dashboard'
  | 'anime'
  | 'episodes'
  | 'users'
  | 'genres'
  | 'notifications'
  | 'moderation'
  | 'analytics'
  | 'settings';

// Define admin menu items
interface AdminMenuItem {
  id: AdminScreen;
  label: string;
  icon: React.ElementType;
  color?: string;
}

/**
 * Admin component serves as the main entry point for the admin interface
 * Handles access control and navigation between admin screens
 */
export default function Admin() {
  const { user, role, signOut } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Define admin menu items for home screen
  const contentManagementItems: AdminMenuItem[] = [
    { id: 'users', label: 'User Management', icon: Users, color: colors.info },
    { id: 'anime', label: 'Anime Content', icon: Film, color: colors.primary },
    { id: 'genres', label: 'Genres', icon: Tag, color: colors.success },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: colors.warning },
    { id: 'moderation', label: 'Moderation', icon: Shield, color: colors.error },
  ];
  
  // Handle going back to home
  const handleGoToHome = () => {
    router.push('/');
  };

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      try {
        // If no user or user is not admin, redirect to home
        if (!user || role !== 'admin') {
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, router]);

  // Handle navigation between admin screens
  const handleScreenChange = (screenId: string) => {
    setCurrentScreen(screenId as AdminScreen);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle menu item press
  const handleMenuItemPress = (screenId: AdminScreen) => {
    setCurrentScreen(screenId);
  };

  // Render appropriate screen based on current selection
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'anime':
        return <AdminAnime navigation={{ goBack: () => setCurrentScreen('dashboard') }} />;
      case 'episodes':
        return <AdminAnimeEpisodes 
          route={{ params: { animeId: null } }}
          navigation={{ goBack: () => setCurrentScreen('anime') }}
        />;
      case 'users':
        return <AdminUsers />;
      case 'genres':
        return <AdminGenres />;
      case 'notifications':
        return <AdminNotifications />;
      case 'moderation':
        return <AdminModeration />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Shield size={40} color={colors.primary} />
          <Typography variant="h2" style={{ marginTop: 16 }}>
            Loading Admin Panel...
          </Typography>
        </View>
      </View>
    );
  }

  // If not admin, this should redirect, but just in case
  if (!user || role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.unauthorizedContainer}>
          <Shield size={40} color={colors.error} />
          <Typography variant="h2" style={{ marginTop: 16 }}>
            Unauthorized Access
          </Typography>
          <Typography variant="body" style={{ marginTop: 8, textAlign: 'center' }}>
            You don't have permission to access the admin panel.
          </Typography>
        </View>
      </View>
    );
  }
  
  // If we're showing the admin home screen
  if (currentScreen === 'dashboard') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerTitleContainer}>
                <Shield size={24} color={colors.primary} />
                <Typography variant="h2" style={{ marginLeft: 8 }}>
                  Admin Panel
                </Typography>
              </View>
              <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
                onPress={handleLogout}
              >
                <LogOut size={18} color={colors.error} />
                <Typography variant="bodySmall" style={{ color: colors.error, marginLeft: 4 }}>
                  Logout
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Content Management Grid */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Typography variant="h3" style={{ marginBottom: 16 }}>
                Content Management
              </Typography>
              <View style={styles.menuGrid}>
                {contentManagementItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, { backgroundColor: colors.card }]}
                    onPress={() => handleMenuItemPress(item.id)}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                      <item.icon size={24} color={item.color} />
                    </View>
                    <Typography variant="body" style={{ marginTop: 8 }}>
                      {item.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
                
                {/* Go Back to Home Button */}
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.card }]}
                  onPress={handleGoToHome}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.success}20` }]}>
                    <Home size={24} color={colors.success} />
                  </View>
                  <Typography variant="body" style={{ marginTop: 8 }}>
                    Back to App
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  
  // Otherwise show the specific admin screen with bottom navigation
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header for specific screens */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentScreen('dashboard')}
            >
              <Home size={20} color={colors.text} />
              <Typography variant="body" style={{ marginLeft: 8 }}>
                Admin Home
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
              onPress={handleLogout}
            >
              <LogOut size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {renderScreen()}
        </View>
        

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
