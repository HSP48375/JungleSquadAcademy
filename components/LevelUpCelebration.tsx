import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';

interface LevelUpCelebrationProps {
  level: number;
  tutorName: string;
  tutorImage: string;
  onClaimReward: () => void;
  onClose: () => void;
}

export default function LevelUpCelebration({
  level,
  tutorName,
  tutorImage,
  onClaimReward,
  onClose,
}: LevelUpCelebrationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const badgeRotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.1),
      withSpring(1)
    );
    opacity.value = withTiming(1);
    badgeRotate.value = withSequence(
      withSpring(0.2),
      withSpring(-0.2),
      withSpring(0)
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${badgeRotate.value}rad` }],
  }));

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,255,169,0.2)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <ConfettiCannon
        count={100}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart
        fadeOut
        colors={['#00FFA9', '#FFD700', '#FF69B4', '#7B68EE']}
      />

      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.badge, badgeStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.badgeGradient}
          >
            <Trophy size={48} color="#FFFFFF" />
            <Text style={styles.levelText}>Level {level}</Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.tutorContainer}>
          <Image
            source={{ uri: tutorImage }}
            style={styles.tutorImage}
          />
          <View style={styles.messageContainer}>
            <Text style={styles.tutorName}>{tutorName}</Text>
            <Text style={styles.message}>
              "Incredible progress! You're mastering these skills like a true champion!"
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.claimButton}
          onPress={onClaimReward}
        >
          <Text style={styles.claimText}>Claim Level Reward</Text>
          <View style={styles.rewardBadge}>
            <Coins size={16} color="#000000" />
            <Text style={styles.rewardText}>+2</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFA9',
  },
  badge: {
    marginBottom: 24,
  },
  badgeGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  levelText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 8,
  },
  tutorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  tutorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00FFA9',
  },
  messageContainer: {
    flex: 1,
    marginLeft: 16,
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
    marginBottom: 4,
  },
  message: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  claimButton: {
    backgroundColor: '#00FFA9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  claimText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#000000',
    marginRight: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
    marginLeft: 4,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
});