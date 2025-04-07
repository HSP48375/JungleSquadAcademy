import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Users, Coins } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AvatarDisplay from '@/components/AvatarDisplay';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  avatar_name: string;
  species_name: string;
  primary_color: string;
  total_referrals: number;
  coins_earned: number;
  tier: string;
};

export default function ReferralLeaderboard() {
  const { session } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_referral_leaderboard_with_tiers', { limit_count: 25 });

      if (fetchError) throw fetchError;
      setLeaderboard(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const RankBadge = ({ rank, tier }: { rank: number; tier: string }) => {
    const glowStyle = useAnimatedStyle(() => ({
      opacity: withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      ),
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
      <Animated.View style={[styles.topRankBadge, glowStyle]}>
        <LinearGradient
          colors={colors[rank as keyof typeof colors]}
          style={styles.crownGradient}
        >
          <Crown size={24} color="#FFFFFF" />
          <Text style={styles.topRankText}>#{rank}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return '#00FFFF';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      default: return '#CD7F32'; // Bronze
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImmersiveBackground intensity="medium" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Referral Champions</Text>
          <Text style={styles.subtitle}>Top jungle guides spreading the knowledge</Text>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          leaderboard.map((entry, index) => (
            <Animated.View
              key={entry.user_id}
              entering={FadeInDown.delay(index * 100).duration(500)}
              style={[
                styles.entryCard,
                session?.user?.id === entry.user_id && styles.currentUserCard
              ]}
            >
              <RankBadge rank={entry.rank} tier={entry.tier} />

              <View style={styles.avatarContainer}>
                <AvatarDisplay
                  species={entry.species_name}
                  name={entry.avatar_name}
                  primaryColor={entry.primary_color}
                  size="small"
                  showName={false}
                />
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.avatarName}>{entry.avatar_name}</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Users size={16} color="#00FFA9" />
                    <Text style={styles.statText}>
                      {entry.total_referrals} referrals
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Coins size={16} color="#FFD700" />
                    <Text style={styles.statText}>
                      {entry.coins_earned} earned
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={[
                styles.tierBadge, 
                { backgroundColor: `${getTierColor(entry.tier)}30` }
              ]}>
                <Text style={[
                  styles.tierText,
                  { color: getTierColor(entry.tier) }
                ]}>
                  {entry.tier}
                </Text>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  currentUserCard: {
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
  },
  crownGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  topRankText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  avatarName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  tierText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
  },
});