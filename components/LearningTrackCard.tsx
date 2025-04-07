import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Book, CheckCircle2, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

interface LearningTrackCardProps {
  title: string;
  description: string;
  difficulty: string;
  progress: number;
  isLocked?: boolean;
  onPress: () => void;
  index: number;
}

export default function LearningTrackCard({
  title,
  description,
  difficulty,
  progress,
  isLocked,
  onPress,
  index,
}: LearningTrackCardProps) {
  const cardStyle = useAnimatedStyle(() => ({
    opacity: withDelay(
      index * 100,
      withSequence(
        withSpring(0.7),
        withSpring(1)
      )
    ),
    transform: [
      {
        translateY: withDelay(
          index * 100,
          withSpring(0, {
            damping: 12,
            stiffness: 100,
          })
        ),
      },
    ],
  }));

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner':
        return ['#4CAF50', '#2E7D32'];
      case 'intermediate':
        return ['#FF9800', '#F57C00'];
      case 'advanced':
        return ['#F44336', '#D32F2F'];
      default:
        return ['#9E9E9E', '#616161'];
    }
  };

  return (
    <Animated.View style={[styles.container, cardStyle, { opacity: 0, transform: [{ translateY: 50 }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        disabled={isLocked}
      >
        <LinearGradient
          colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
          style={styles.gradient}
        />

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Book size={24} color="#00FFA9" />
            <Text style={styles.title}>{title}</Text>
          </View>

          {isLocked ? (
            <View style={styles.lockBadge}>
              <Lock size={16} color="#666666" />
              <Text style={styles.lockText}>Locked</Text>
            </View>
          ) : (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor()[1] }]}>
              <Text style={styles.difficultyText}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: getDifficultyColor()[0] },
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <CheckCircle2 size={16} color={progress === 100 ? '#00FFA9' : '#666666'} />
            <Text style={styles.progressText}>{progress}% Complete</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  lockText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
});