import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Trophy, Star, Share2, Calendar, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarOfWeek } from '@/hooks/useAvatarOfWeek';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';

export default function AvatarOfWeekScreen() {
  const { session } = useAuth();
  const { winner, loading, error } = useAvatarOfWeek();
  const [pastWinners, setPastWinners] = useState([]);
  const [loadingPast, setLoadingPast] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchPastWinners();
    }
  }, [session]);

  const fetchPastWinners = async () => {
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
        .lt('week_end', new Date().toISOString())
        .order('week_start', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setPastWinners(data || []);
    } catch (e) {
      console.error('Failed to fetch past winners:', e);
    } finally {
      setLoadingPast(false);
    }
  };

  const handleShare = (avatarName: string) => {
    // This would use the Share API in a real app
    console.log(`Sharing ${avatarName}'s achievement`);
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Avatar of the Week</Text>
          <Text style={styles.subtitle}>Celebrating our top jungle explorers</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Loading current winner...</Text>
        ) : winner ? (
          <GlassmorphicCard
            glowColor="#FFD700"
            intensity="high"
            style={styles.winnerCard}
          >
            <LinearGradient
              colors={['rgba(255,215,0,0.2)', 'rgba(0,0,0,0)']}
              style={styles.winnerGradient}
            />
            
            <View style={styles.crownContainer}>
              <Crown size={40} color="#FFD700" />
            </View>
            
            <View style={styles.avatarContainer}>
              <AvatarDisplay
                species={winner.winner.avatar.species.name}
                name={winner.winner.avatar.avatar_name}
                primaryColor={winner.winner.avatar.primary_color}
                secondaryColor={winner.winner.avatar.secondary_color}
                size="large"
              />
            </View>
            
            <Text style={styles.winnerTitle}>This Week's Champion</Text>
            <Text style={styles.winnerName}>{winner.winner.avatar.avatar_name}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Trophy size={20} color="#00FFA9" />
                <Text style={styles.statValue}>{winner.stats.weekly_xp}</Text>
                <Text style={styles.statLabel}>XP Earned</Text>
              </View>
              
              <View style={styles.statItem}>
                <Calendar size={20} color="#FF69B4" />
                <Text style={styles.statValue}>{winner.stats.active_days}</Text>
                <Text style={styles.statLabel}>Active Days</Text>
              </View>
              
              <View style={styles.statItem}>
                <Users size={20} color="#00AAFF" />
                <Text style={styles.statValue}>{winner.stats.tutors_engaged}</Text>
                <Text style={styles.statLabel}>Tutors</Text>
              </View>
            </View>
            
            <View style={styles.periodContainer}>
              <Text style={styles.periodText}>
                {new Date(winner.week_start).toLocaleDateString()} - {new Date(winner.week_end).toLocaleDateString()}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => handleShare(winner.winner.avatar.avatar_name)}
            >
              <Share2 size={20} color="#000000" />
              <Text style={styles.shareText}>Share Achievement</Text>
            </TouchableOpacity>
          </GlassmorphicCard>
        ) : (
          <View style={styles.noWinnerContainer}>
            <Text style={styles.noWinnerText}>No avatar of the week selected yet.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hall of Fame</Text>
          
          {loadingPast ? (
            <Text style={styles.loadingText}>Loading past winners...</Text>
          ) : pastWinners.length > 0 ? (
            pastWinners.map((pastWinner) => (
              <GlassmorphicCard
                key={pastWinner.id}
                glowColor="#00FFA9"
                intensity="low"
                style={styles.pastWinnerCard}
              >
                <View style={styles.pastWinnerContent}>
                  <AvatarDisplay
                    species={pastWinner.winner.avatar.species.name}
                    name={pastWinner.winner.avatar.avatar_name}
                    primaryColor={pastWinner.winner.avatar.primary_color}
                    secondaryColor={pastWinner.winner.avatar.secondary_color}
                    size="small"
                  />
                  
                  <View style={styles.pastWinnerInfo}>
                    <Text style={styles.pastWinnerName}>{pastWinner.winner.avatar.avatar_name}</Text>
                    <Text style={styles.pastWinnerPeriod}>
                      {new Date(pastWinner.week_start).toLocaleDateString()} - {new Date(pastWinner.week_end).toLocaleDateString()}
                    </Text>
                    
                    <View style={styles.pastWinnerStats}>
                      <View style={styles.miniStatItem}>
                        <Trophy size={14} color="#00FFA9" />
                        <Text style={styles.miniStatText}>{pastWinner.stats.weekly_xp} XP</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.trophyBadge}>
                    <Star size={16} color="#FFD700" />
                  </View>
                </View>
              </GlassmorphicCard>
            ))
          ) : (
            <Text style={styles.noWinnerText}>No past winners yet.</Text>
          )}
        </View>
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
    marginTop: 20,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  winnerCard: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  winnerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  crownContainer: {
    position: 'absolute',
    top: 16,
    zIndex: 10,
  },
  avatarContainer: {
    marginTop: 40,
    marginBottom: 16,
  },
  winnerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  winnerName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  statLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  periodContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  periodText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  shareText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  noWinnerContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 24,
  },
  noWinnerText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  pastWinnerCard: {
    marginBottom: 12,
  },
  pastWinnerContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  pastWinnerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  pastWinnerName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pastWinnerPeriod: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  pastWinnerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#00FFA9',
  },
  trophyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});