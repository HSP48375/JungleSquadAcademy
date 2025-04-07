import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Zap, Trophy } from 'lucide-react-native';

interface XPBarProps {
  level: number;
  progress: number;
  streak: number;
  todayXP: number;
  showStreak?: boolean;
  showLevel?: boolean;
  showTodayXP?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'default' | 'math' | 'history' | 'language' | 'science' | 'art' | 'tech';
  onLevelUp?: () => void;
}

export default function XPBar({
  level,
  progress,
  streak,
  todayXP,
  showStreak = true,
  showLevel = true,
  showTodayXP = true,
  size = 'medium',
  theme = 'default',
  onLevelUp,
}: XPBarProps) {
  // Animation values
  const progressWidth = useSharedValue(0);
  const progressGlow = useSharedValue(0.5);
  const streakGlow = useSharedValue(0.5);
  const levelScale = useSharedValue(1);
  
  // Get theme colors
  const getThemeColors = () => {
    switch (theme) {
      case 'math':
        return {
          primary: '#00FFFF',
          secondary: '#0088FF',
          accent: '#FF00FF',
        };
      case 'history':
        return {
          primary: '#FF00FF',
          secondary: '#8800FF',
          accent: '#FFAA00',
        };
      case 'language':
        return {
          primary: '#FFFF00',
          secondary: '#FF8800',
          accent: '#00FFAA',
        };
      case 'science':
        return {
          primary: '#00FF00',
          secondary: '#00FFAA',
          accent: '#88FFFF',
        };
      case 'art':
        return {
          primary: '#FF00AA',
          secondary: '#FF00FF',
          accent: '#FFFF00',
        };
      case 'tech':
        return {
          primary: '#00AAFF',
          secondary: '#0066FF',
          accent: '#FF00AA',
        };
      default:
        return {
          primary: '#00FFA9',
          secondary: '#00AAFF',
          accent: '#FFD700',
        };
    }
  };
  
  const colors = getThemeColors();
  
  // Previous progress value for level-up detection
  const prevProgressRef = React.useRef(progress);
  
  // Set up animations
  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withTiming(progress, { 
      duration: 1000, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
    
    // Detect level-up
    if (prevProgressRef.current > progress && onLevelUp) {
      // Level up animation
      levelScale.value = withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 300 })
      );
      
      // Call level-up callback
      onLevelUp();
    }
    
    prevProgressRef.current = progress;
    
    // Glow animation for progress bar
    progressGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Streak flame animation
    if (streak >= 3) {
      streakGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
  }, [progress, streak]);
  
  // Animated styles
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));
  
  const progressGlowStyle = useAnimatedStyle(() => ({
    opacity: progressGlow.value,
  }));
  
  const streakGlowStyle = useAnimatedStyle(() => ({
    opacity: streakGlow.value,
  }));
  
  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));
  
  // Get streak color based on streak count
  const getStreakColor = () => {
    if (streak >= 7) return '#FF0000'; // Red hot for 7+ days
    if (streak >= 5) return '#FF6600'; // Orange for 5-6 days
    if (streak >= 3) return '#FFCC00'; // Yellow for 3-4 days
    return '#AAAAAA'; // Grey for 0-2 days
  };
  
  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { height: 40 },
          progressBar: { height: 6, borderRadius: 3 },
          levelBadge: { width: 24, height: 24, borderRadius: 12 },
          levelText: { fontSize: 10 },
          streakContainer: { width: 24, height: 24, borderRadius: 12 },
          streakText: { fontSize: 10 },
          todayXPText: { fontSize: 10 },
        };
      case 'large':
        return {
          container: { height: 80 },
          progressBar: { height: 12, borderRadius: 6 },
          levelBadge: { width: 40, height: 40, borderRadius: 20 },
          levelText: { fontSize: 18 },
          streakContainer: { width: 40, height: 40, borderRadius: 20 },
          streakText: { fontSize: 16 },
          todayXPText: { fontSize: 16 },
        };
      default: // medium
        return {
          container: { height: 60 },
          progressBar: { height: 8, borderRadius: 4 },
          levelBadge: { width: 32, height: 32, borderRadius: 16 },
          levelText: { fontSize: 14 },
          streakContainer: { width: 32, height: 32, borderRadius: 16 },
          streakText: { fontSize: 12 },
          todayXPText: { fontSize: 12 },
        };
    }
  };
  
  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {/* Level badge */}
      {showLevel && (
        <Animated.View style={[styles.levelBadge, sizeStyles.levelBadge, levelStyle]}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Trophy size={sizeStyles.levelText.fontSize * 1.2} color="#000000" />
          <Text style={[styles.levelText, sizeStyles.levelText]}>{level}</Text>
        </Animated.View>
      )}
      
      {/* Progress bar container */}
      <View style={[styles.progressBarContainer, sizeStyles.progressBar]}>
        {/* Background */}
        <View style={[styles.progressBarBackground, sizeStyles.progressBar]} />
        
        {/* Animated fill */}
        <Animated.View style={[styles.progressBarFill, sizeStyles.progressBar, progressStyle]}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          
          {/* Glow effect */}
          <Animated.View style={[styles.progressGlow, progressGlowStyle]}>
            <LinearGradient
              colors={['transparent', colors.primary + '80']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </Animated.View>
        
        {/* Progress percentage */}
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
      
      {/* Streak indicator */}
      {showStreak && streak > 0 && (
        <View style={[styles.streakContainer, sizeStyles.streakContainer]}>
          <Animated.View style={[styles.streakGlow, streakGlowStyle]}>
            <LinearGradient
              colors={['transparent', getStreakColor() + '80']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          
          <Zap size={sizeStyles.streakText.fontSize * 1.2} color={getStreakColor()} />
          <Text style={[styles.streakText, sizeStyles.streakText, { color: getStreakColor() }]}>
            {streak}
          </Text>
        </View>
      )}
      
      {/* Today's XP */}
      {showTodayXP && (
        <View style={styles.todayXPContainer}>
          <Text style={[styles.todayXPText, sizeStyles.todayXPText]}>
            +{todayXP} XP Today
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  levelBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(0, 255, 169, 0.5)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  levelText: {
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#000000',
    position: 'absolute',
  },
  progressBarContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarBackground: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    width: '100%',
    position: 'absolute',
  },
  progressBarFill: {
    position: 'absolute',
    overflow: 'hidden',
  },
  progressGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  streakContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    position: 'relative',
    overflow: 'hidden',
  },
  streakGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  streakText: {
    fontFamily: 'SpaceGrotesk-Bold',
    position: 'absolute',
  },
  todayXPContainer: {
    position: 'absolute',
    bottom: -16,
    right: 0,
  },
  todayXPText: {
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#00FFA9',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});