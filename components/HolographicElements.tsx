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
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HologramProps {
  color: string;
  size: number;
  x: number;
  y: number;
  shape: 'circle' | 'square' | 'triangle' | 'hexagon';
  delay: number;
  duration: number;
}

function Hologram({ color, size, x, y, shape, delay, duration }: HologramProps) {
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  useEffect(() => {
    // Opacity animation
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.4, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: duration * 0.6, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
    
    // Rotation animation
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration * 3, easing: Easing.linear }),
        -1,
        false
      )
    );
    
    // Scale animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: duration * 0.5, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.9, { duration: duration * 0.5, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
  }, []);
  
  const hologramStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));
  
  // Render different shapes
  const renderShape = () => {
    switch (shape) {
      case 'square':
        return (
          <View style={[styles.square, { width: size, height: size, borderColor: color }]}>
            <LinearGradient
              colors={['transparent', color + '40']}
              style={styles.shapeGradient}
            />
          </View>
        );
      case 'triangle':
        return (
          <View style={[styles.triangle, { borderBottomWidth: size, borderLeftWidth: size / 2, borderRightWidth: size / 2, borderBottomColor: color + '40' }]} />
        );
      case 'hexagon':
        return (
          <View style={[styles.hexagon, { width: size, height: size * 0.866, borderColor: color }]}>
            <LinearGradient
              colors={['transparent', color + '40']}
              style={styles.shapeGradient}
            />
          </View>
        );
      default: // circle
        return (
          <View style={[styles.circle, { width: size, height: size, borderColor: color }]}>
            <LinearGradient
              colors={['transparent', color + '40']}
              style={styles.shapeGradient}
            />
          </View>
        );
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.hologramContainer,
        {
          left: `${x}%`,
          top: `${y}%`,
        },
        hologramStyle,
      ]}
    >
      {renderShape()}
    </Animated.View>
  );
}

interface HolographicElementsProps {
  count?: number;
  colors?: string[];
  intensity?: 'low' | 'medium' | 'high';
}

export default function HolographicElements({
  count = 8,
  colors = ['#00FFA9', '#00AAFF', '#FF00FF', '#FFAA00', '#00FFFF'],
  intensity = 'medium',
}: HolographicElementsProps) {
  // Adjust count based on intensity
  const getAdjustedCount = () => {
    switch (intensity) {
      case 'low': return Math.floor(count * 0.5);
      case 'high': return Math.floor(count * 1.5);
      default: return count;
    }
  };
  
  const adjustedCount = getAdjustedCount();
  
  // Generate random holograms
  const generateHolograms = () => {
    const holograms = [];
    const shapes = ['circle', 'square', 'triangle', 'hexagon'];
    
    for (let i = 0; i < adjustedCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 40 + 20; // 20-60px
      const x = Math.random() * 90; // 0-90%
      const y = Math.random() * 90; // 0-90%
      const shape = shapes[Math.floor(Math.random() * shapes.length)] as 'circle' | 'square' | 'triangle' | 'hexagon';
      const delay = Math.random() * 2000; // 0-2000ms
      const duration = Math.random() * 2000 + 3000; // 3000-5000ms
      
      holograms.push(
        <Hologram
          key={i}
          color={color}
          size={size}
          x={x}
          y={y}
          shape={shape}
          delay={delay}
          duration={duration}
        />
      );
    }
    
    return holograms;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {generateHolograms()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  hologramContainer: {
    position: 'absolute',
  },
  circle: {
    borderWidth: 1,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  square: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hexagon: {
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  shapeGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
});