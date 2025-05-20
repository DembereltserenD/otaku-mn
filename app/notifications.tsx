import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Check,
  Trash2,
  AlertCircle,
  Info,
  Star,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";

// Define Notification interface
interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
  title?: string;
  message?: string;
  link?: string;
  image?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("notifications");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock notification data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      user_id: null,
      type: 'new_anime',
      content: 'Шинэ аниме нэмэгдлээ: Death Note аниме манай системд нэмэгдлээ',
      read: false,
      created_at: new Date().toISOString(),
      title: 'Шинэ аниме нэмэгдлээ',
      message: 'Death Note аниме манай системд нэмэгдлээ'
    },
    {
      id: '2',
      user_id: null,
      type: 'update',
      content: 'Таны дуртай аниме шинэчлэгдлээ: Attack on Titan-ны шинэ анги гарлаа',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      title: 'Аниме шинэчлэгдлээ',
      message: 'Attack on Titan-ны шинэ анги гарлаа'
    },
    {
      id: '3',
      user_id: null,
      type: 'system',
      content: 'Шинэ сэтгэгдэл: Системийн шинэчлэлт хийгдлээ',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      title: 'Системийн мэдэгдэл',
      message: 'Системийн шинэчлэлт хийгдлээ'
    },
    {
      id: '4',
      user_id: null,
      type: 'system',
      content: 'Системийн мэдэгдэл: Манай систем засвартай байх тул түр хүлээнэ үү',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      title: 'Системийн мэдэгдэл',
      message: 'Манай систем засвартай байх тул түр хүлээнэ үү'
    },
    {
      id: '5',
      user_id: null,
      type: 'system',
      content: 'Шинэ функц: Mood Matcher системд нэмэгдлээ',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
      title: 'Шинэ функц',
      message: 'Mood Matcher системд нэмэгдлээ'
    }
  ];

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Fetch notifications (just resets the mock data)
  const fetchNotifications = useCallback(async () => {
    console.log('Fetching mock notifications');
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reset to mock data
      setNotifications(mockNotifications);
      console.log('Mock notifications loaded:', mockNotifications.length);
    } catch (err) {
      console.error('Error in mock notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    console.log('Marking notification as read:', id);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update notification state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      console.log('Successfully marked notification as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification');
    }
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update all notifications
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      console.log('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update notifications');
    }
  }, []);
  
  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Remove notification from state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
      
      console.log('Notification deleted:', id);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  }, []);
  
  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear notifications
      setNotifications([]);
      
      console.log('All notifications cleared');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError('Failed to clear notifications');
    }
  }, []);

  // Animation values for notification items
  const fadeAnims = React.useRef<{[key: string]: Animated.Value}>({});
  const translateYAnims = React.useRef<{[key: string]: Animated.Value}>({});

  // Initialize animation values for each notification
  useEffect(() => {
    notifications.forEach(notification => {
      if (!fadeAnims.current[notification.id]) {
        fadeAnims.current[notification.id] = new Animated.Value(0);
        translateYAnims.current[notification.id] = new Animated.Value(20);
      }
    });
  }, [notifications]);
  
  // This section intentionally left empty - we'll use the handleRefresh function defined below
  
  // Animate a notification
  const animateNotification = (id: string, index: number) => {
    Animated.parallel([
      Animated.timing(fadeAnims.current[id], {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnims.current[id], {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Initialize animation for a single notification
  const initializeAnimation = (id: string) => {
    if (!fadeAnims.current[id]) {
      fadeAnims.current[id] = new Animated.Value(0);
      translateYAnims.current[id] = new Animated.Value(20);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    console.log('NotificationsScreen mounted, fetching notifications...');
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Debug notifications
  useEffect(() => {
    console.log('Notifications in component:', notifications.length);
    if (notifications.length > 0) {
      console.log('First notification in component:', notifications[0]);
    }
  }, [notifications]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => {
      setRefreshing(false);
      
      // Add haptic feedback
      try {
        const Haptics = require("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available, continue silently
      }
    });
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    // Add haptic feedback
    try {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue silently
    }

    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Display notification content in an alert
    const title = notification.title || notification.type || 'Notification';
    const message = notification.content || '';
    
    Alert.alert(title, message);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      Alert.alert("Info", "No unread notifications");
      return;
    }

    // Add haptic feedback
    try {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available, continue silently
    }

    await markAllAsRead();
    Alert.alert("Success", "All notifications marked as read");
  };

  // Handle delete notification
  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            // Add haptic feedback
            try {
              const Haptics = require("expo-haptics");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              // Haptics not available, continue silently
            }

            await deleteNotification(id);
          },
          style: "destructive",
        },
      ],
    );
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "anime_recommendation":
      case "info":
        return <Info size={20} color={colors.info || "#60A5FA"} />;
      case "friend_activity":
      case "update":
        return <Calendar size={20} color={colors.success || "#34D399"} />;
      case "system":
      case "alert":
        return <AlertCircle size={20} color={colors.error || "#F87171"} />;
      default:
        return <Bell size={20} color={colors.textSecondary || "#9CA3AF"} />;
    }
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render notification item
  const renderNotificationItem = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    // Initialize animation without using hooks
    initializeAnimation(item.id);
    // Immediately animate the notification without using useEffect
    animateNotification(item.id, index);
    
    return (
      <Animated.View
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.read ? colors.card : colors.cardHover,
            borderLeftColor: getNotificationColor(item.type, colors),
            opacity: fadeAnims.current[item.id],
            transform: [{ translateY: translateYAnims.current[item.id] }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </View>

          <View style={styles.notificationTextContainer}>
            <View style={styles.notificationHeader}>
              <Text
                style={[styles.notificationTitle, { color: colors.text }]}
              >
                {item.title || item.type}
              </Text>
              
              <Text
                style={[
                  styles.notificationTime,
                  { color: colors.textSecondary },
                ]}
              >
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>

            <Text
              style={[
                styles.notificationMessage,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.notificationActions}>
          {!item.read && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.success + "20" },
              ]}
              onPress={() => markAsRead(item.id)}
            >
              <Check size={16} color={colors.success} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.error + "20" },
            ]}
            onPress={() => handleDeleteNotification(item.id)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };
  
  // Function to get notification color based on type
  const getNotificationColor = (type: string, colors: any) => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.primary;
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View style={{ flex: 1 }}>
        <Header
          title={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
          showBack={true}
        />

        {/* Header Actions */}
        <View style={[styles.headerActions, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[
              styles.markAllButton,
              { 
                backgroundColor: unreadCount > 0 ? colors.primary + "20" : colors.inactive + "20",
                borderColor: unreadCount > 0 ? colors.primary : colors.inactive
              }
            ]}
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle size={16} color={unreadCount > 0 ? colors.primary : colors.inactive} />
            <Text style={[
              styles.markAllText,
              { color: unreadCount > 0 ? colors.primary : colors.inactive }
            ]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info - Remove in production */}
        {loading ? (
          <View style={{padding: 16}}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{textAlign: 'center', marginTop: 8, color: colors.text}}>
              Loading notifications...
            </Text>
          </View>
        ) : error ? (
          <View style={{padding: 16}}>
            <Text style={{textAlign: 'center', color: colors.error}}>
              {error}
            </Text>
            <TouchableOpacity 
              style={{marginTop: 16, alignSelf: 'center', padding: 8, backgroundColor: colors.primary, borderRadius: 8}}
              onPress={() => fetchNotifications()}
            >
              <Text style={{color: '#fff'}}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        
        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {loading ? 'Loading...' : 'No notifications'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {loading 
                  ? 'Please wait while we fetch your notifications' 
                  : 'You don\'t have any notifications yet. Check back later!'}
              </Text>
            </View>
          }
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderLeftWidth: 4,
  },
  notificationContent: {
    flexDirection: "row",
    padding: 16,
  },
  notificationIcon: {
    marginRight: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 8,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  markAllText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

