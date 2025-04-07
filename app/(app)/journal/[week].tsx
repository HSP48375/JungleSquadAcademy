import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function PastEntryScreen() {
  const { week } = useLocalSearchParams();
  const { session } = useAuth();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user && week) {
      fetchEntry();
    }
  }, [session, week]);

  const fetchEntry = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_journals')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('week_start', week)
        .single();

      if (fetchError) throw fetchError;
      setEntry(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch journal entry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading entry...</Text>
      </View>
    );
  }

  if (!entry) return null;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.weekday}>
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
            })}
          </Text>
        </View>
        <View style={styles.iconContainer}>
          <Book size={32} color="#00FFA9" />
        </View>
      </View>

      <View style={styles.entryCard}>
        <Text style={styles.entryText}>{entry.text_entry}</Text>

        {entry.voice_entry_url && (
          <View style={styles.audioPlayer}>
            {/* Audio player implementation */}
          </View>
        )}
      </View>

      {entry.ai_summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Star size={20} color="#FFD700" />
            <Text style={styles.summaryTitle}>AI Reflection</Text>
          </View>
          <Text style={styles.summaryText}>{entry.ai_summary}</Text>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weekday: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,255,169,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  entryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#333333',
  },
  entryText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  audioPlayer: {
    marginTop: 20,
    height: 48,
    backgroundColor: '#262626',
    borderRadius: 24,
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  summaryText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
});