import { useState } from 'react';
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { supabase } from '@/lib/supabase';

interface QuoteShareOptions {
  quoteId: string;
  platform: 'twitter' | 'instagram' | 'facebook' | 'message' | 'other';
}

export function useQuoteSharing(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState(0);

  const shareQuote = async (
    viewRef: React.RefObject<any>,
    options: QuoteShareOptions
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Capture the view as an image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'file',
      });

      // Track the share in the database
      const { error: trackError } = await supabase.rpc('track_quote_share', {
        p_user_id: userId,
        p_quote_id: options.quoteId,
        p_platform: options.platform,
      });

      if (trackError) {
        console.warn('Failed to track share:', trackError);
        // Continue with sharing even if tracking fails
      }

      // Share the image
      if (Platform.OS === 'web') {
        // Web sharing
        try {
          const blob = await (await fetch(uri)).blob();
          const file = new File([blob], 'jungle-squad-quote.png', { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Check out this quote from Jungle Squad Academy!',
              text: 'I found this amazing quote in Jungle Squad Academy!',
              files: [file],
            });
          } else {
            // Fallback for browsers that don't support file sharing
            await navigator.share({
              title: 'Check out this quote from Jungle Squad Academy!',
              text: 'I found this amazing quote in Jungle Squad Academy!',
              url: 'https://academy.junglesquad.com',
            });
          }
        } catch (e) {
          console.error('Web sharing failed:', e);
          throw new Error('Sharing is not supported on this browser');
        }
      } else {
        // Native sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share this quote',
            UTI: 'public.png',
          });
        } else {
          // Fallback to React Native's Share API
          await Share.share({
            title: 'Check out this quote from Jungle Squad Academy!',
            message: 'I found this amazing quote in Jungle Squad Academy!',
            url: uri,
          });
        }
      }

      // Award XP and coins for sharing
      await awardSharingRewards(userId, options.quoteId, options.platform);
      
      // Update share count
      setShareCount(prev => prev + 1);
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share quote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const awardSharingRewards = async (
    userId: string,
    quoteId: string,
    platform: string
  ) => {
    try {
      // Call the edge function to award rewards
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/track-quote-share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          quoteId,
          platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Failed to award sharing rewards:', errorData.error);
      }
    } catch (e) {
      console.warn('Error awarding sharing rewards:', e);
    }
  };

  const getShareCount = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from('quote_winners')
        .select('share_count')
        .eq('id', quoteId)
        .single();

      if (error) throw error;
      setShareCount(data?.share_count || 0);
      return data?.share_count || 0;
    } catch (e) {
      console.warn('Error fetching share count:', e);
      return 0;
    }
  };

  return {
    shareQuote,
    getShareCount,
    shareCount,
    loading,
    error,
  };
}