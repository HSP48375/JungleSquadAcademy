import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function QuoteCarousel() {
  const [quotes, setQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  const fetchQuotes = async () => {
    try {
      const { data } = await supabase
        .from('quote_submissions')
        .select(`
          *,
          author:profiles!inner (
            avatar:user_avatar!inner (
              avatar_name
            )
          )
        `)
        .eq('approved', true)
        .order('featured_at', { ascending: false })
        .limit(10);

      setQuotes(data || []);
    } catch (e) {
      console.error('Failed to fetch quotes:', e);
    } finally {
      setLoading(false);
    }
  };

  const slideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSequence(
          withTiming(-SCREEN_WIDTH, { duration: 0 }),
          withDelay(
            100,
            withTiming(0, {
              duration: 500,
              easing: Easing.out(Easing.quad),
            })
          )
        ),
      },
    ],
    opacity: withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(
        100,
        withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.quad),
        })
      )
    ),
  }));

  if (loading || quotes.length === 0) return null;

  const currentQuote = quotes[currentIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <Animated.View style={[styles.quoteContainer, slideStyle]} key={currentQuote.id}>
        <Text style={styles.quoteText}>"{currentQuote.quote_text}"</Text>
        <Text style={styles.authorName}>— {currentQuote.author.avatar.avatar_name}</Text>
        {currentQuote.featured_at && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Quote of the Week</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.dots}>
        {quotes.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  quoteContainer: {
    alignItems: 'center',
    minHeight: 120,
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 28,
  },
  authorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  featuredBadge: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  featuredText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  activeDot: {
    backgroundColor: '#00FFA9',
  },
});