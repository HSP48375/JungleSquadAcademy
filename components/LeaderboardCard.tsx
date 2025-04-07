import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Medal } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AvatarDisplay from './AvatarDisplay';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  avatar_name: string;
  total_xp: number;
  challenges_completed: number;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  userRank?: number | null;
  rewards?: {
    rank: number;
    reward_type: string;
    reward_amount: number;
  }[];
}

export default function LeaderboardCard({
  entries,
  currentUserId,
  userRank,
  rewards = [],
}: LeaderboardCardProps) {
  // Get reward for a specific rank
  const getRewardForRank = (rank: number) => {
    return rewards.find(r => r.rank === rank);
  };
  
  // Render rank badge based on position
  const RankBadge = ({ rank }: { rank: number }) => {
    // Animation values
    const glowOpacity = useSharedValue(0.5);
    const badgeRotation = useSharedValue(0);
    
    // Set up animations for top 3 ranks
    useEffect(() => {
      if (rank <= 3) {
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
            withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
        
        badgeRotation.value = withRepeat(
          withSequence(
            withDelay(
              rank * 200,
              withTiming(0.05, { duration: 1000, easing: Easing.inOut(Easing.sine) })
            ),
            withTiming(-0.05, { duration: 1000, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
      }
    }, [rank]);
    
    // Animated styles
    const glowStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value,
    }));
    
    const badgeStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${badgeRotation.value}rad` }],
    }));
    
    if (rank > 3) {
      return (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      );
    }

    const colors = {
      1: ['#FFD700', '#FFA500'],
      2: ['#C0C0C0', '#A0A0A0'],
      3: ['#CD7F32', '#8B4513'],
    };

    return (
      <Animated.View style={[styles.topRankBadge, badgeStyle]}>
        <LinearGradient
          colors={colors[rank as keyof typeof colors]}
          style={styles.medalGradient}
        >
          {rank === 1 ? (
            <Crown size={24} color="#FFFFFF" />
          ) : (
            <Medal size={24} color="#FFFFFF" />
          )}
        </LinearGradient>
        
        <Animated.View style={[styles.badgeGlow, glowStyle]}>
          <LinearGradient
            colors={['transparent', colors[rank as keyof typeof colors][0] + '80']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No participants yet. Be the first to join!</Text>
        </View>
      ) : (
        <>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const reward = getRewardForRank(entry.rank);
            
            return (
              <Animated.View
                key={entry.user_id}
                style={[
                  styles.entryRow,
                  isCurrentUser && styles.currentUserRow
                ]}
              >
                <RankBadge rank={entry.rank} />

                <View style={styles.avatarContainer}>
                  <AvatarDisplay
                    species="Tiger" // This would come from user data
                    name={entry.avatar_name}
                    primaryColor="#00FFA9" // This would come from user data
                    size="small"
                    showName={false}
                  />
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{entry.avatar_name}</Text>
                  <View style={styles.statsContainer}>
                    <Text style={styles.xpText}>
                      {entry.total_xp} XP
                    </Text>
                  </View>
                </View>

                {reward && (
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>
                      +{reward.reward_amount} 
                      {reward.reward_type === 'coins' ? ' coins' : ' XP'}
                    </Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
          
          {userRank && userRank > 10 && (
            <View style={styles.userRankContainer}>
              <Text style={styles.userRankText}>
                Your Current Rank: #{userRank}
              </Text>
              <Text style={styles.userRankSubtext}>
                Keep going! You're getting closer to the top 10.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currentUserRow: {
    borderColor: '#00FFA9',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  topRankBadge: {
    width: 40,
    height: 40,
    marginRight: 16,
    position: 'relative',
  },
  medalGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    opacity: 0.5,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
  },
  rewardBadge: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  userRankContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  userRankText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRankSubtext: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});