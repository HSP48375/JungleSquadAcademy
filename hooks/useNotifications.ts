import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
}

interface NotificationPreferences {
  id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  quote_updates: boolean;
  streak_reminders: boolean;
  achievement_alerts: boolean;
  weekly_summary: boolean;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Register for push notifications
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web doesn't support push notifications in the same way
      return;
    }

    registerForPushNotifications();
  }, []);

  // Fetch notifications and preferences
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [userId]);

  // Register for push notifications
  const registerForPushNotifications = async () => {
    try {
      // Check if device is supported
      if (!Device.isDevice) {
        setError('Push notifications are not supported in the emulator');
        return;
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission to receive push notifications was denied');
        return;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })).data;

      setPushToken(token);

      // Save token to database
      if (userId) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId);
      }

      // Set up notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register for push notifications');
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setNotifications(data || []);
      
      // Count unread notifications
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
      
      // Set badge count
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(unread);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification preferences
  const fetchPreferences = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences if none exist
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            push_enabled: true,
            email_enabled: true,
            quote_updates: true,
            streak_reminders: true,
            achievement_alerts: true,
            weekly_summary: true
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
        
        // Award XP for enabling notifications for the first time
        await supabase.rpc('add_user_xp', {
          p_user_id: userId,
          p_amount: 5,
          p_source: 'notifications_enabled'
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch notification preferences');
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update badge count
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error: updateError } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: userId
      });

      if (updateError) throw updateError;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Reset badge count
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark all notifications as read');
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      setPreferences(data);
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update notification preferences');
      return false;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Update badge count
        if (Platform.OS !== 'web') {
          await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete notification');
    }
  };

  return {
    notifications,
    unreadCount,
    preferences,
    pushToken,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
}