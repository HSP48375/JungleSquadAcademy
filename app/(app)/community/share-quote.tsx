import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Trophy, Star, Heart } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQuoteSharing } from '@/hooks/useQuoteSharing';
import ShareableQuoteCard from '@/components/ShareableQuoteCard';
import ShareButton from '@/components/ShareButton';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function ShareQuoteScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const quoteCardRef = useRef(null);
  const { shareQuote, getShareCount, shareCount, loading, error } = useQuoteSharing(session?.user?.id ?? '');
  
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(false);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const titleGlow = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    // Card scale animation
    cardScale.value = withTiming(1, { 
      duration: 800, 
      easing: Easing.out(Easing.back) 
    });
    
    // Title glow animation
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  
  const titleGlowStyle = useAnimatedStyle(() => ({
    opacity: titleGlow.value,
  }));
  
  // Fetch quote details
  useEffect(() => {
    if (id) {
      fetchQuoteDetails();
      getShareCount(id as string);
    }
  }, [id]);
  
  const fetchQuoteDetails = async () => {
    try {
      setLoadingQuote(true);
      
      const { data, error: fetchError } = await supabase
        .from('quote_winners')
        .select(`
          *,
          entry:quote_entries!inner(
            id,
            quote_text,
            user:profiles!inner(
              avatar:user_avatar!inner(
                avatar_name,
                primary_color,
                secondary_color,
                species:avatar_species(name)
              )
            )
          ),
          theme:quote_themes!inner(theme)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      
      setQuote({
        id: data.id,
        text: data.entry.quote_text,
        author: {
          name: data.entry.user.avatar.avatar_name,
          species: data.entry.user.avatar.species.name,
          primaryColor: data.entry.user.avatar.primary_color,
          secondaryColor: data.entry.user.avatar.secondary_color,
        },
        theme: data.theme.theme,
        votes: data.votes_count,
        xpAwarded: data.xp_awarded,
        coinsAwarded: data.coins_awarded,
      });
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : 'Failed to fetch quote details');
    } finally {
      setLoadingQuote(false);
    }
  };
  
  // Handle share
  const handleShare = async (platform: 'twitter' | 'instagram' | 'facebook' | 'message' | 'other') => {
    if (!quote) return;
    
    const success = await shareQuote(quoteCardRef, {
      quoteId: quote.id,
      platform,
    });
    
    if (success) {
      setShowConfetti(true);
      setRewardEarned(true);
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      {showConfetti && (
        <ConfettiCannon
          count={100}
          origin={{ x: 0, y: 0 }}
          autoStart={true}
          fadeOut={true}
          colors={['#00FFA9', '#FFD700', '#FF69B4', '#00AAFF']}
        />
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Animated.View style={[styles.titleGlow, titleGlowStyle]}>
            <LinearGradient
              colors={['transparent', '#00FFA9']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          
          <Text style={styles.title}>Share This Quote</Text>
          <Text style={styles.subtitle}>Spread wisdom, earn rewards</Text>
        </View>

        {quoteError && (
          <Text style={styles.errorText}>{quoteError}</Text>
        )}

        {loadingQuote ? (
          <Text style={styles.loadingText}>Loading quote...</Text>
        ) : quote ? (
          <>
            <Animated.View 
              style={[styles.cardContainer, cardStyle]}
              entering={FadeIn.duration(800)}
            >
              <View ref={quoteCardRef} collapsable={false}>
                <ShareableQuoteCard quote={quote} />
              </View>
            </Animated.View>
            
            <View style={styles.shareSection}>
              <Text style={styles.shareTitle}>Ready to Share?</Text>
              <Text style={styles.shareText}>
                Share this quote with your friends and earn 10 XP and 5 Jungle Coins!
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Share2 size={16} color="#00FFA9" />
                  <Text style={styles.statText}>
                    {shareCount} {shareCount === 1 ? 'Share' : 'Shares'}
                  </Text>
                </View>
                
                {rewardEarned && (
                  <View style={styles.rewardBadge}>
                    <Star size={16} color="#FFD700" />
                    <Text style={styles.rewardText}>Rewards Earned!</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.shareButtonContainer}>
                <ShareButton
                  onShare={handleShare}
                  disabled={loading}
                  size="large"
                  color="#00FFA9"
                />
              </View>
              
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>
            
            <View style={styles.infoContainer}>
              <Heart size={16} color="#FF69B4" />
              <Text style={styles.infoText}>
                Sharing quotes helps grow our community and spreads positivity!
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.errorText}>Quote not found</Text>
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
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  titleGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
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
    marginVertical: 16,
  },
  cardContainer: {
    marginVertical: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },
  shareSection: {
    width: '100%',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 24,
  },
  shareTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  shareText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFD700',
  },
  shareButtonContainer: {
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
    gap: 12,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
});