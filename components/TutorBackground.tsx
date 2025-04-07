import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface TutorBackgroundProps {
  subject: string;
  primaryColor: string;
  secondaryColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export default function TutorBackground({
  subject,
  primaryColor,
  secondaryColor = '#1A0B2E',
  intensity = 'medium',
}: TutorBackgroundProps) {
  // Animation values
  const particleOpacity = useSharedValue(0.3);
  const glowIntensity = useSharedValue(0.5);
  const circuitPulse = useSharedValue(0.2);
  
  // Subject-specific background elements
  const getSubjectElements = () => {
    switch (subject) {
      case 'Mathematics':
        return {
          particles: 'equation_symbols',
          pattern: 'grid_pattern',
          accent: '#00FFFF',
        };
      case 'History & Geography':
        return {
          particles: 'time_fragments',
          pattern: 'map_coordinates',
          accent: '#FF00FF',
        };
      case 'Language Arts':
        return {
          particles: 'floating_letters',
          pattern: 'book_pages',
          accent: '#FFFF00',
        };
      case 'Science':
        return {
          particles: 'molecules',
          pattern: 'lab_equipment',
          accent: '#00FF00',
        };
      case 'Art & Creativity':
        return {
          particles: 'paint_drops',
          pattern: 'canvas_texture',
          accent: '#FF00AA',
        };
      default:
        return {
          particles: 'data_bits',
          pattern: 'circuit_board',
          accent: '#00FFA9',
        };
    }
  };
  
  const subjectElements = getSubjectElements();
  
  // Set up animations
  useEffect(() => {
    // Particle animation
    particleOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Glow animation
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Circuit pulse animation
    circuitPulse.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));
  
  const circuitStyle = useAnimatedStyle(() => ({
    opacity: circuitPulse.value,
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
    <View style={styles.container}>
      {/* Base gradient background */}
      <LinearGradient
        colors={[secondaryColor, '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Accent color glow */}
      <Animated.View style={[styles.accentGlow, glowStyle]}>
        <LinearGradient
          colors={['transparent', primaryColor + '40']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Floating particles */}
      <Animated.View style={[styles.particles, particleStyle, { opacity: 0.3 * intensityMultiplier }]}>
        {/* Particles would be implemented with actual components in production */}
        <View style={[styles.particle, styles.particle1, { backgroundColor: subjectElements.accent }]} />
        <View style={[styles.particle, styles.particle2, { backgroundColor: primaryColor }]} />
        <View style={[styles.particle, styles.particle3, { backgroundColor: subjectElements.accent }]} />
        <View style={[styles.particle, styles.particle4, { backgroundColor: primaryColor }]} />
        <View style={[styles.particle, styles.particle5, { backgroundColor: subjectElements.accent }]} />
      </Animated.View>
      
      {/* Circuit patterns */}
      <Animated.View style={[styles.circuits, circuitStyle, { opacity: 0.2 * intensityMultiplier }]}>
        <View style={[styles.circuit, styles.circuit1, { backgroundColor: primaryColor }]} />
        <View style={[styles.circuit, styles.circuit2, { backgroundColor: subjectElements.accent }]} />
        <View style={[styles.circuit, styles.circuit3, { backgroundColor: primaryColor }]} />
        <View style={[styles.circuitNode, styles.node1, { backgroundColor: primaryColor }]} />
        <View style={[styles.circuitNode, styles.node2, { backgroundColor: subjectElements.accent }]} />
        <View style={[styles.circuitNode, styles.node3, { backgroundColor: primaryColor }]} />
      </Animated.View>
      
      {/* Subject-specific elements would be added here in a production app */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  accentGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
  particle1: {
    top: '10%',
    left: '20%',
    width: 4,
    height: 4,
  },
  particle2: {
    top: '30%',
    right: '15%',
    width: 6,
    height: 6,
  },
  particle3: {
    bottom: '25%',
    left: '40%',
    width: 3,
    height: 3,
  },
  particle4: {
    bottom: '10%',
    right: '30%',
    width: 5,
    height: 5,
  },
  particle5: {
    top: '50%',
    left: '10%',
    width: 4,
    height: 4,
  },
  circuits: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  circuit: {
    position: 'absolute',
    height: 1,
  },
  circuit1: {
    top: '20%',
    left: '10%',
    width: '30%',
    transform: [{ rotate: '30deg' }],
  },
  circuit2: {
    bottom: '30%',
    right: '5%',
    width: '25%',
    transform: [{ rotate: '-15deg' }],
  },
  circuit3: {
    top: '70%',
    left: '20%',
    width: '40%',
    transform: [{ rotate: '5deg' }],
  },
  circuitNode: {
    position: 'absolute',
    borderRadius: 4,
    width: 4,
    height: 4,
  },
  node1: {
    top: '20%',
    left: '40%',
  },
  node2: {
    bottom: '30%',
    right: '30%',
  },
  node3: {
    top: '70%',
    left: '60%',
  },
});