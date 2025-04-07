import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Trophy, Star, Sparkles } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelUpAnimationProps {
  level: number;
  onComplete: () => void;
}

export default function LevelUpAnimation({
  level,
  onComplete,
}: LevelUpAnimationProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const badgeRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    // Main animation sequence
    opacity.value = withSequence(
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withDelay(
        3000,
        withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(onComplete)();
        })
      )
    );
    
    // Scale animation
    scale.value = withSequence(
      withTiming(1.2, { duration: 500, easing: Easing.out(Easing.back) }),
      withTiming(1, { duration: 300 })
    );
    
    // Badge rotation animation
    badgeRotation.value = withSequence(
      withTiming(0.1, { duration: 200 }),
      withTiming(-0.1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
    
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${badgeRotation.value}rad` }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.overlay}>
      {/* Background overlay */}
      <View style={styles.background} />
      
      {/* Confetti animation */}
      <LottieView
        source={require('@/assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={styles.confetti}
      />
      
      {/* Main content */}
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Level badge */}
        <Animated.View style={[styles.badgeContainer, badgeStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Trophy size={48} color="#FFFFFF" />
          </LinearGradient>
          
          {/* Glow effect */}
          <Animated.View style={[styles.badgeGlow, glowStyle]}>
            <LinearGradient
              colors={['transparent', '#FFD700']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </Animated.View>
        
        {/* Level text */}
        <View style={styles.textContainer}>
          <Text style={styles.levelUpText}>LEVEL UP!</Text>
          <Text style={styles.levelText}>
            <Sparkles size={24} color="#FFD700" /> Level {level} <Sparkles size={24} color="#FFD700" />
          </Text>
          <Text style={styles.congratsText}>
            Congratulations on your progress!
          </Text>
        </View>
        
        {/* Rewards */}
        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Star size={20} color="#00FFA9" />
            <Text style={styles.rewardText}>+10 Coins Reward</Text>
          </View>
          
          <View style={styles.rewardItem}>
            <Trophy size={20} color="#FFD700" />
            <Text style={styles.rewardText}>New Challenge Unlocked</Text>
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
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  confetti: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: 'absolute',
  },
  container: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    width: '90%',
    maxWidth: 400,
  },
  badgeContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  badgeGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 70,
    opacity: 0.5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelUpText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  levelText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  congratsText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  rewardsContainer: {
    width: '100%',
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});