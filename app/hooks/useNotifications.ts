import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'release' | 'update' | 'system';
  image?: string;
  link?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const useNotifications = (userId: string | null): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'New Episode Released',
      message: 'Attack on Titan Season 4 Episode 12 is now available to watch!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      read: false,
      type: 'release',
      image: 'https://images.unsplash.com/photo-1541562232579-512a21325720?w=400&q=80'
    },
    {
      id: '2',
      title: 'Welcome to Otaku Mongolia',
      message: 'Thanks for joining! Explore our collection of anime and create your watchlist.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      read: true,
      type: 'system'
    },
    {
      id: '3',
      title: 'New Feature Alert',
      message: 'You can now track your watch progress and set reminders for upcoming episodes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: false,
      type: 'update'
    },
    {
      id: '4',
      title: 'Trending This Week',
      message: 'Jujutsu Kaisen and Demon Slayer are trending this week. Check them out!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      read: false,
      type: 'info',
      image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&q=80'
    },
    {
      id: '5',
      title: 'New Season Announcement',
      message: 'My Hero Academia Season 6 has been announced! It will premiere next fall.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      read: true,
      type: 'info',
      image: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&q=80'
    }
  ];

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set mock data
      setNotifications(mockNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update notification state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update all notifications
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Remove notification from state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear notifications
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError('Failed to clear notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
};

export default useNotifications; 