import { View, Text, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AvatarDisplay from './AvatarDisplay';

interface AvatarOfWeekProps {
  avatar: {
    name: string;
    species: string;
    primaryColor: string;
    secondaryColor: string;
    visualEffects?: any;
    idleAnimation?: string;
  };
  stats: {
    weeklyXp: number;
    activeDays: number;
    tutorsEngaged: number;
  };
}

export default function AvatarOfWeek({ avatar, stats }: AvatarOfWeekProps) {
  const crownStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: withRepeat(
        withSequence(
          withTiming('5deg', { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming('-5deg', { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      ),
    }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    ),
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,215,0,0.2)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <Animated.View style={[styles.crown, crownStyle]}>
        <Crown size={32} color="#FFD700" />
      </Animated.View>

      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={['#FFD700', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.avatarContainer}>
        <AvatarDisplay
          species={avatar.species}
          name={avatar.name}
          primaryColor={avatar.primaryColor}
          secondaryColor={avatar.secondaryColor}
          visualEffects={avatar.visualEffects}
          idleAnimation={avatar.idleAnimation}
          size="large"
        />
      </View>

      <Text style={styles.title}>Avatar of the Week</Text>
      <Text style={styles.stats}>
        {stats.weeklyXp} XP • {stats.activeDays} Day Streak • {stats.tutorsEngaged} Tutors
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  crown: {
    position: 'absolute',
    top: 12,
    zIndex: 10,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  avatarContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stats: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});