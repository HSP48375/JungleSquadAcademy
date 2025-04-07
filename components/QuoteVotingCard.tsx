import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThumbsUp, Clock, AlertCircle, Eye, EyeOff, Lock, Award } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';
import AvatarDisplay from './AvatarDisplay';

interface QuoteEntry {
  id: string;
  quote_text: string;
  vote_count?: number;
  has_voted?: boolean;
  user?: {
    avatar: {
      avatar_name: string;
      species: {
        name: string;
      };
      primary_color: string;
    };
  };
  user_id: string;
}

interface QuoteVotingCardProps {
  entries: QuoteEntry[];
  currentUserId: string;
  hasVotedToday: boolean;
  timeRemaining: { days: number; hours: number; minutes: number; seconds: number };
  onVote: (entryId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  showVoteCounts?: boolean;
}

export default function QuoteVotingCard({ 
  entries, 
  currentUserId, 
  hasVotedToday, 
  timeRemaining, 
  onVote, 
  loading, 
  error, 
  showVoteCounts = false 
}: QuoteVotingCardProps) {
  const [votingEntryId, setVotingEntryId] = useState<string | null>(null);
  const [showCounts, setShowCounts] = useState(showVoteCounts);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Reset local error when prop error changes
  useEffect(() => {
    setLocalError(error);
  }, [error]);
  
  // Animation values
  const lockPulse = useSharedValue(1);
  const timerOpacity = useSharedValue(0.7);
  
  // Set up animations
  useEffect(() => {
    if (hasVotedToday) {
      // Pulsing lock animation
      lockPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
    
    // Timer animation
    timerOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, [hasVotedToday]);
  
  // Animated styles
  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockPulse.value }],
  }));
  
  const timerStyle = useAnimatedStyle(() => ({
    opacity: timerOpacity.value,
  }));
  
  // Handle vote
  const handleVote = async (entryId: string) => {
    // Prevent voting for own quote
    const entry = entries.find(e => e.id === entryId);
    if (entry?.user_id === currentUserId) {
      setLocalError("You can't vote for your own quote");
      return;
    }
    
    // Prevent voting if already voted today
    if (hasVotedToday) {
      setLocalError("You've already voted today. Come back tomorrow!");
      return;
    }
    
    // Prevent voting if already voted for this entry
    if (entry?.has_voted) {
      setLocalError("You've already voted for this quote");
      return;
    }
    
    setVotingEntryId(entryId);
    setLocalError(null);
    
    try {
      const success = await onVote(entryId);
      if (!success) {
        setLocalError("Failed to submit vote. Please try again.");
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setVotingEntryId(null);
    }
  };
  
  // Format time remaining
  const formatTimeRemaining = () => {
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    } else {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
  };
  
  // Render quote entry
  const renderQuoteEntry = ({ item, index }: { item: QuoteEntry; index: number }) => {
    const isVoting = votingEntryId === item.id;
    const isOwnQuote = item.user_id === currentUserId;
    const hasVoted = item.has_voted;
    const isDisabled = hasVotedToday || isOwnQuote || hasVoted || loading;
    
    // Get glow color based on state
    const getGlowColor = () => {
      if (isOwnQuote) return '#00FFA9'; // Own quote
      if (hasVoted) return '#FFD700'; // Already voted for this
      if (isVoting) return '#FF69B4'; // Currently voting
      return '#00AAFF'; // Default
    };
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
      >
        <GlassmorphicCard
          glowColor={getGlowColor()}
          intensity={hasVoted ? 'high' : 'medium'}
          style={styles.quoteCard}
        >
          {/* Quote content */}
          <View style={styles.quoteContent}>
            <Text style={styles.quoteText}>"{item.quote_text}"</Text>
            
            {/* Author info */}
            {item.user && (
              <View style={styles.authorContainer}>
                <AvatarDisplay
                  species={item.user.avatar.species.name}
                  name={item.user.avatar.avatar_name}
                  primaryColor={item.user.avatar.primary_color}
                  size="small"
                  showName={false}
                />
                <Text style={styles.authorName}>
                  {isOwnQuote ? 'You' : item.user.avatar.avatar_name}
                </Text>
              </View>
            )}
            
            {/* Vote count */}
            {showCounts && (
              <View style={styles.voteCountContainer}>
                <ThumbsUp size={16} color="#FFD700" />
                <Text style={styles.voteCount}>{item.vote_count || 0}</Text>
              </View>
            )}
            
            {/* Vote button or status */}
            {isOwnQuote ? (
              <View style={styles.ownQuoteTag}>
                <Award size={16} color="#00FFA9" />
                <Text style={styles.ownQuoteText}>Your Submission</Text>
              </View>
            ) : hasVoted ? (
              <View style={styles.votedTag}>
                <ThumbsUp size={16} color="#FFD700" />
                <Text style={styles.votedText}>Voted</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  isDisabled && styles.disabledButton
                ]}
                onPress={() => handleVote(item.id)}
                disabled={isDisabled}
              >
                {isVoting ? (
                  <Animated.View style={styles.votingIndicator}>
                    <LinearGradient
                      colors={['#FF69B4', '#FF1493']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                    <Text style={styles.votingText}>Voting...</Text>
                  </Animated.View>
                ) : (
                  <>
                    <ThumbsUp size={16} color="#FFFFFF" />
                    <Text style={styles.voteButtonText}>Vote</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {/* Cyberpunk circuit decoration */}
          <View style={styles.circuitDecoration}>
            <View style={[styles.circuit, { backgroundColor: getGlowColor() + '60' }]} />
            <View style={[styles.circuitDot, { backgroundColor: getGlowColor() }]} />
          </View>
        </GlassmorphicCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with time remaining */}
      <Animated.View 
        style={[styles.timerContainer, timerStyle]}
        entering={FadeIn.duration(800)}
      >
        <Clock size={16} color="#FFD700" />
        <Text style={styles.timerText}>
          Voting ends in: {formatTimeRemaining()}
        </Text>
        
        {/* Toggle vote counts visibility */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowCounts(!showCounts)}
        >
          {showCounts ? (
            <EyeOff size={16} color="#AAAAAA" />
          ) : (
            <Eye size={16} color="#AAAAAA" />
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {/* Locked state if already voted */}
      {hasVotedToday && (
        <Animated.View 
          style={[styles.lockedContainer, lockStyle]}
          entering={FadeInDown.duration(500)}
        >
          <GlassmorphicCard
            glowColor="#FF4444"
            intensity="medium"
            style={styles.lockedCard}
          >
            <Lock size={24} color="#FF4444" />
            <Text style={styles.lockedText}>
              You've already voted today. Come back tomorrow for another vote!
            </Text>
          </GlassmorphicCard>
        </Animated.View>
      )}
      
      {/* Error message */}
      {localError && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassmorphicCard
            glowColor="#FF4444"
            intensity="low"
            style={styles.errorContainer}
          >
            <View style={styles.errorContent}>
              <AlertCircle size={20} color="#FF4444" />
              <Text style={styles.errorText}>{localError}</Text>
            </View>
          </GlassmorphicCard>
        </Animated.View>
      )}
      
      {/* Quote entries */}
      {entries.length > 0 ? (
        <FlatList
          data={entries}
          renderItem={renderQuoteEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.entriesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No quotes have been submitted yet. Be the first to share your wisdom!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  timerText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 8,
  },
  toggleButton: {
    marginLeft: 12,
    padding: 4,
  },
  lockedContainer: {
    marginBottom: 16,
  },
  lockedCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    flex: 1,
  },
  entriesList: {
    paddingBottom: 20,
  },
  quoteCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  quoteContent: {
    padding: 16,
    position: 'relative',
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 24,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
    marginLeft: 12,
  },
  voteCountContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  voteCount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 170, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  voteButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  votingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  votingText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  ownQuoteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  ownQuoteText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#00FFA9',
  },
  votedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  votedText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 20,
    opacity: 0.6,
  },
  circuit: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 20,
    height: 1,
  },
  circuitDot: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});