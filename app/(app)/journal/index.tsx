import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, ChevronRight, Mic, Send, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AvatarDisplay from '@/components/AvatarDisplay';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  withTiming,
} from 'react-native-reanimated';

const WEEKLY_QUOTES = [
  {
    quote: "Every journal entry is a step toward understanding yourself better.",
    tutor: "Ellie",
    animal: "Elephant",
    avatar: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&fit=crop",
  },
  {
    quote: "Reflection is the bridge between experience and wisdom.",
    tutor: "Zara",
    animal: "Zebra",
    avatar: "https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=400&fit=crop",
  },
  {
    quote: "Write today what you'll be proud to read tomorrow.",
    tutor: "Luna",
    animal: "Lioness",
    avatar: "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&fit=crop",
  },
];

export default function JournalScreen() {
  const { session } = useAuth();
  const [entry, setEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [lastEntry, setLastEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote] = useState(WEEKLY_QUOTES[Math.floor(Math.random() * WEEKLY_QUOTES.length)]);

  useEffect(() => {
    if (session?.user) {
      fetchLastEntry();
    }
  }, [session]);

  const fetchLastEntry = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_journals')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      setLastEntry(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch last entry');
    }
  };

  const handleSubmit = async () => {
    if (!entry.trim()) return;

    try {
      setLoading(true);
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const { error: submitError } = await supabase
        .from('weekly_journals')
        .insert({
          user_id: session?.user?.id,
          week_start: weekStart.toISOString(),
          text_entry: entry.trim(),
        });

      if (submitError) throw submitError;

      setEntry('');
      await fetchLastEntry();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const cardScale = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1, { damping: 12 }) }],
    opacity: withSpring(1),
  }));

  const quoteSlide = useAnimatedStyle(() => ({
    transform: [
      { 
        translateX: withSequence(
          withTiming(20, { duration: 0 }),
          withDelay(
            300,
            withTiming(0, {
              duration: 800,
              easing: Easing.out(Easing.quad),
            })
          )
        )
      }
    ],
    opacity: withTiming(1, { duration: 800 }),
  }));

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <Animated.View style={[styles.quoteCard, quoteSlide, { opacity: 0 }]}>
        <View style={styles.tutorContainer}>
          <AvatarDisplay
            species={quote.animal}
            name={quote.tutor}
            primaryColor="#00FFA9"
            secondaryColor="#333333"
            size="small"
          />
          <View style={styles.quoteContent}>
            <Text style={styles.quote}>"{quote.quote}"</Text>
            <Text style={styles.tutorName}>{quote.tutor} the {quote.animal}</Text>
          </View>
        </View>
      </Animated.View>

      {lastEntry && (
        <TouchableOpacity
          style={styles.lastEntryCard}
          onPress={() => router.push(`/journal/${new Date(lastEntry.week_start).toISOString()}`)}
        >
          <View style={styles.lastEntryHeader}>
            <View style={styles.lastEntryIcon}>
              <Book size={24} color="#00FFA9" />
            </View>
            <View style={styles.lastEntryInfo}>
              <Text style={styles.lastEntryTitle}>Last Week's Entry</Text>
              <Text style={styles.lastEntryDate}>
                {new Date(lastEntry.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <ChevronRight size={24} color="#666666" />
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.journalCard, cardScale, { opacity: 0 }]}>
        <Text style={styles.prompt}>
          How was your learning journey this week?
        </Text>

        <TextInput
          style={styles.input}
          value={entry}
          onChangeText={setEntry}
          placeholder="Share your thoughts, challenges, and victories..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.actions}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton
              ]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Mic size={24} color={isRecording ? '#FF4444' : '#FFFFFF'} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!entry.trim() || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!entry.trim() || loading}
          >
            <Send size={24} color="#000000" />
            <Text style={styles.submitText}>Save Entry</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeRemaining}>
          <Clock size={16} color="#666666" />
          <Text style={styles.timeText}>
            Submit by Sunday at midnight
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  quoteCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tutorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteContent: {
    flex: 1,
    marginLeft: 16,
  },
  quote: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  lastEntryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastEntryHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastEntryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,255,169,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lastEntryInfo: {
    flex: 1,
  },
  lastEntryTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastEntryDate: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  journalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  prompt: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    minHeight: 160,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF4444',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFA9',
    height: 56,
    borderRadius: 28,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
});