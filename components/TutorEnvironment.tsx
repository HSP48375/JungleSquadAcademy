import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorEnvironmentProps {
  subject: string;
  theme?: 'jungle-lab' | 'neon-studio' | 'tech-nest' | 'data-forest' | 'quantum-library';
  intensity?: 'low' | 'medium' | 'high';
}

export default function TutorEnvironment({
  subject,
  theme = 'jungle-lab',
  intensity = 'medium',
}: TutorEnvironmentProps) {
  // Animation values
  const fogOpacity = useSharedValue(0.2);
  const glowIntensity = useSharedValue(0.5);
  const elementMovement = useSharedValue(0);
  
  // Get theme colors based on subject
  const getThemeColors = () => {
    switch (subject) {
      case 'Mathematics':
        return {
          primary: '#00FFFF',
          secondary: '#0088FF',
          accent: '#FF00FF',
        };
      case 'History & Geography':
        return {
          primary: '#FF00FF',
          secondary: '#8800FF',
          accent: '#FFAA00',
        };
      case 'Language Arts':
        return {
          primary: '#FFFF00',
          secondary: '#FF8800',
          accent: '#00FFAA',
        };
      case 'Science':
        return {
          primary: '#00FF00',
          secondary: '#00FFAA',
          accent: '#88FFFF',
        };
      case 'Art & Creativity':
        return {
          primary: '#FF00AA',
          secondary: '#FF00FF',
          accent: '#FFFF00',
        };
      default:
        return {
          primary: '#00FFA9',
          secondary: '#00AAFF',
          accent: '#FF00FF',
        };
    }
  };
  
  const colors = getThemeColors();
  
  // Set up animations
  useEffect(() => {
    // Fog animation
    fogOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 5000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.1, { duration: 5000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Glow animation
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.4, { duration: 3000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Element movement animation
    elementMovement.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
        withTiming(-5, { duration: 4000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const fogStyle = useAnimatedStyle(() => ({
    opacity: fogOpacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));
  
  const elementStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: elementMovement.value }],
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
  
  // Theme-specific elements
  const renderThemeElements = () => {
    switch (theme) {
      case 'neon-studio':
        return (
          <>
            <View style={[styles.neonSign, { borderColor: colors.primary }]} />
            <View style={[styles.workstation, { backgroundColor: colors.secondary + '30' }]} />
          </>
        );
      case 'tech-nest':
        return (
          <>
            <View style={[styles.nestPlatform, { backgroundColor: colors.secondary + '30' }]} />
            <View style={[styles.techPillar, { backgroundColor: colors.primary + '20' }]} />
          </>
        );
      case 'data-forest':
        return (
          <>
            <View style={[styles.dataTree, { backgroundColor: colors.secondary + '20' }]} />
            <View style={[styles.dataTree, styles.dataTree2, { backgroundColor: colors.primary + '20' }]} />
          </>
        );
      case 'quantum-library':
        return (
          <>
            <View style={[styles.bookshelf, { backgroundColor: colors.secondary + '30' }]} />
            <View style={[styles.floatingBook, { backgroundColor: colors.primary + '40' }]} />
          </>
        );
      default: // jungle-lab
        return (
          <>
            <View style={[styles.labTable, { backgroundColor: colors.secondary + '30' }]} />
            <View style={[styles.glowingPlant, { backgroundColor: colors.primary + '20' }]} />
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Base gradient background */}
      <LinearGradient
        colors={['#1A0B2E', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Ambient fog */}
      <Animated.View style={[styles.ambientFog, fogStyle, { opacity: 0.2 * intensityMultiplier }]}>
        <LinearGradient
          colors={['transparent', colors.primary + '30', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Glowing elements */}
      <Animated.View style={[styles.glowingElements, glowStyle, { opacity: 0.5 * intensityMultiplier }]}>
        <View style={[styles.glowOrb, { backgroundColor: colors.primary + '50' }]} />
        <View style={[styles.glowOrb, styles.glowOrb2, { backgroundColor: colors.secondary + '50' }]} />
        <View style={[styles.glowOrb, styles.glowOrb3, { backgroundColor: colors.accent + '50' }]} />
      </Animated.View>
      
      {/* Data circuits */}
      <View style={[styles.dataCircuits, { opacity: 0.15 * intensityMultiplier }]}>
        <View style={[styles.circuit, { backgroundColor: colors.primary }]} />
        <View style={[styles.circuit, styles.circuit2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.circuit, styles.circuit3, { backgroundColor: colors.accent }]} />
        <View style={[styles.circuitNode, { backgroundColor: colors.primary }]} />
        <View style={[styles.circuitNode, styles.circuitNode2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.circuitNode, styles.circuitNode3, { backgroundColor: colors.accent }]} />
      </View>
      
      {/* Floating elements */}
      <Animated.View style={[styles.floatingElements, elementStyle, { opacity: 0.7 * intensityMultiplier }]}>
        {renderThemeElements()}
      </Animated.View>
      
      {/* Particle effects */}
      <View style={[styles.particles, { opacity: 0.3 * intensityMultiplier }]}>
        <View style={[styles.particle, { backgroundColor: colors.primary }]} />
        <View style={[styles.particle, styles.particle2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.particle, styles.particle3, { backgroundColor: colors.accent }]} />
        <View style={[styles.particle, styles.particle4, { backgroundColor: colors.primary }]} />
        <View style={[styles.particle, styles.particle5, { backgroundColor: colors.secondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientFog: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  glowingElements: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  glowOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: '10%',
    left: '10%',
    opacity: 0.6,
  },
  glowOrb2: {
    top: '60%',
    right: '5%',
    width: 150,
    height: 150,
    opacity: 0.4,
  },
  glowOrb3: {
    bottom: '10%',
    left: '30%',
    width: 80,
    height: 80,
    opacity: 0.5,
  },
  dataCircuits: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  circuit: {
    position: 'absolute',
    height: 1,
    width: SCREEN_WIDTH * 0.3,
    top: '30%',
    left: '5%',
    transform: [{ rotate: '30deg' }],
  },
  circuit2: {
    width: SCREEN_WIDTH * 0.4,
    top: '50%',
    right: '10%',
    transform: [{ rotate: '-20deg' }],
  },
  circuit3: {
    width: SCREEN_WIDTH * 0.25,
    bottom: '20%',
    left: '20%',
    transform: [{ rotate: '10deg' }],
  },
  circuitNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '30%',
    left: '5%',
  },
  circuitNode2: {
    top: '50%',
    right: '10%',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circuitNode3: {
    bottom: '20%',
    left: '20%',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  floatingElements: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    top: '15%',
    left: '25%',
  },
  particle2: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    top: '35%',
    right: '15%',
  },
  particle3: {
    width: 2,
    height: 2,
    borderRadius: 1,
    bottom: '25%',
    left: '40%',
  },
  particle4: {
    width: 4,
    height: 4,
    borderRadius: 2,
    bottom: '15%',
    right: '35%',
  },
  particle5: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    top: '55%',
    left: '15%',
  },
  // Theme-specific elements
  labTable: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: 10,
    bottom: '15%',
    alignSelf: 'center',
    borderRadius: 5,
  },
  glowingPlant: {
    position: 'absolute',
    width: 40,
    height: 60,
    bottom: '25%',
    right: '20%',
    borderRadius: 5,
  },
  neonSign: {
    position: 'absolute',
    width: 100,
    height: 40,
    top: '20%',
    right: '10%',
    borderWidth: 2,
    borderRadius: 5,
  },
  workstation: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.6,
    height: 15,
    bottom: '20%',
    alignSelf: 'center',
    borderRadius: 5,
  },
  nestPlatform: {
    position: 'absolute',
    width: 120,
    height: 120,
    bottom: '10%',
    alignSelf: 'center',
    borderRadius: 60,
  },
  techPillar: {
    position: 'absolute',
    width: 30,
    height: 100,
    bottom: '30%',
    right: '30%',
    borderRadius: 5,
  },
  dataTree: {
    position: 'absolute',
    width: 40,
    height: 120,
    bottom: '10%',
    left: '20%',
    borderRadius: 5,
  },
  dataTree2: {
    width: 30,
    height: 90,
    bottom: '10%',
    right: '25%',
  },
  bookshelf: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: 100,
    bottom: '10%',
    alignSelf: 'center',
    borderRadius: 5,
  },
  floatingBook: {
    position: 'absolute',
    width: 40,
    height: 30,
    top: '40%',
    left: '30%',
    borderRadius: 3,
  },
});