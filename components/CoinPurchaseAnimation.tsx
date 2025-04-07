import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Coins } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoinPurchaseAnimationProps {
  amount: number;
  bonus: number;
  onComplete: () => void;
}

export default function CoinPurchaseAnimation({
  amount,
  bonus,
  onComplete,
}: CoinPurchaseAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const crateScale = useSharedValue(1);
  const crateRotate = useSharedValue(0);
  const coinsOpacity = useSharedValue(0);
  const coinsScale = useSharedValue(0);

  useEffect(() => {
    // Crate animation
    crateScale.value = withSequence(
      withSpring(1.1, { damping: 2 }),
      withSpring(0.9),
      withSpring(1.1),
      withSpring(0.8, {}, () => {
        // Start coins animation after crate
        coinsOpacity.value = withTiming(1, { duration: 500 });
        coinsScale.value = withSpring(1);
      })
    );

    crateRotate.value = withSequence(
      withSpring(0.1),
      withSpring(-0.1),
      withSpring(0)
    );

    // Fade in main container
    opacity.value = withTiming(1);
    scale.value = withSpring(1);

    // Cleanup animation
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(onComplete)();
      });
    }, 3000);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const crateStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: crateScale.value },
      { rotate: `${crateRotate.value}rad` },
    ],
  }));

  const coinsStyle = useAnimatedStyle(() => ({
    opacity: coinsOpacity.value,
    transform: [{ scale: coinsScale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <ConfettiCannon
        count={50}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart
        fadeOut
        colors={['#FFD700', '#FFA500', '#FF6B6B', '#00FFA9']}
      />

      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.crate, crateStyle]}>
          <Text style={styles.crateText}>🎁</Text>
        </Animated.View>

        <Animated.View style={[styles.coinsContainer, coinsStyle]}>
          <Coins size={48} color="#FFD700" />
          <Text style={styles.coinsAmount}>+{amount}</Text>
          {bonus > 0 && (
            <Text style={styles.bonusText}>+{bonus} Bonus!</Text>
          )}
        </Animated.View>

        <Text style={styles.message}>Your Jungle Coins have arrived!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container: {
    alignItems: 'center',
  },
  crate: {
    marginBottom: 24,
  },
  crateText: {
    fontSize: 64,
  },
  coinsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  coinsAmount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 48,
    color: '#FFD700',
    marginTop: 8,
  },
  bonusText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#00FFA9',
    marginTop: 8,
  },
  message: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});