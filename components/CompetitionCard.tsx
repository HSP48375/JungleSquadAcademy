import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Target, Users, Coins } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';
import CompetitionCountdown from './CompetitionCountdown';

interface CompetitionCardProps {
  id: string;
  title: string;
  description: string;
  subject: string;
  startDate: string;
  endDate: string;
  hasLeaderboard: boolean;
  participationThreshold: number;
  participationReward: number;
  isParticipating: boolean;
  progress?: {
    totalXp: number;
    challengesCompleted: number;
  };
  onJoin: () => void;
  onPress: () => void;
}

export default function CompetitionCard({
  id,
  title,
  description,
  subject,
  startDate,
  endDate,
  hasLeaderboard,
  participationThreshold,
  participationReward,
  isParticipating,
  progress,
  onJoin,
  onPress,
}: CompetitionCardProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const cardScale = useSharedValue(1);
  
  // Set up animations
  useEffect(() => {
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  // Get subject-specific colors
  const getSubjectColors = () => {
    switch (subject) {
      case 'Mathematics':
        return ['#00FFFF', '#0088FF'];
      case 'History & Geography':
        return ['#FF00FF', '#8800FF'];
      case 'Language Arts':
        return ['#FFFF00', '#FF8800'];
      case 'Science':
        return ['#00FF00', '#00FFAA'];
      case 'Art & Creativity':
        return ['#FF00AA', '#FF00FF'];
      case 'Technology':
        return ['#00AAFF', '#0066FF'];
      default:
        return ['#00FFA9', '#00AAFF'];
    }
  };
  
  const colors = getSubjectColors();
  
  // Calculate progress percentage
  const progressPercent = progress && participationThreshold
    ? Math.min((progress.challengesCompleted / participationThreshold) * 100, 100)
    : 0;

  return (
    <GlassmorphicCard
      glowColor={colors[0]}
      intensity="medium"
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.subject, { color: colors[0] }]}>{subject}</Text>
          </View>
          
          {hasLeaderboard && (
            <View style={styles.leaderboardBadge}>
              <Trophy size={16} color="#FFD700" />
              <Text style={styles.leaderboardText}>Leaderboard</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.countdownContainer}>
          <CompetitionCountdown endDate={endDate} />
        </View>
        
        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Star size={16} color="#00FFA9" />
            <Text style={styles.rewardText}>
              {participationReward} XP Participation Bonus
            </Text>
          </View>
          
          <View style={styles.rewardItem}>
            <Target size={16} color="#00FFA9" />
            <Text style={styles.rewardText}>
              Complete {participationThreshold} challenges
            </Text>
          </View>
          
          {hasLeaderboard && (
            <View style={styles.rewardItem}>
              <Coins size={16} color="#FFD700" />
              <Text style={styles.rewardText}>Top 3 earn bonus coins!</Text>
            </View>
          )}
        </View>
        
        {isParticipating && progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: colors[0] }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.challengesCompleted}/{participationThreshold} Challenges
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.participateButton,
            isParticipating && styles.participatingButton
          ]}
          onPress={onJoin}
        >
          <Users size={20} color={isParticipating ? '#000000' : '#FFFFFF'} />
          <Text
            style={[
              styles.participateText,
              isParticipating && styles.participatingText
            ]}
          >
            {isParticipating ? 'Participating' : 'Join Competition'}
          </Text>
        </TouchableOpacity>
        
        {/* Animated glow effect */}
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={['transparent', colors[0] + '40']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {/* Circuit decoration */}
        <View style={styles.circuitDecoration}>
          <View style={[styles.circuit, { backgroundColor: colors[0] + '40' }]} />
          <View style={[styles.circuitDot, { backgroundColor: colors[0] }]} />
          <View style={[styles.circuit, styles.circuit2, { backgroundColor: colors[0] + '40' }]} />
          <View style={[styles.circuitDot, styles.circuitDot2, { backgroundColor: colors[0] }]} />
        </View>
      </TouchableOpacity>
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#00FFA9',
  },
  leaderboardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  leaderboardText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFD700',
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 16,
    lineHeight: 20,
  },
  countdownContainer: {
    marginBottom: 16,
  },
  rewardsContainer: {
    marginBottom: 20,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFA9',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  participateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  participatingButton: {
    backgroundColor: '#00FFA9',
  },
  participateText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  participatingText: {
    color: '#000000',
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 30,
    opacity: 0.6,
  },
  circuit: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 30,
    height: 1,
  },
  circuit2: {
    bottom: 20,
    right: 10,
    width: 20,
    transform: [{ rotate: '90deg' }],
  },
  circuitDot: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  circuitDot2: {
    bottom: 20,
    right: 10,
  },
});