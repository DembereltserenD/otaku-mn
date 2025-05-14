import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Alert } from 'react-native';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
}

/**
 * Custom hook for managing user notifications
 */
const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user notifications
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter(notification => !notification.read).length);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, notifications]);

  /**
   * Create a notification (admin only)
   */
  const createNotification = useCallback(async (userId: string, type: string, content: string) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          content,
          read: false
        });

      if (insertError) throw insertError;
      
      // If creating a notification for the current user, refresh notifications
      if (userId === user.id) {
        await fetchNotifications();
      }
      
      return true;
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setError(err.message || 'Failed to create notification');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchNotifications]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  };
};

export default useNotifications;
