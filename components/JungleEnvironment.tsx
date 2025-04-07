import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface JungleEnvironmentProps {
  theme?: 'default' | 'math' | 'history' | 'language' | 'science' | 'art' | 'tech';
  intensity?: 'low' | 'medium' | 'high';
  focusMode?: boolean;
}

export default function JungleEnvironment({
  theme = 'default',
  intensity = 'medium',
  focusMode = false,
}: JungleEnvironmentProps) {
  // Animation values
  const fogOpacity = useSharedValue(0.2);
  const glowIntensity = useSharedValue(0.5);
  const particleOpacity = useSharedValue(0.3);
  const vineMovement = useSharedValue(0);
  const circuitPulse = useSharedValue(0.2);
  
  // Get theme colors based on theme
  const getThemeColors = () => {
    switch (theme) {
      case 'math':
        return {
          primary: '#00FFFF',
          secondary: '#0088FF',
          accent: '#FF00FF',
          gradient: ['#1A0B2E', '#0F172A', '#0A0A0A'],
        };
      case 'history':
        return {
          primary: '#FF00FF',
          secondary: '#8800FF',
          accent: '#FFAA00',
          gradient: ['#2E0B2E', '#1F0F2A', '#0A0A0A'],
        };
      case 'language':
        return {
          primary: '#FFFF00',
          secondary: '#FF8800',
          accent: '#00FFAA',
          gradient: ['#2E1A0B', '#2A1F0F', '#0A0A0A'],
        };
      case 'science':
        return {
          primary: '#00FF00',
          secondary: '#00FFAA',
          accent: '#88FFFF',
          gradient: ['#0B2E0B', '#0F2A1F', '#0A0A0A'],
        };
      case 'art':
        return {
          primary: '#FF00AA',
          secondary: '#FF00FF',
          accent: '#FFFF00',
          gradient: ['#2E0B1A', '#2A0F1F', '#0A0A0A'],
        };
      case 'tech':
        return {
          primary: '#00AAFF',
          secondary: '#0066FF',
          accent: '#FF00AA',
          gradient: ['#0B1A2E', '#0F1F2A', '#0A0A0A'],
        };
      default:
        return {
          primary: '#00FFA9',
          secondary: '#00AAFF',
          accent: '#FF00FF',
          gradient: ['#1A0B2E', '#0F172A', '#0A0A0A'],
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
        withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Particle animation
    particleOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Vine movement animation
    vineMovement.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 6000, easing: Easing.inOut(Easing.sine) }),
        withTiming(-5, { duration: 6000, easing: Easing.inOut(Easing.sine) })
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
  const fogStyle = useAnimatedStyle(() => ({
    opacity: fogOpacity.value * (focusMode ? 0.5 : 1),
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * (focusMode ? 0.5 : 1),
  }));
  
  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value * (focusMode ? 0.5 : 1),
  }));
  
  const vineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: vineMovement.value }],
    opacity: 0.7 * (focusMode ? 0.5 : 1),
  }));
  
  const circuitStyle = useAnimatedStyle(() => ({
    opacity: circuitPulse.value * (focusMode ? 0.5 : 1),
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
        colors={colors.gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Ambient fog layer */}
      <Animated.View style={[styles.fogLayer, fogStyle, { opacity: 0.2 * intensityMultiplier }]}>
        <LinearGradient
          colors={['transparent', colors.primary + '20', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      
      {/* Glowing orbs */}
      <Animated.View style={[styles.glowingOrbs, glowStyle, { opacity: 0.5 * intensityMultiplier }]}>
        <View style={[styles.orb, { backgroundColor: colors.primary + '40' }]} />
        <View style={[styles.orb, styles.orb2, { backgroundColor: colors.secondary + '40' }]} />
        <View style={[styles.orb, styles.orb3, { backgroundColor: colors.accent + '40' }]} />
      </Animated.View>
      
      {/* Tech vines */}
      <Animated.View style={[styles.techVines, vineStyle, { opacity: 0.6 * intensityMultiplier }]}>
        <View style={[styles.vine, { backgroundColor: colors.primary + '30' }]}>
          <View style={[styles.vineNode, { backgroundColor: colors.primary }]} />
          <View style={[styles.vineNode, styles.vineNode2, { backgroundColor: colors.primary }]} />
        </View>
        <View style={[styles.vine, styles.vine2, { backgroundColor: colors.secondary + '30' }]}>
          <View style={[styles.vineNode, { backgroundColor: colors.secondary }]} />
          <View style={[styles.vineNode, styles.vineNode2, { backgroundColor: colors.secondary }]} />
        </View>
      </Animated.View>
      
      {/* Circuit patterns */}
      <Animated.View style={[styles.circuits, circuitStyle, { opacity: 0.2 * intensityMultiplier }]}>
        <View style={[styles.circuit, { backgroundColor: colors.primary }]} />
        <View style={[styles.circuit, styles.circuit2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.circuit, styles.circuit3, { backgroundColor: colors.accent }]} />
        <View style={[styles.circuitNode, { backgroundColor: colors.primary }]} />
        <View style={[styles.circuitNode, styles.circuitNode2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.circuitNode, styles.circuitNode3, { backgroundColor: colors.accent }]} />
      </Animated.View>
      
      {/* Floating particles */}
      <Animated.View style={[styles.particles, particleStyle, { opacity: 0.3 * intensityMultiplier }]}>
        <View style={[styles.particle, { backgroundColor: colors.primary }]} />
        <View style={[styles.particle, styles.particle2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.particle, styles.particle3, { backgroundColor: colors.accent }]} />
        <View style={[styles.particle, styles.particle4, { backgroundColor: colors.primary }]} />
        <View style={[styles.particle, styles.particle5, { backgroundColor: colors.secondary }]} />
        <View style={[styles.particle, styles.particle6, { backgroundColor: colors.accent }]} />
        <View style={[styles.particle, styles.particle7, { backgroundColor: colors.primary }]} />
        <View style={[styles.particle, styles.particle8, { backgroundColor: colors.secondary }]} />
      </Animated.View>
      
      {/* Bioluminescent mushrooms */}
      <View style={[styles.mushrooms, { opacity: 0.6 * intensityMultiplier }]}>
        <View style={[styles.mushroom, { backgroundColor: colors.primary + '60' }]}>
          <View style={[styles.mushroomGlow, { backgroundColor: colors.primary + '30' }]} />
        </View>
        <View style={[styles.mushroom, styles.mushroom2, { backgroundColor: colors.secondary + '60' }]}>
          <View style={[styles.mushroomGlow, { backgroundColor: colors.secondary + '30' }]} />
        </View>
        <View style={[styles.mushroom, styles.mushroom3, { backgroundColor: colors.accent + '60' }]}>
          <View style={[styles.mushroomGlow, { backgroundColor: colors.accent + '30' }]} />
        </View>
      </View>
      
      {/* Holographic data glyphs */}
      <View style={[styles.dataGlyphs, { opacity: 0.4 * intensityMultiplier }]}>
        <View style={[styles.glyph, { borderColor: colors.primary + '80' }]} />
        <View style={[styles.glyph, styles.glyph2, { borderColor: colors.secondary + '80' }]} />
        <View style={[styles.glyph, styles.glyph3, { borderColor: colors.accent + '80' }]} />
      </View>
      
      {/* Overlay for focus mode */}
      {focusMode && (
        <View style={styles.focusOverlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  fogLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  glowingOrbs: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  orb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: '5%',
    left: '10%',
    opacity: 0.6,
    ...Platform.select({
      web: {
        filter: 'blur(40px)',
      },
    }),
  },
  orb2: {
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '40%',
    right: '-5%',
    opacity: 0.4,
  },
  orb3: {
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: '10%',
    left: '30%',
    opacity: 0.5,
  },
  techVines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  vine: {
    position: 'absolute',
    width: 3,
    height: 200,
    left: '15%',
    top: '10%',
    borderRadius: 2,
  },
  vine2: {
    right: '20%',
    left: 'auto',
    top: '30%',
    height: 150,
  },
  vineNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: '30%',
    left: -2.5,
  },
  vineNode2: {
    top: '70%',
  },
  circuits: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  circuit: {
    position: 'absolute',
    height: 1,
    width: SCREEN_WIDTH * 0.3,
    top: '25%',
    left: '5%',
    transform: [{ rotate: '30deg' }],
  },
  circuit2: {
    width: SCREEN_WIDTH * 0.4,
    top: '45%',
    right: '10%',
    transform: [{ rotate: '-20deg' }],
  },
  circuit3: {
    width: SCREEN_WIDTH * 0.25,
    bottom: '15%',
    left: '20%',
    transform: [{ rotate: '10deg' }],
  },
  circuitNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '25%',
    left: '5%',
  },
  circuitNode2: {
    top: '45%',
    right: '10%',
    left: 'auto',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circuitNode3: {
    bottom: '15%',
    left: '20%',
    top: 'auto',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    top: '15%',
    left: '25%',
  },
  particle2: {
    width: 4,
    height: 4,
    borderRadius: 2,
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
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
  particle6: {
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '75%',
    right: '25%',
  },
  particle7: {
    width: 2,
    height: 2,
    borderRadius: 1,
    top: '5%',
    right: '45%',
  },
  particle8: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    bottom: '5%',
    left: '55%',
  },
  mushrooms: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  mushroom: {
    position: 'absolute',
    width: 30,
    height: 25,
    borderRadius: 15,
    bottom: '5%',
    left: '10%',
  },
  mushroom2: {
    width: 40,
    height: 35,
    borderRadius: 20,
    bottom: '7%',
    left: '25%',
  },
  mushroom3: {
    width: 25,
    height: 20,
    borderRadius: 12.5,
    bottom: '6%',
    left: '40%',
  },
  mushroomGlow: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    borderRadius: 100,
    top: '-50%',
    left: '-50%',
    opacity: 0.5,
    ...Platform.select({
      web: {
        filter: 'blur(20px)',
      },
    }),
  },
  dataGlyphs: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  glyph: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 5,
    top: '30%',
    right: '20%',
    transform: [{ rotate: '45deg' }],
  },
  glyph2: {
    width: 20,
    height: 20,
    top: '50%',
    left: '15%',
    transform: [{ rotate: '30deg' }],
  },
  glyph3: {
    width: 25,
    height: 25,
    bottom: '20%',
    right: '30%',
    transform: [{ rotate: '15deg' }],
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});