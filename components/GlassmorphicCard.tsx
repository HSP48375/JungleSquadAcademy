import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  borderColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
}

export default function GlassmorphicCard({
  children,
  style,
  glowColor = '#00FFA9',
  borderColor = 'rgba(255, 255, 255, 0.1)',
  intensity = 'medium',
  animated = true,
}: GlassmorphicCardProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.3);
  const borderGlow = useSharedValue(0.5);
  
  // Set up animations
  React.useEffect(() => {
    if (animated) {
      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      // Border glow animation
      borderGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
  }, [animated]);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));
  
  // Intensity multiplier
  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'low': return 0.5;
      case 'high': return 1.5;
      default: return 1;
    }
  };
  
  const intensityMultiplier = getIntensityMultiplier();

  return (
    <View style={[styles.container, style]}>
      {/* Background blur effect */}
      <View style={[styles.blurBackground, { backgroundColor: 'rgba(26, 26, 26, 0.6)' }]} />
      
      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      />
      
      {/* Animated glow effect */}
      <Animated.View 
        style={[
          styles.glowEffect, 
          glowStyle, 
          { 
            backgroundColor: glowColor,
            opacity: 0.3 * intensityMultiplier,
          }
        ]}
      />
      
      {/* Border */}
      <View style={[styles.border, { borderColor }]} />
      
      {/* Animated border glow */}
      <Animated.View 
        style={[
          styles.borderGlow, 
          borderStyle, 
          { 
            borderColor: glowColor,
            opacity: 0.5 * intensityMultiplier,
          }
        ]}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 16,
      },
    }),
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    backdropFilter: 'blur(10px)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.3,
    ...Platform.select({
      web: {
        filter: 'blur(40px)',
      },
    }),
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 16,
    opacity: 0.5,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});