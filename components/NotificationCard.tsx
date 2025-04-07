import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Trophy, 
  Quote, 
  Zap, 
  Calendar, 
  Check, 
  ChevronRight, 
  X,
  Star
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import GlassmorphicCard from './GlassmorphicCard';

interface NotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    created_at: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationCardProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const iconScale = useSharedValue(1);
  
  // Set up animations
  useEffect(() => {
    if (!notification.is_read) {
      // Glow animation for unread notifications
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      // Icon pulse animation
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    } else {
      // Static values for read notifications
      glowOpacity.value = withTiming(0.3);
      iconScale.value = withTiming(1);
    }
  }, [notification.is_read]);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return <Trophy size={24} color="#FFD700" />;
      case 'quote_update':
        return <Quote size={24} color="#FF69B4" />;
      case 'streak_reminder':
        return <Zap size={24} color="#FF4444" />;
      case 'weekly_summary':
        return <Calendar size={24} color="#00AAFF" />;
      default:
        return <Bell size={24} color="#00FFA9" />;
    }
  };
  
  // Get notification color based on type
  const getNotificationColor = () => {
    switch (notification.type) {
      case 'achievement':
        return '#FFD700';
      case 'quote_update':
        return '#FF69B4';
      case 'streak_reminder':
        return '#FF4444';
      case 'weekly_summary':
        return '#00AAFF';
      default:
        return '#00FFA9';
    }
  };
  
  // Handle notification press
  const handlePress = () => {
    // Mark as read if not already
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type and data
    if (notification.type === 'achievement') {
      if (notification.data?.achievement_type === 'avatar_of_week') {
        router.push('/community/avatar-of-week');
      } else {
        router.push('/profile/achievements');
      }
    } else if (notification.type === 'quote_update') {
      if (notification.data?.quote_id) {
        router.push(`/community/share-quote?id=${notification.data.quote_id}`);
      } else {
        router.push('/community/quotes');
      }
    } else if (notification.type === 'streak_reminder') {
      router.push('/chat');
    } else if (notification.type === 'weekly_summary') {
      router.push('/progress');
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = (e: any) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };
  
  // Handle delete
  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete(notification.id);
  };
  
  const color = getNotificationColor();
  const formattedDate = formatDate(notification.created_at);

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <GlassmorphicCard
        glowColor={color}
        intensity={notification.is_read ? 'low' : 'medium'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {/* Unread indicator */}
          {!notification.is_read && (
            <Animated.View style={[styles.unreadIndicator, glowStyle]}>
              <LinearGradient
                colors={['transparent', color]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
          
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            {getNotificationIcon()}
          </Animated.View>
          
          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message}>{notification.message}</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
          
          {/* Action buttons */}
          <View style={styles.actions}>
            {!notification.is_read && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAsRead}
              >
                <Check size={20} color="#00FFA9" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <X size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
          
          {/* Call to action */}
          {notification.data?.cta && (
            <View style={styles.ctaContainer}>
              <ChevronRight size={20} color={color} />
            </View>
          )}
          
          {/* Reward indicator */}
          {(notification.data?.xp_reward || notification.data?.coin_reward) && (
            <View style={styles.rewardContainer}>
              {notification.data.xp_reward && (
                <View style={styles.rewardBadge}>
                  <Zap size={12} color="#00FFA9" />
                  <Text style={[styles.rewardText, { color: '#00FFA9' }]}>
                    +{notification.data.xp_reward} XP
                  </Text>
                </View>
              )}
              
              {notification.data.coin_reward && (
                <View style={styles.rewardBadge}>
                  <Star size={12} color="#FFD700" />
                  <Text style={[styles.rewardText, { color: '#FFD700' }]}>
                    +{notification.data.coin_reward} Coins
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </GlassmorphicCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    bottom: 0,
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  message: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  timestamp: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  rewardContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
  },
});