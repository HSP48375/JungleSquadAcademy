import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Calendar, Star, Trophy, FileText, Mic } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useJournal } from '@/hooks/useJournal';
import JournalEntryForm from '@/components/JournalEntryForm';
import ProgressJournalCard from '@/components/ProgressJournalCard';
import WeeklySummaryModal from '@/components/WeeklySummaryModal';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';

// Sample quotes for the summary modal
const MOTIVATIONAL_QUOTES = [
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    text: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert"
  },
  {
    text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin"
  },
  {
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci"
  },
  {
    text: "The only person who is educated is the one who has learned how to learn and change.",
    author: "Carl Rogers"
  }
];

export default function JournalScreen() {
  const { session } = useAuth();
  const { 
    entries, 
    currentEntry, 
    loading, 
    submitting, 
    error, 
    streak,
    submitTextEntry,
    submitVoiceEntry,
    shareEntry,
    getEntryById
  } = useJournal(session?.user?.id ?? '');
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  
  // Set random quote on mount
  useEffect(() => {
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);
  
  const handleEntryPress = (entryId: string) => {
    setSelectedEntryId(entryId);
    setShowSummaryModal(true);
  };
  
  const handleShareEntry = () => {
    if (selectedEntryId) {
      shareEntry(selectedEntryId);
    }
  };
  
  const selectedEntry = selectedEntryId ? getEntryById(selectedEntryId) : null;

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Learning Journal</Text>
          <Text style={styles.subtitle}>Track your progress and reflect on your journey</Text>
        </View>
        
        <Animated.View entering={FadeIn.duration(800)}>
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="medium"
            style={styles.streakCard}
          >
            <View style={styles.streakHeader}>
              <View style={styles.streakIconContainer}>
                <Book size={24} color="#00FFA9" />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>Journal Streak</Text>
                <Text style={styles.streakSubtitle}>
                  {streak > 0 
                    ? `You've been journaling for ${streak} consecutive week${streak > 1 ? 's' : ''}!` 
                    : 'Start your streak by submitting your first entry'}
                </Text>
              </View>
            </View>
            
            <View style={styles.streakWeeks}>
              {[...Array(4)].map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.streakWeek,
                    index < streak && styles.activeStreakWeek
                  ]}
                >
                  <Text style={[
                    styles.streakWeekText,
                    index < streak && styles.activeStreakWeekText
                  ]}>
                    {index + 1}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.streakRewards}>
              <View style={styles.streakReward}>
                <View style={[
                  styles.rewardIcon,
                  streak >= 2 && styles.activeRewardIcon
                ]}>
                  <Star size={16} color={streak >= 2 ? '#FFD700' : '#666666'} />
                </View>
                <Text style={[
                  styles.rewardText,
                  streak >= 2 && styles.activeRewardText
                ]}>
                  2 Weeks
                </Text>
              </View>
              
              <View style={styles.streakReward}>
                <View style={[
                  styles.rewardIcon,
                  streak >= 3 && styles.activeRewardIcon
                ]}>
                  <Trophy size={16} color={streak >= 3 ? '#FFD700' : '#666666'} />
                </View>
                <Text style={[
                  styles.rewardText,
                  streak >= 3 && styles.activeRewardText
                ]}>
                  3 Weeks
                </Text>
              </View>
              
              <View style={styles.streakReward}>
                <View style={[
                  styles.rewardIcon,
                  streak >= 4 && styles.activeRewardIcon
                ]}>
                  <Calendar size={16} color={streak >= 4 ? '#FFD700' : '#666666'} />
                </View>
                <Text style={[
                  styles.rewardText,
                  streak >= 4 && styles.activeRewardText
                ]}>
                  4 Weeks
                </Text>
              </View>
            </View>
          </GlassmorphicCard>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <JournalEntryForm
            onSubmitText={submitTextEntry}
            onSubmitVoice={submitVoiceEntry}
            initialText={currentEntry?.text_entry || ''}
            loading={submitting}
            error={error}
          />
        </Animated.View>
        
        <Text style={styles.sectionTitle}>Previous Entries</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading journal entries...</Text>
        ) : entries.length > 0 ? (
          entries.map((entry, index) => (
            <Animated.View 
              key={entry.id}
              entering={FadeInDown.delay(300 + index * 100).duration(500)}
            >
              <ProgressJournalCard
                date={entry.week_start}
                hasTextEntry={!!entry.text_entry}
                hasVoiceEntry={!!entry.voice_entry_url}
                hasSummary={!!entry.ai_summary}
                onPress={() => handleEntryPress(entry.id)}
                isLatest={index === 0}
              />
            </Animated.View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No journal entries yet. Start reflecting on your learning journey!
          </Text>
        )}
      </ScrollView>
      
      {showSummaryModal && selectedEntry && (
        <WeeklySummaryModal
          entry={selectedEntry}
          streak={streak}
          quote={randomQuote}
          onShare={handleShareEntry}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
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
  streakCard: {
    padding: 20,
    marginBottom: 24,
  },
  streakHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  streakWeeks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  streakWeek: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeStreakWeek: {
    backgroundColor: 'rgba(0, 255, 169, 0.2)',
    borderColor: '#00FFA9',
  },
  streakWeekText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#666666',
  },
  activeStreakWeekText: {
    color: '#00FFA9',
  },
  streakRewards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakReward: {
    alignItems: 'center',
  },
  rewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeRewardIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  activeRewardText: {
    color: '#FFD700',
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});