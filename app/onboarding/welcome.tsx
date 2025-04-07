import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ParticleEffect from '@/components/ParticleEffect';
import GlowingVines from '@/components/GlowingVines';

export default function WelcomeScreen() {
  const { session } = useAuth();
  const [ready, setReady] = useState(false);
  
  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Sequence the animations
    setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
      logoScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
      
      titleOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
      subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
      
      buttonOpacity.value = withDelay(1500, withTiming(1, { duration: 800 }));
      buttonScale.value = withDelay(1500, withTiming(1, { duration: 800, easing: Easing.out(Easing.back) }));
      
      setReady(true);
    }, 300);
  }, []);
  
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));
  
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));
  
  const handleContinue = () => {
    router.push('/onboarding/avatar');
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="high" />
      <ParticleEffect count={40} intensity="high" />
      <GlowingVines count={10} intensity="high" />
      
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <LinearGradient
            colors={['#00FFA9', '#00AAFF']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>JS</Text>
          </LinearGradient>
        </Animated.View>
        
        <Animated.Text style={[styles.title, titleStyle]}>
          Welcome to Jungle Squad Academy
        </Animated.Text>
        
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          The World's Most Advanced AI Tutoring Ecosystem
        </Animated.Text>
        
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            disabled={!ready}
          >
            <LinearGradient
              colors={['#00FFA9', '#00AAFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.buttonText}>Begin Your Journey</Text>
            <ChevronRight size={24} color="#000000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 40,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(0, 255, 169, 0.5)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    color: '#000000',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#00FFA9',
    textAlign: 'center',
    marginBottom: 60,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 255, 169, 0.4)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  buttonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#000000',
    marginRight: 8,
  },
});