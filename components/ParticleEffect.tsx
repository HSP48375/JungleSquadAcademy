import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleProps {
  color: string;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

function Particle({ color, size, x, y, delay, duration }: ParticleProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    // Floating animation
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration, easing: Easing.inOut(Easing.sine) }),
          withTiming(20, { duration, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
    
    // Fade in/out animation
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.5, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.2, { duration: duration * 0.5, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
  }, []);
  
  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: `${x}%`,
          top: `${y}%`,
        },
        particleStyle,
      ]}
    />
  );
}

interface ParticleEffectProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  intensity?: 'low' | 'medium' | 'high';
}

export default function ParticleEffect({
  count = 20,
  colors = ['#00FFA9', '#00AAFF', '#FF00FF', '#FFAA00', '#00FFFF'],
  minSize = 2,
  maxSize = 6,
  intensity = 'medium',
}: ParticleEffectProps) {
  // Adjust count based on intensity
  const getAdjustedCount = () => {
    switch (intensity) {
      case 'low': return Math.floor(count * 0.5);
      case 'high': return Math.floor(count * 1.5);
      default: return count;
    }
  };
  
  const adjustedCount = getAdjustedCount();
  
  // Generate random particles
  const generateParticles = () => {
    const particles = [];
    
    for (let i = 0; i < adjustedCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * (maxSize - minSize) + minSize;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 2000;
      const duration = Math.random() * 3000 + 3000;
      
      particles.push(
        <Particle
          key={i}
          color={color}
          size={size}
          x={x}
          y={y}
          delay={delay}
          duration={duration}
        />
      );
    }
    
    return particles;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {generateParticles()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});