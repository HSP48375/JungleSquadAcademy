import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, MessageSquare, Target, ChevronRight, Mail, Eye, Share2 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  withTiming,
} from 'react-native-reanimated';

interface WeeklyRecapProps {
  recap: {
    totalXp: number;
    tutorsUsed: Record<string, number>;
    challengesCompleted: number;
    badgesUnlocked: string[];
    suggestedTutor: {
      name: string;
      animal: string;
    };
    quote: {
      text: string;
      author: string;
      category: string;
    };
  };
  onShare: () => void;
  onUpdatePreferences: () => void;
}

export default function WeeklyRecap({ recap, onShare, onUpdatePreferences }: WeeklyRecapProps) {
  const containerScale = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1, { damping: 12 }) }],
    opacity: withSpring(1),
  }));

  const progressWidth = useAnimatedStyle(() => ({
    width: withDelay(
      500,
      withTiming(`${Math.min((recap.totalXp / 1000) * 100, 100)}%`, {
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    ),
  }));

  return (
    <Animated.View style={[styles.container, containerScale, { opacity: 0, transform: [{ scale: 0.9 }] }]}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Weekly Learning Recap</Text>
          <Text style={styles.subtitle}>Keep leveling up — the jungle is proud of you!</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Share2 size={20} color="#00FFA9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onUpdatePreferences}>
            <Mail size={20} color="#00FFA9" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={24} color="#FFD700" />
          <Text style={styles.statValue}>+{recap.totalXp}</Text>
          <Text style={styles.statLabel}>XP Earned</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressWidth]} />
          </View>
        </View>

        <View style={styles.statCard}>
          <MessageSquare size={24} color="#FF69B4" />
          <Text style={styles.statValue}>{Object.keys(recap.tutorsUsed).length}</Text>
          <Text style={styles.statLabel}>Tutors</Text>
        </View>

        <View style={styles.statCard}>
          <Target size={24} color="#7B68EE" />
          <Text style={styles.statValue}>{recap.challengesCompleted}</Text>
          <Text style={styles.statLabel}>Challenges</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Tutors This Week</Text>
        {Object.entries(recap.tutorsUsed)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tutor, sessions], index) => (
            <View key={tutor} style={styles.tutorRow}>
              <Text style={styles.tutorName}>{tutor}</Text>
              <Text style={styles.tutorSessions}>{sessions} sessions</Text>
            </View>
          ))}
      </View>

      {recap.badgesUnlocked.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Achievements</Text>
          <View style={styles.badgeGrid}>
            {recap.badgesUnlocked.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Trophy size={20} color="#FFD700" />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.suggestionCard}>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionTitle}>Try Something New!</Text>
          <Text style={styles.suggestionText}>
            Ready for a new adventure with {recap.suggestedTutor.name} the {recap.suggestedTutor.animal}?
          </Text>
        </View>
        <ChevronRight size={24} color="#00FFA9" />
      </TouchableOpacity>

      <View style={styles.quoteContainer}>
        <LinearGradient
          colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
          style={styles.quoteGradient}
        />
        <Text style={styles.quoteText}>"{recap.quote.text}"</Text>
        <Text style={styles.quoteAuthor}>— {recap.quote.author}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    margin: 20,
    marginTop: Platform.OS === 'web' ? 20 : 60,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,255,169,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFA9',
    borderRadius: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tutorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  tutorSessions: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  badgeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFD700',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,169,0.1)',
    padding: 16,
    borderRadius: 16,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
    marginBottom: 4,
  },
  suggestionText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  quoteContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  quoteGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
    opacity: 0.5,
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
    textAlign: 'center',
  },
});