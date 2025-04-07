import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Zap, Clock } from 'lucide-react-native';

interface StreakIndicatorProps {
  streak: number;
  resetTime?: { hours: number; minutes: number } | null;
  size?: 'small' | 'medium' | 'large';
  showResetTime?: boolean;
}

export default function StreakIndicator({
  streak,
  resetTime,
  size = 'medium',
  showResetTime = true,
}: StreakIndicatorProps) {
  // Animation values
  const flameScale = useSharedValue(1);
  const flameOpacity = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    if (streak >= 3) {
      // Flame pulsing animation
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      flameOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
  }, [streak]);
  
  // Animated styles
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
    opacity: flameOpacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  // Get streak color based on streak count
  const getStreakColor = () => {
    if (streak >= 7) return '#FF0000'; // Red hot for 7+ days
    if (streak >= 5) return '#FF6600'; // Orange for 5-6 days
    if (streak >= 3) return '#FFCC00'; // Yellow for 3-4 days
    return '#AAAAAA'; // Grey for 0-2 days
  };
  
  // Get streak bonus text
  const getStreakBonusText = () => {
    if (streak >= 7) return '2x XP';
    if (streak >= 5) return '1.5x XP';
    if (streak >= 3) return '1.25x XP';
    return '';
  };
  
  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { height: 40 },
          streakContainer: { width: 24, height: 24, borderRadius: 12 },
          streakText: { fontSize: 10 },
          bonusText: { fontSize: 8 },
          resetText: { fontSize: 8 },
        };
      case 'large':
        return {
          container: { height: 80 },
          streakContainer: { width: 48, height: 48, borderRadius: 24 },
          streakText: { fontSize: 20 },
          bonusText: { fontSize: 14 },
          resetText: { fontSize: 14 },
        };
      default: // medium
        return {
          container: { height: 60 },
          streakContainer: { width: 36, height: 36, borderRadius: 18 },
          streakText: { fontSize: 16 },
          bonusText: { fontSize: 12 },
          resetText: { fontSize: 12 },
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Streak color
  const streakColor = getStreakColor();
  const streakBonus = getStreakBonusText();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {/* Streak indicator */}
      <View style={[styles.streakContainer, sizeStyles.streakContainer]}>
        {/* Background */}
        <LinearGradient
          colors={['#1A1A1A', '#262626']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Glow effect for higher streaks */}
        {streak >= 3 && (
          <Animated.View style={[styles.streakGlow, glowStyle]}>
            <LinearGradient
              colors={['transparent', streakColor + '80']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        
        {/* Flame icon */}
        <Animated.View style={[styles.flameContainer, flameStyle]}>
          <Zap size={sizeStyles.streakText.fontSize * 1.2} color={streakColor} />
        </Animated.View>
        
        {/* Streak count */}
        <Text style={[styles.streakText, sizeStyles.streakText, { color: streakColor }]}>
          {streak}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        {/* Streak label */}
        <Text style={styles.streakLabel}>
          Day Streak
        </Text>
        
        {/* Streak bonus */}
        {streakBonus && (
          <Text style={[styles.bonusText, sizeStyles.bonusText, { color: streakColor }]}>
            {streakBonus} Bonus
          </Text>
        )}
        
        {/* Reset time */}
        {showResetTime && resetTime && (
          <View style={styles.resetContainer}>
            <Clock size={sizeStyles.resetText.fontSize} color="#AAAAAA" />
            <Text style={[styles.resetText, sizeStyles.resetText]}>
              Resets in {resetTime.hours}h {resetTime.minutes}m
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  streakGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  flameContainer: {
    position: 'absolute',
  },
  streakText: {
    fontFamily: 'SpaceGrotesk-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  infoContainer: {
    marginLeft: 12,
  },
  streakLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bonusText: {
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  resetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  resetText: {
    fontFamily: 'SpaceGrotesk-Regular',
    color: '#AAAAAA',
  },
});