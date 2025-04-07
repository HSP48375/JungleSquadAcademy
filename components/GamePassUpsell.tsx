import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Zap, Trophy, Lock, Coins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { router } from 'expo-router';

interface GamePassUpsellProps {
  onClose: () => void;
}

export default function GamePassUpsell({ onClose }: GamePassUpsellProps) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    // Initial entrance animation
    scale.value = withSpring(1, { damping: 12 });

    // Continuous animations
    rotation.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(-0.1, { duration: 2000, easing: Easing.inOut(Easing.sine) })
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
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}rad` },
      { scale: withSpring(1 + glow.value * 0.1) },
    ],
  }));

  const handleSubscribe = () => {
    router.push('/subscription');
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,255,169,0.2)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.modal, containerStyle]}>
        <Animated.View style={[styles.crownContainer, crownStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.crownGradient}
          >
            <Crown size={64} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>Level Up Your Learning!</Text>
        <Text style={styles.subtitle}>
          Join the elite squad of jungle explorers
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <Coins size={24} color="#FFD700" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Unlimited Coins</Text>
              <Text style={styles.featureDesc}>Never run out of plays</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Lock size={24} color="#00FFA9" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>All Premium Games</Text>
              <Text style={styles.featureDesc}>Access every challenge</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Zap size={24} color="#FF69B4" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Power-Ups & Boosters</Text>
              <Text style={styles.featureDesc}>Accelerate your progress</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Trophy size={24} color="#7B68EE" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Exclusive Rewards</Text>
              <Text style={styles.featureDesc}>Special achievements & badges</Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.priceLabel}>Just</Text>
          <Text style={styles.price}>$9.99</Text>
          <Text style={styles.period}>/month</Text>
        </View>

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
        >
          <LinearGradient
            colors={['#00FFA9', '#00CC88']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Crown size={24} color="#000000" />
            <Text style={styles.buttonText}>Become a Game Pass Member</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Maybe Later</Text>
        </TouchableOpacity>

        <Text style={styles.guarantee}>
          7-day money-back guarantee • Cancel anytime
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFA9',
    shadowColor: '#00FFA9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  crownContainer: {
    marginBottom: 24,
  },
  crownGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureTextContainer: {
    marginLeft: 16,
  },
  featureTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  featureDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  priceLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 20,
    color: '#666666',
    marginRight: 8,
  },
  price: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 48,
    color: '#00FFA9',
  },
  period: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 20,
    color: '#666666',
    marginLeft: 4,
  },
  subscribeButton: {
    width: '100%',
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  buttonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#000000',
    marginLeft: 12,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
  guarantee: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
});