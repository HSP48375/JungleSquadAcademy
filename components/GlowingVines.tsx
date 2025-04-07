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

interface VineProps {
  color: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  delay: number;
  hasBranch?: boolean;
}

function Vine({ color, width, height, x, y, rotation, delay, hasBranch = false }: VineProps) {
  const glowIntensity = useSharedValue(0.5);
  const movement = useSharedValue(0);
  
  useEffect(() => {
    // Glow animation
    glowIntensity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
    
    // Subtle movement animation
    movement.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(3, { duration: 5000, easing: Easing.inOut(Easing.sine) }),
          withTiming(-3, { duration: 5000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
  }, []);
  
  const vineStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation}deg` },
      { translateY: movement.value },
    ],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.vineContainer,
        {
          left: `${x}%`,
          top: `${y}%`,
        },
        vineStyle,
      ]}
    >
      <View style={[styles.vine, { width, height, backgroundColor: color + '30' }]}>
        <Animated.View style={[styles.vineGlow, glowStyle]}>
          <LinearGradient
            colors={['transparent', color, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        <View style={[styles.vineCircuit, { backgroundColor: color }]} />
        <View style={[styles.vineCircuit, styles.vineCircuit2, { backgroundColor: color }]} />
        <View style={[styles.vineNode, { backgroundColor: color }]} />
        <View style={[styles.vineNode, styles.vineNode2, { backgroundColor: color }]} />
      </View>
      
      {hasBranch && (
        <View style={[styles.vineBranch, { backgroundColor: color + '30' }]}>
          <View style={[styles.vineBranchCircuit, { backgroundColor: color }]} />
          <View style={[styles.vineBranchNode, { backgroundColor: color }]} />
        </View>
      )}
    </Animated.View>
  );
}

interface GlowingVinesProps {
  count?: number;
  colors?: string[];
  intensity?: 'low' | 'medium' | 'high';
}

export default function GlowingVines({
  count = 6,
  colors = ['#00FFA9', '#00AAFF', '#FF00FF', '#FFAA00', '#00FFFF'],
  intensity = 'medium',
}: GlowingVinesProps) {
  // Adjust count based on intensity
  const getAdjustedCount = () => {
    switch (intensity) {
      case 'low': return Math.floor(count * 0.5);
      case 'high': return Math.floor(count * 1.5);
      default: return count;
    }
  };
  
  const adjustedCount = getAdjustedCount();
  
  // Generate random vines
  const generateVines = () => {
    const vines = [];
    
    for (let i = 0; i < adjustedCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const width = Math.random() * 2 + 2; // 2-4px
      const height = Math.random() * 150 + 100; // 100-250px
      const x = Math.random() * 90; // 0-90%
      const y = Math.random() * 90; // 0-90%
      const rotation = Math.random() * 360; // 0-360 degrees
      const delay = Math.random() * 2000; // 0-2000ms
      const hasBranch = Math.random() > 0.5; // 50% chance
      
      vines.push(
        <Vine
          key={i}
          color={color}
          width={width}
          height={height}
          x={x}
          y={y}
          rotation={rotation}
          delay={delay}
          hasBranch={hasBranch}
        />
      );
    }
    
    return vines;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {generateVines()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  vineContainer: {
    position: 'absolute',
  },
  vine: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  vineGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  vineCircuit: {
    position: 'absolute',
    width: '80%',
    height: 1,
    top: '30%',
    left: '10%',
  },
  vineCircuit2: {
    top: '70%',
  },
  vineNode: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: '30%',
    left: '50%',
    marginLeft: -3,
  },
  vineNode2: {
    top: '70%',
  },
  vineBranch: {
    position: 'absolute',
    width: '50%',
    height: 2,
    top: '40%',
    left: '100%',
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
    transformOrigin: 'left center',
  },
  vineBranchCircuit: {
    position: 'absolute',
    width: '60%',
    height: 1,
    top: 0.5,
    left: '20%',
  },
  vineBranchNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: -1,
    right: '10%',
  },
});