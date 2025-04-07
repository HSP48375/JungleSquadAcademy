import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCard from '@/components/NotificationCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications
  } = useNotifications(session?.user?.id ?? '');
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const titleGlow = useSharedValue(0.5);
  const bellRotate = useSharedValue(0);
  
  // Set up animations
  useEffect(() => {
    // Title glow animation
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Bell animation when there are unread notifications
    if (unreadCount > 0) {
      bellRotate.value = withRepeat(
        withSequence(
          withTiming(0.1, { duration: 300, easing: Easing.inOut(Easing.sine) }),
          withTiming(-0.1, { duration: 300, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.sine) })
        ),
        2,
        false
      );
    } else {
      bellRotate.value = withTiming(0);
    }
  }, [unreadCount]);
  
  // Animated styles
  const titleGlowStyle = useAnimatedStyle(() => ({
    opacity: titleGlow.value,
  }));
  
  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotate.value}rad` }],
  }));
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Animated.View style={[styles.titleGlow, titleGlowStyle]}>
              <LinearGradient
                colors={['transparent', '#00FFA9']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            
            <View style={styles.titleRow}>
              <Animated.View style={bellStyle}>
                <Bell size={32} color="#00FFA9" />
              </Animated.View>
              <Text style={styles.title}>Notifications</Text>
            </View>
            
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount} unread</Text>
              </View>
            )}
          </View>
          
          <View style={styles.actions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
              >
                <Check size={20} color="#00FFA9" />
                <Text style={styles.actionText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, refreshing && styles.actionButtonDisabled]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {loading && !refreshing ? (
          <Text style={styles.loadingText}>Loading notifications...</Text>
        ) : notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <Animated.View
              key={notification.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <NotificationCard
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            </Animated.View>
          ))
        ) : (
          <GlassmorphicCard
            glowColor="#666666"
            intensity="low"
            style={styles.emptyContainer}
          >
            <Bell size={48} color="#666666" />
            <Text style={styles.emptyText}>
              You don't have any notifications yet. Check back later!
            </Text>
          </GlassmorphicCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  titleContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  titleGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  unreadBadge: {
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  unreadText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 16,
  },
});