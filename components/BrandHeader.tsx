import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  Easing
} from 'react-native-reanimated';

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  showGlow?: boolean;
}

export default function BrandHeader({ title, subtitle, showGlow = true }: BrandHeaderProps) {
  // Glow animation
  const glowOpacity = useSharedValue(0.5);
  
  // Set up animation
  if (showGlow) {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#0F172A']}
        style={styles.background}
      />
      
      {showGlow && (
        <Animated.View style={[styles.glow, glowStyle]} />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#00FFA9',
    top: -50,
    right: -50,
    opacity: 0.5,
    blur: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: subtitle ? 8 : 0,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#B794F6',
  },
});