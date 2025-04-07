import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Trophy, Star } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareableQuoteCard from './ShareableQuoteCard';
import ShareButton from './ShareButton';

interface QuoteSharingProps {
  quote: {
    id: string;
    text: string;
    author: {
      name: string;
      species: string;
      primaryColor: string;
      secondaryColor?: string;
    };
    theme: string;
    votes: number;
    xpAwarded: number;
    coinsAwarded: number;
  };
  onShare: (platform: 'twitter' | 'instagram' | 'facebook' | 'message' | 'other') => Promise<boolean>;
  shareCount: number;
}

export default function QuoteSharing({ quote, onShare, shareCount }: QuoteSharingProps) {
  const quoteCardRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardEarned, setRewardEarned] = useState(false);

  const handleShare = async (platform: 'twitter' | 'instagram' | 'facebook' | 'message' | 'other') => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await onShare(platform);
      
      if (success) {
        setRewardEarned(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share This Quote</Text>
        <Text style={styles.subtitle}>Spread wisdom, earn rewards</Text>
      </View>
      
      <View style={styles.cardContainer}>
        <View ref={quoteCardRef} collapsable={false}>
          <ShareableQuoteCard quote={quote} />
        </View>
      </View>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
  cardContainer: {
    alignItems: 'center',
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
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
  },
});