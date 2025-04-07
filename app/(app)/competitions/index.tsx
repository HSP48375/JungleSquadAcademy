import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Target, Users, Coins } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCompetitions } from '@/hooks/useCompetitions';
import CompetitionCard from '@/components/CompetitionCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ParticleEffect from '@/components/ParticleEffect';

export default function CompetitionsScreen() {
  const { session } = useAuth();
  const { 
    competitions, 
    participation, 
    loading, 
    error, 
    joinCompetition, 
    leaveCompetition 
  } = useCompetitions(session?.user?.id ?? '');

  const toggleParticipation = async (competitionId: string) => {
    const isParticipating = participation[competitionId]?.opted_in;
    
    if (isParticipating) {
      await leaveCompetition(competitionId);
    } else {
      await joinCompetition(competitionId);
    }
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Competitions</Text>
          <Text style={styles.subtitle}>Compete, learn, and earn exclusive rewards!</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Loading competitions...</Text>
        ) : competitions.length === 0 ? (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#666666" />
            <Text style={styles.emptyText}>
              No competitions available right now. Check back soon!
            </Text>
          </View>
        ) : (
          competitions.map((competition) => {
            const userParticipation = participation[competition.id];
            const isParticipating = userParticipation?.opted_in;
            const progress = isParticipating ? {
              totalXp: userParticipation.total_xp,
              challengesCompleted: userParticipation.challenges_completed
            } : undefined;

            return (
              <CompetitionCard
                key={competition.id}
                id={competition.id}
                title={competition.title}
                description={competition.description}
                subject={competition.subject}
                startDate={competition.start_date}
                endDate={competition.end_date}
                hasLeaderboard={competition.leaderboard_enabled}
                participationThreshold={competition.participation_threshold}
                participationReward={competition.participation_reward}
                isParticipating={!!isParticipating}
                progress={progress}
                onJoin={() => toggleParticipation(competition.id)}
                onPress={() => router.push(`/competitions/${competition.id}?title=${competition.title}`)}
              />
            );
          })
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
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 16,
  },
});