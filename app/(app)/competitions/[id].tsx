import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Crown, Target, Calendar, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCompetitions } from '@/hooks/useCompetitions';
import LeaderboardCard from '@/components/LeaderboardCard';
import CompetitionCountdown from '@/components/CompetitionCountdown';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';

export default function CompetitionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const { 
    getCompetition, 
    fetchLeaderboard, 
    fetchRewards, 
    leaderboard, 
    rewards, 
    getUserRank,
    loading 
  } = useCompetitions(session?.user?.id ?? '');
  
  const [competition, setCompetition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState('default');

  useEffect(() => {
    if (id) {
      const competitionData = getCompetition(id as string);
      setCompetition(competitionData);
      
      if (competitionData) {
        fetchLeaderboard(competitionData.id);
        fetchRewards(competitionData.id);
        
        // Set theme based on subject
        switch (competitionData.subject) {
          case 'Mathematics':
            setTheme('math');
            break;
          case 'History & Geography':
            setTheme('history');
            break;
          case 'Language Arts':
            setTheme('language');
            break;
          case 'Science':
            setTheme('science');
            break;
          case 'Art & Creativity':
            setTheme('art');
            break;
          case 'Technology':
            setTheme('tech');
            break;
          default:
            setTheme('default');
        }
      }
    }
  }, [id, getCompetition, fetchLeaderboard, fetchRewards]);

  // Get user's rank
  const userRank = competition ? getUserRank(competition.id) : null;
  
  // Get competition rewards
  const competitionRewards = competition && rewards[competition.id] ? rewards[competition.id] : [];

  if (loading) {
    return (
      <View style={styles.container}>
        <ImmersiveBackground theme={theme as any} intensity="medium" />
        <Text style={styles.loadingText}>Loading competition details...</Text>
      </View>
    );
  }

  if (!competition) {
    return (
      <View style={styles.container}>
        <ImmersiveBackground theme={theme as any} intensity="medium" />
        <Text style={styles.errorText}>Competition not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImmersiveBackground theme={theme as any} intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{competition.title}</Text>
          <Text style={styles.subtitle}>{competition.subject}</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="medium"
          style={styles.infoCard}
        >
          <View style={styles.infoRow}>
            <Calendar size={20} color="#00FFA9" />
            <Text style={styles.infoText}>
              {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Target size={20} color="#00FFA9" />
            <Text style={styles.infoText}>
              Complete {competition.participation_threshold} challenges to earn {competition.participation_reward} XP
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Users size={20} color="#00FFA9" />
            <Text style={styles.infoText}>
              {leaderboard.length} participants
            </Text>
          </View>
          
          <View style={styles.countdownWrapper}>
            <CompetitionCountdown endDate={competition.end_date} />
          </View>
        </GlassmorphicCard>

        <Text style={styles.sectionTitle}>Competition Details</Text>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="low"
          style={styles.descriptionCard}
        >
          <Text style={styles.description}>{competition.description}</Text>
        </GlassmorphicCard>

        {competition.leaderboard_enabled && (
          <>
            <Text style={styles.sectionTitle}>Current Standings</Text>
            <LeaderboardCard
              entries={leaderboard}
              currentUserId={session?.user?.id}
              userRank={userRank}
              rewards={competitionRewards}
            />
          </>
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
    fontSize: 18,
    color: '#00FFA9',
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 24,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  countdownWrapper: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  descriptionCard: {
    marginBottom: 24,
    padding: 20,
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
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
    marginBottom: 16,
  },
});