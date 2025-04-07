import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Star, X, Share2, Calendar } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import GlassmorphicCard from './GlassmorphicCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeeklySummaryModalProps {
  entry: {
    id: string;
    week_start: string;
    text_entry: string | null;
    ai_summary: string | null;
  };
  streak: number;
  quote: {
    text: string;
    author: string;
  };
  onShare: () => void;
  onClose: () => void;
}

export default function WeeklySummaryModal({
  entry,
  streak,
  quote,
  onShare,
  onClose,
}: WeeklySummaryModalProps) {
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  const summaryOpacity = useSharedValue(0);
  const streakScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 400 });
    
    // Staggered content animations
    quoteOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 800 })
    );
    
    summaryOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 800 })
    );
    
    // Streak animation
    if (streak >= 2) {
      streakScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
    
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
  }));
  
  const summaryStyle = useAnimatedStyle(() => ({
    opacity: summaryOpacity.value,
  }));
  
  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      />
      
      {streak >= 3 && (
        <ConfettiCannon
          count={100}
          origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
          autoStart
          fadeOut
          colors={['#00FFA9', '#FFD700', '#FF69B4', '#00AAFF']}
        />
      )}
      
      <Animated.View style={[styles.container, containerStyle]}>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="high"
          style={styles.card}
        >
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Book size={32} color="#00FFA9" />
            <Text style={styles.title}>Weekly Summary</Text>
          </View>
          
          <View style={styles.dateContainer}>
            <Calendar size={16} color="#AAAAAA" />
            <Text style={styles.dateText}>
              {formatDate(entry.week_start)}
            </Text>
          </View>
          
          {streak >= 2 && (
            <Animated.View style={[styles.streakContainer, streakStyle]}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.streakGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Star size={16} color="#FFFFFF" />
                <Text style={styles.streakText}>
                  {streak} Week Streak!
                </Text>
              </LinearGradient>
              
              <Animated.View style={[styles.streakGlow, glowStyle]}>
                <LinearGradient
                  colors={['transparent', '#FFD700']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          )}
          
          <Animated.View style={[styles.quoteContainer, quoteStyle]}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </Animated.View>
          
          <Animated.View style={[styles.summaryContainer, summaryStyle]}>
            <Text style={styles.summaryTitle}>Your Learning Journey</Text>
            
            {entry.ai_summary ? (
              <Text style={styles.summaryText}>{entry.ai_summary}</Text>
            ) : (
              <Text style={styles.pendingText}>
                AI summary is being generated...
              </Text>
            )}
          </Animated.View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={onShare}
            >
              <Share2 size={20} color="#FFFFFF" />
              <Text style={styles.shareText}>Share Reflection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeTextButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  card: {
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dateText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  streakContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  streakText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  streakGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 25,
    opacity: 0.5,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'right',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#00FFA9',
    marginBottom: 12,
  },
  summaryText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  pendingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  actions: {
    gap: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  shareText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
  },
  closeTextButton: {
    alignItems: 'center',
  },
  closeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
});