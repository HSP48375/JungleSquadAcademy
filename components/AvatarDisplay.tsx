import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarDisplayProps {
  species: string;
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  visualEffects?: {
    wings?: string;
    feathers?: string;
    body?: string;
    skin?: string;
    armor?: string;
    circuits?: string;
    overlay?: string;
    aura?: string;
    eyes?: string;
    accessory?: string;
  };
  idleAnimation?: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  subject?: string;
}

// Map of species to their cyberpunk-jungle themed images
const SPECIES_IMAGES = {
  'Tiger': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=400&auto=format&fit=crop',
  'Monkey': 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=400&auto=format&fit=crop',
  'Zebra': 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?q=80&w=400&auto=format&fit=crop',
  'Elephant': 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?q=80&w=400&auto=format&fit=crop',
  'Lemur': 'https://images.unsplash.com/photo-1606574977100-16c8c0365d33?q=80&w=400&auto=format&fit=crop',
  'Giraffe': 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?q=80&w=400&auto=format&fit=crop',
  'Butterfly': 'https://images.unsplash.com/photo-1595873520615-67e8c98db5d1?q=80&w=400&auto=format&fit=crop',
  'Lion': 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=400&auto=format&fit=crop',
  'Rhino': 'https://images.unsplash.com/photo-1584844115436-473eb4a4de8b?q=80&w=400&auto=format&fit=crop',
  'Raccoon': 'https://images.unsplash.com/photo-1606574977100-16c8c0365d33?q=80&w=400&auto=format&fit=crop',
  // Legendary species
  'Phoenix Macaw': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?q=80&w=400&auto=format&fit=crop',
  'Shadow Jaguar': 'https://images.unsplash.com/photo-1552410260-0fd9b577afa6?q=80&w=400&auto=format&fit=crop',
  'Crystal Gecko': 'https://images.unsplash.com/photo-1591634616938-1dfa7ee2e617?q=80&w=400&auto=format&fit=crop',
  'Mecha Sloth': 'https://images.unsplash.com/photo-1577936256941-0f15b400ee95?q=80&w=400&auto=format&fit=crop',
  'Galactic Chameleon': 'https://images.unsplash.com/photo-1581224463294-908316c5237f?q=80&w=400&auto=format&fit=crop'
};

// Map of subjects to their themed accessories
const SUBJECT_ACCESSORIES = {
  'Mathematics': {
    name: 'Holographic Calculator',
    color: '#00FFFF'
  },
  'History & Geography': {
    name: 'Time-Space Compass',
    color: '#FF00FF'
  },
  'Language Arts': {
    name: 'Quantum Quill',
    color: '#FFFF00'
  },
  'Science': {
    name: 'Molecular Scanner',
    color: '#00FF00'
  },
  'Art & Creativity': {
    name: 'Neural Paintbrush',
    color: '#FF00AA'
  },
  'Technology': {
    name: 'Holographic Interface',
    color: '#00AAFF'
  },
  'Music': {
    name: 'Sonic Amplifier',
    color: '#AA00FF'
  },
  'Life Skills': {
    name: 'Augmented Reality Lens',
    color: '#FFAA00'
  },
  'Social & Emotional Learning': {
    name: 'Empathy Resonator',
    color: '#FF5500'
  },
  'Language Learning': {
    name: 'Universal Translator',
    color: '#55FFAA'
  }
};

export default function AvatarDisplay({
  species,
  name,
  primaryColor,
  secondaryColor = '#333333',
  visualEffects,
  idleAnimation,
  size = 'medium',
  showName = true,
  subject
}: AvatarDisplayProps) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.6);
  const accessoryGlow = useSharedValue(0.5);
  const eyeGlow = useSharedValue(0.7);

  useEffect(() => {
    // Different animations for different species and animation types
    switch (idleAnimation) {
      case 'wings_flap_with_embers':
        rotate.value = withRepeat(
          withSequence(
            withTiming(0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
            withTiming(-0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
        glow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.3, { duration: 1500 })
          ),
          -1,
          true
        );
        break;
      case 'ghost_shimmer_tail_flick':
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
            withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
        break;
      case 'color_shift_glow':
        glow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2000 }),
            withTiming(0.3, { duration: 2000 })
          ),
          -1,
          true
        );
        break;
      case 'xp_bar_charge':
        scale.value = withRepeat(
          withSequence(
            withSpring(1.05),
            withSpring(1)
          ),
          -1,
          true
        );
        accessoryGlow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0.5, { duration: 1000 })
          ),
          -1,
          true
        );
        break;
      case 'cosmic_fade_pulse':
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 3000 }),
            withTiming(0.8, { duration: 3000 })
          ),
          -1,
          true
        );
        eyeGlow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.5, { duration: 1500 })
          ),
          -1,
          true
        );
        break;
      default:
        // Default gentle floating animation
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
            withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
    }
  }, [idleAnimation]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}rad` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const accessoryStyle = useAnimatedStyle(() => ({
    opacity: accessoryGlow.value,
  }));

  const eyesStyle = useAnimatedStyle(() => ({
    opacity: eyeGlow.value,
  }));

  // Get the appropriate image URL based on species
  const imageUrl = SPECIES_IMAGES[species as keyof typeof SPECIES_IMAGES] || SPECIES_IMAGES['Tiger'];
  
  // Get accessory based on subject
  const accessory = subject ? SUBJECT_ACCESSORIES[subject as keyof typeof SUBJECT_ACCESSORIES] : null;

  // Determine if this is a legendary species
  const isLegendary = ['Phoenix Macaw', 'Shadow Jaguar', 'Crystal Gecko', 'Mecha Sloth', 'Galactic Chameleon'].includes(species);

  return (
    <View style={[styles.container, styles[size]]}>
      <Animated.View style={[styles.avatarContainer, containerStyle]}>
        {/* Base gradient background */}
        <LinearGradient
          colors={[primaryColor, secondaryColor || '#333333']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        />
        
        {/* Cyberpunk overlay effect */}
        <Animated.View style={[styles.cyberpunkOverlay, pulseStyle]}>
          <LinearGradient
            colors={['transparent', primaryColor + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Character image */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
        />

        {/* Glowing eyes effect */}
        {isLegendary && (
          <Animated.View style={[styles.eyesEffect, eyesStyle]}>
            <LinearGradient
              colors={[primaryColor + '00', primaryColor]}
              style={styles.eyesGradient}
            />
          </Animated.View>
        )}

        {/* Subject-specific accessory */}
        {accessory && (
          <Animated.View style={[styles.accessory, accessoryStyle]}>
            <LinearGradient
              colors={['transparent', accessory.color]}
              style={styles.accessoryGradient}
            />
          </Animated.View>
        )}

        {/* Special effects for legendary species */}
        {isLegendary && visualEffects?.overlay && (
          <Animated.View style={[styles.legendaryEffect, glowStyle]}>
            <LinearGradient
              colors={['transparent', primaryColor + '80']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {/* Tech circuit patterns */}
        <View style={styles.circuitPatterns} />
      </Animated.View>

      {showName && (
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{name}</Text>
          {species && <Text style={[styles.species, { color: primaryColor }]}>{species}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  small: {
    width: 50,
    height: 50,
  },
  medium: {
    width: 100,
    height: 100,
  },
  large: {
    width: 150,
    height: 150,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(0, 255, 169, 0.5)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
      },
    }),
  },
  avatarGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  cyberpunkOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    zIndex: 1,
  },
  eyesEffect: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    right: '25%',
    height: '15%',
    zIndex: 3,
    opacity: 0.7,
  },
  eyesGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  accessory: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '40%',
    height: '40%',
    zIndex: 4,
    opacity: 0.8,
  },
  accessoryGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  legendaryEffect: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
    zIndex: 5,
  },
  circuitPatterns: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    opacity: 0.2,
    // Circuit pattern would be implemented with SVG in a production app
  },
  nameContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  name: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  species: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});