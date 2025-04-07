import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Trophy, Star, Check, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassmorphicCard from '@/components/GlassmorphicCard';

export default function AvatarOfWeekAdminScreen() {
  const [candidates, setCandidates] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCandidates();
    fetchCurrentWinner();
  }, []);

  const fetchCandidates = async () => {
    try {
      // Get top users by XP in the last week
      const { data, error: fetchError } = await supabase.rpc('get_top_performers', {
        days_back: 7,
        limit_count: 10
      });

      if (fetchError) throw fetchError;
      setCandidates(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentWinner = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('avatar_of_week')
        .select(`
          *,
          winner:profiles!inner (
            avatar:user_avatar!inner (
              avatar_name,
              primary_color,
              secondary_color,
              species:avatar_species (
                name
              )
            )
          )
        `)
        .lte('week_start', new Date().toISOString())
        .gte('week_end', new Date().toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      setCurrentWinner(data);
    } catch (e) {
      // No current winner is not an error
      if (e.code !== 'PGRST116') {
        setError(e instanceof Error ? e.message : 'Failed to fetch current winner');
      }
    }
  };

  const selectWinner = async (userId: string) => {
    try {
      // Calculate week boundaries
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7); // End of week (next Sunday)

      // Get user stats
      const candidate = candidates.find(c => c.user_id === userId);
      
      if (!candidate) throw new Error('Candidate not found');

      // Create or update avatar of week
      const { error: upsertError } = await supabase
        .from('avatar_of_week')
        .upsert({
          user_id: userId,
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          selection_criteria: {
            criteria: 'admin_selected',
            timestamp: new Date().toISOString()
          },
          stats: {
            weekly_xp: candidate.weekly_xp,
            active_days: candidate.active_days,
            tutors_engaged: candidate.tutors_engaged
          }
        });

      if (upsertError) throw upsertError;

      // Award coins to the winner
      await supabase.rpc('handle_coin_transaction', {
        p_user_id: userId,
        p_amount: 25,
        p_type: 'reward',
        p_description: 'Avatar of the Week reward',
      });

      // Refresh data
      await fetchCurrentWinner();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to select winner');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading candidates...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Avatar of the Week</Text>
        <Text style={styles.subtitle}>Select this week's featured avatar</Text>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {currentWinner && (
        <GlassmorphicCard
          glowColor="#FFD700"
          intensity="high"
          style={styles.currentWinnerCard}
        >
          <View style={styles.currentWinnerHeader}>
            <Crown size={24} color="#FFD700" />
            <Text style={styles.currentWinnerTitle}>Current Winner</Text>
          </View>

          <View style={styles.winnerContent}>
            <AvatarDisplay
              species={currentWinner.winner.avatar.species.name}
              name={currentWinner.winner.avatar.avatar_name}
              primaryColor={currentWinner.winner.avatar.primary_color}
              secondaryColor={currentWinner.winner.avatar.secondary_color}
              size="medium"
            />
            <View style={styles.winnerInfo}>
              <Text style={styles.winnerName}>{currentWinner.winner.avatar.avatar_name}</Text>
              <Text style={styles.winnerPeriod}>
                {new Date(currentWinner.week_start).toLocaleDateString()} - {new Date(currentWinner.week_end).toLocaleDateString()}
              </Text>
              <View style={styles.winnerStats}>
                <View style={styles.statItem}>
                  <Trophy size={16} color="#00FFA9" />
                  <Text style={styles.statText}>{currentWinner.stats.weekly_xp} XP</Text>
                </View>
                <View style={styles.statItem}>
                  <Star size={16} color="#FFD700" />
                  <Text style={styles.statText}>{currentWinner.stats.active_days} Days</Text>
                </View>
                <View style={styles.statItem}>
                  <Users size={16} color="#FF69B4" />
                  <Text style={styles.statText}>{currentWinner.stats.tutors_engaged} Tutors</Text>
                </View>
              </View>
            </View>
          </View>
        </GlassmorphicCard>
      )}

      <Text style={styles.sectionTitle}>Top Performers This Week</Text>

      {candidates.map((candidate) => (
        <View key={candidate.user_id} style={styles.candidateCard}>
          <View style={styles.candidateInfo}>
            <AvatarDisplay
              species={candidate.species_name}
              name={candidate.avatar_name}
              primaryColor={candidate.primary_color}
              size="small"
            />
            <View style={styles.candidateDetails}>
              <Text style={styles.candidateName}>{candidate.avatar_name}</Text>
              <View style={styles.candidateStats}>
                <View style={styles.statItem}>
                  <Trophy size={14} color="#00FFA9" />
                  <Text style={styles.statText}>{candidate.weekly_xp} XP</Text>
                </View>
                <View style={styles.statItem}>
                  <Star size={14} color="#FFD700" />
                  <Text style={styles.statText}>{candidate.active_days} Days</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.selectButton,
              currentWinner?.user_id === candidate.user_id && styles.selectedButton
            ]}
            onPress={() => selectWinner(candidate.user_id)}
            disabled={currentWinner?.user_id === candidate.user_id}
          >
            {currentWinner?.user_id === candidate.user_id ? (
              <>
                <Check size={16} color="#000" />
                <Text style={styles.selectedText}>Selected</Text>
              </>
            ) : (
              <Text style={styles.selectText}>Select</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
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
  currentWinnerCard: {
    margin: 20,
    marginTop: 0,
  },
  currentWinnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  currentWinnerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  winnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  winnerName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  winnerPeriod: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  winnerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    margin: 20,
    marginBottom: 16,
  },
  candidateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    margin: 20,
    marginTop: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  candidateDetails: {
    marginLeft: 12,
  },
  candidateName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  candidateStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  selectButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedButton: {
    backgroundColor: '#00FFA9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  selectedText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
});