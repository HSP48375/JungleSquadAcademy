import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AchievementToastProps {
  achievement: {
    name: string;
    description: string;
    reward_type: string;
    reward_data: any;
  };
  onComplete: () => void;
  position?: 'top' | 'bottom';
}

export default function AchievementToast({
  achievement,
  onComplete,
  position = 'top',
}: AchievementToastProps) {
  // Animation values
  const translateY = useSharedValue(position === 'top' ? -100 : 100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  // Play sound effect
  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/achievement.mp3'),
        { shouldPlay: true }
      );
      
      // Unload sound after playing
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };
  
  // Set up animations
  useEffect(() => {
    // Play sound
    if (Platform.OS !== 'web') {
      playSound();
    }
    
    // Entrance animation
    translateY.value = withTiming(0, { 
      duration: 800, 
      easing: Easing.out(Easing.back) 
    });
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSequence(
      withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back) }),
      withTiming(1, { duration: 200 })
    );
    
    // Exit animation after delay
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
      translateY.value = withTiming(position === 'top' ? -100 : 100, { 
        duration: 500 
      }, () => {
        runOnJS(onComplete)();
      });
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));
  
  // Get icon based on reward type
  const getRewardIcon = () => {
    switch (achievement.reward_type) {
      case 'avatar_item':
        return <Sparkles size={20} color="#FFD700" />;
      case 'badge':
        return <Star size={20} color="#FFD700" />;
      case 'color':
        return <Star size={20} color={achievement.reward_data.hex || '#FFD700'} />;
      default:
        return <Trophy size={20} color="#FFD700" />;
    }
  };
  
  // Get reward text based on type
  const getRewardText = () => {
    switch (achievement.reward_type) {
      case 'avatar_item':
        return `Unlocked: ${achievement.reward_data.item}`;
      case 'badge':
        return `Badge: ${achievement.reward_data.badge_name}`;
      case 'color':
        return `Color: ${achievement.reward_data.color_name}`;
      default:
        return 'Special Reward';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        containerStyle
      ]}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(26,26,26,0.9)']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.iconBackground}
        >
          <Trophy size={24} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>Secret Achievement Unlocked!</Text>
        <Text style={styles.name}>{achievement.name}</Text>
        <Text style={styles.description}>{achievement.description}</Text>
        
        <View style={styles.rewardContainer}>
          {getRewardIcon()}
          <Text style={styles.rewardText}>{getRewardText()}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
      },
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
    zIndex: 1000,
  },
  topPosition: {
    top: Platform.OS === 'web' ? 20 : 60,
  },
  bottomPosition: {
    bottom: 20,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
});