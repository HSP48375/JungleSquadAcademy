import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Coins } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RewardAnimationProps {
  coins: number;
  xp: number;
  onComplete: () => void;
}

export default function RewardAnimation({ coins, xp, onComplete }: RewardAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, {}, () => {
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 }, () => {
          runOnJS(onComplete)();
        });
      }, 2000);
    });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={styles.overlay}>
      <ConfettiCannon
        count={50}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart
        fadeOut
        colors={['#00FFA9', '#FFD700', '#FF69B4', '#7B68EE']}
      />
      
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={styles.rewardRow}>
          <Coins size={32} color="#FFD700" />
          <Text style={styles.rewardText}>+{coins}</Text>
        </View>
        
        <View style={styles.rewardRow}>
          <Text style={styles.xpText}>+{xp} XP</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00FFA9',
    alignItems: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFD700',
    marginLeft: 12,
  },
  xpText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#00FFA9',
  },
});