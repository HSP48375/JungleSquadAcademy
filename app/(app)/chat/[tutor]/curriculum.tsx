import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useLearningTracks } from '@/hooks/useLearningTracks';
import LearningTrackCard from '@/components/LearningTrackCard';

export default function TutorCurriculumScreen() {
  const { tutor } = useLocalSearchParams();
  const { session } = useAuth();
  const {
    tracks,
    modules,
    progress,
    loading,
    error,
    startTrack,
    completeModule,
  } = useLearningTracks(session?.user?.id ?? '', tutor as string);

  const handleTrackPress = (trackId: string) => {
    if (!progress[trackId]) {
      startTrack(trackId);
    }
    // Navigate to track detail screen
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Learning Tracks</Text>
        <Text style={styles.subtitle}>
          Choose your path and start your learning journey
        </Text>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {loading ? (
        <Text style={styles.loadingText}>Loading learning tracks...</Text>
      ) : (
        <View style={styles.tracksContainer}>
          {tracks.map((track, index) => (
            <LearningTrackCard
              key={track.id}
              title={track.name}
              description={track.description}
              difficulty={track.difficulty}
              progress={progress[track.id]?.completion_percentage ?? 0}
              isLocked={track.difficulty !== 'beginner' && !Object.keys(progress).length}
              onPress={() => handleTrackPress(track.id)}
              index={index}
            />
          ))}
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
    padding: 20,
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
    marginBottom: 24,
  },
  tracksContainer: {
    padding: 20,
    paddingTop: 0,
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
    marginHorizontal: 20,
  },
});