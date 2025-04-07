import { View, Text, StyleSheet } from 'react-native';
import { Trophy, MessageSquare, Target } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TutorAchievementBadgeProps {
  xpPoints: number;
  chatMinutes: number;
  challengesCompleted: number;
  showTooltip?: boolean;
}

export default function TutorAchievementBadge({
  xpPoints,
  chatMinutes,
  challengesCompleted,
  showTooltip = false,
}: TutorAchievementBadgeProps) {
  const hasXPAchievement = xpPoints >= 100;
  const hasChatAchievement = chatMinutes >= 30;
  const hasChallengeAchievement = challengesCompleted >= 3;
  const totalAchievements = [hasXPAchievement, hasChatAchievement, hasChallengeAchievement]
    .filter(Boolean).length;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    ),
  }));

  if (totalAchievements === 0) return null;

  return (
    <Animated.View style={[styles.container, glowStyle]}>
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        style={styles.badge}
      >
        <View style={styles.iconContainer}>
          {totalAchievements === 3 ? (
            <Trophy size={16} color="#FFD700" />
          ) : (
            <Text style={styles.achievementCount}>{totalAchievements}</Text>
          )}
        </View>
      </LinearGradient>

      {showTooltip && (
        <View style={styles.tooltip}>
          {hasXPAchievement && (
            <View style={styles.achievementRow}>
              <Trophy size={12} color="#FFD700" />
              <Text style={styles.tooltipText}>Master Level Reached!</Text>
            </View>
          )}
          {hasChatAchievement && (
            <View style={styles.achievementRow}>
              <MessageSquare size={12} color="#00FFA9" />
              <Text style={styles.tooltipText}>Chat Champion</Text>
            </View>
          )}
          {hasChallengeAchievement && (
            <View style={styles.achievementRow}>
              <Target size={12} color="#FF69B4" />
              <Text style={styles.tooltipText}>Challenge Conqueror</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  tooltip: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 8,
    width: 160,
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  tooltipText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
});