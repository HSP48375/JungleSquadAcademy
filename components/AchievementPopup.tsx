import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface AchievementPopupProps {
  achievement: {
    name: string;
    description: string;
    reward_type: string;
    reward_data: any;
  };
  onComplete: () => void;
}

export default function AchievementPopup({ achievement, onComplete }: AchievementPopupProps) {
  const scale = useAnimatedStyle(() => ({
    transform: [
      { scale: withSequence(
        withSpring(1.2),
        withSpring(1)
      )},
    ],
  }));

  const glow = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    ),
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,255,169,0.2)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.container, scale]}>
        <Animated.View style={[styles.glowContainer, glow]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.iconGradient}
          >
            <Trophy size={48} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>Secret Achievement Unlocked!</Text>
          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          <View style={styles.rewardContainer}>
            <Star size={20} color="#FFD700" />
            <Text style={styles.rewardText}>
              {achievement.reward_type === 'avatar_item' && 'New Avatar Item: '}
              {achievement.reward_type === 'badge' && 'New Badge: '}
              {achievement.reward_type === 'color' && 'New Color: '}
              {achievement.reward_data.item || 
               achievement.reward_data.badge_name ||
               achievement.reward_data.color_name}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  glowContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFD700',
    marginBottom: 8,
  },
  achievementName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#BBBBBB',
    textAlign: 'center',
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFD700',
  },
});