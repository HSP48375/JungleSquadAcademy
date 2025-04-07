import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
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
import { ChevronRight, Gift } from 'lucide-react-native';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ParticleEffect from '@/components/ParticleEffect';
import GlowingVines from '@/components/GlowingVines';

export default function WelcomeScreen() {
  const { session } = useAuth();
  const { ref } = useLocalSearchParams();
  const [ready, setReady] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(ref as string || null);
  const [showReferralInput, setShowReferralInput] = useState(!ref);
  
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
        
        {referralCode && (
          <Animated.View 
            entering={FadeInDown.delay(1200).duration(500)}
            style={styles.referralBanner}
          >
            <Gift size={24} color="#FFD700" />
            <View>
              <Text style={styles.referralText}>
                You've been invited to join!
              </Text>
              <Text style={styles.referralBonus}>
                5 bonus coins will be added to your account
              </Text>
            </View>
          </Animated.View>
        )}
        
        {showReferralInput && !referralCode && (
          <Animated.View 
            entering={FadeInDown.delay(1400).duration(500)}
            style={styles.referralInputContainer}
          >
            <Text style={styles.referralInputLabel}>Have a referral code?</Text>
            <TextInput
              style={styles.referralInput}
              placeholder="Enter code here (optional)"
              placeholderTextColor="#666666"
              value={referralCode || ''}
              onChangeText={setReferralCode}
            />
          </Animated.View>
        )}
        
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
    marginBottom: 30,
    maxWidth: 300,
  },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    maxWidth: 300,
    gap: 12,
  },
  referralText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  referralBonus: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#FFD700',
  },
  referralInputContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  referralInputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  referralInput: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
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