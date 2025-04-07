import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Calendar, Share2, ArrowLeft, Mic, FileText } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useJournal } from '@/hooks/useJournal';
import AIReflection from '@/components/AIReflection';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import { Audio } from 'expo-av';

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const { getEntryById, shareEntry } = useJournal(session?.user?.id ?? '');
  const [entry, setEntry] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (session?.user && id) {
      const entryData = getEntryById(id as string);
      setEntry(entryData);
      setLoading(false);
    }
  }, [session, id]);
  
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      year: date.toLocaleDateString('en-US', { year: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      full: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    };
  };
  
  const handleShare = () => {
    if (entry) {
      shareEntry(entry.id);
    }
  };
  
  const handlePlayVoice = async () => {
    if (!entry?.voice_entry_url) return;
    
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: entry.voice_entry_url },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        // Listen for playback status updates
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        });
      }
    } catch (e) {
      console.error('Error playing voice entry:', e);
    }
  };
  
  if (loading || !entry) {
    return (
      <View style={styles.container}>
        <ImmersiveBackground intensity="medium" />
        <Text style={styles.loadingText}>Loading journal entry...</Text>
      </View>
    );
  }
  
  const formattedDate = formatDate(entry.week_start);

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Back to Journal</Text>
        </TouchableOpacity>
        
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#00FFA9" />
            <Text style={styles.dateText}>{formattedDate.full}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Share2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="medium"
          style={styles.entryCard}
        >
          <View style={styles.entryHeader}>
            <Book size={24} color="#00FFA9" />
            <Text style={styles.entryTitle}>Weekly Reflection</Text>
          </View>
          
          {entry.text_entry && (
            <View style={styles.textEntryContainer}>
              <View style={styles.entryTypeBadge}>
                <FileText size={14} color="#FFFFFF" />
                <Text style={styles.entryTypeText}>Text Entry</Text>
              </View>
              
              <Text style={styles.entryText}>{entry.text_entry}</Text>
            </View>
          )}
          
          {entry.voice_entry_url && (
            <View style={styles.voiceEntryContainer}>
              <View style={styles.entryTypeBadge}>
                <Mic size={14} color="#FFFFFF" />
                <Text style={styles.entryTypeText}>Voice Entry</Text>
              </View>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayVoice}
              >
                <LinearGradient
                  colors={['#00AAFF', '#0088FF']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Mic size={20} color="#FFFFFF" />
                <Text style={styles.playButtonText}>
                  {isPlaying ? 'Pause Recording' : 'Play Recording'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassmorphicCard>
        
        {entry.ai_summary && (
          <AIReflection
            summary={entry.ai_summary}
            onShare={handleShare}
          />
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
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  backText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryCard: {
    padding: 20,
    marginBottom: 20,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  entryTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  textEntryContainer: {
    marginBottom: 16,
  },
  entryTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  entryTypeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#00FFA9',
  },
  entryText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  voiceEntryContainer: {
    marginTop: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    gap: 8,
  },
  playButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});