import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Copy, Users, Coins, Gift, AlertCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import GlassmorphicCard from '@/components/GlassmorphicCard';

interface ReferralCardProps {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalCoins: number;
  onShare: () => void;
  onRedeem?: (code: string) => Promise<{ success: boolean; reward?: number; error?: string }>;
}

export default function ReferralCard({
  referralCode,
  referralLink,
  totalReferrals,
  totalCoins,
  onShare,
  onRedeem
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim() || !onRedeem) return;
    
    setIsRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);
    
    try {
      const result = await onRedeem(redeemCode.trim());
      
      if (result.success) {
        setRedeemSuccess(`Success! You earned ${result.reward} coins.`);
        setRedeemCode('');
      } else {
        setRedeemError(result.error || 'Failed to redeem code');
      }
    } catch (e) {
      setRedeemError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <GlassmorphicCard
      glowColor="#FFD700"
      intensity="medium"
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Invite Friends, Earn Rewards</Text>
        <Text style={styles.subtitle}>
          Share your referral code and both you and your friend will get 5 coins!
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Users size={24} color="#00FFA9" />
          <Text style={styles.statValue}>{totalReferrals}</Text>
          <Text style={styles.statLabel}>Invites</Text>
        </View>
        
        <View style={styles.statItem}>
          <Coins size={24} color="#FFD700" />
          <Text style={styles.statValue}>{totalCoins}</Text>
          <Text style={styles.statLabel}>Coins Earned</Text>
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{referralCode}</Text>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(referralCode)}
          >
            <Copy size={20} color="#00FFA9" />
          </TouchableOpacity>
        </View>
        {copied && (
          <Text style={styles.copiedText}>Copied to clipboard!</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={onShare}
        >
          <LinearGradient
            colors={['#00FFA9', '#00CC88']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Share2 size={20} color="#000000" />
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </TouchableOpacity>
      </View>

      {onRedeem && (
        <View style={styles.redeemContainer}>
          <Text style={styles.redeemLabel}>Have a referral code?</Text>
          <View style={styles.redeemInputContainer}>
            <TextInput
              style={styles.redeemInput}
              value={redeemCode}
              onChangeText={setRedeemCode}
              placeholder="Enter code here"
              placeholderTextColor="#666666"
            />
            <TouchableOpacity
              style={[
                styles.redeemButton,
                (!redeemCode.trim() || isRedeeming) && styles.redeemButtonDisabled
              ]}
              onPress={handleRedeem}
              disabled={!redeemCode.trim() || isRedeeming}
            >
              <Gift size={16} color="#000000" />
              <Text style={styles.redeemButtonText}>
                {isRedeeming ? 'Redeeming...' : 'Redeem'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {redeemError && (
            <View style={styles.messageContainer}>
              <AlertCircle size={16} color="#FF4444" />
              <Text style={styles.errorText}>{redeemError}</Text>
            </View>
          )}
          
          {redeemSuccess && (
            <View style={styles.messageContainer}>
              <Gift size={16} color="#00FFA9" />
              <Text style={styles.successText}>{redeemSuccess}</Text>
            </View>
          )}
        </View>
      )}
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
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
    color: '#AAAAAA',
  },
  codeContainer: {
    marginBottom: 20,
  },
  codeLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  code: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFD700',
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    padding: 8,
  },
  copiedText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#00FFA9',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(0, 255, 169, 0.5)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
  },
  shareButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  redeemContainer: {
    marginTop: 8,
  },
  redeemLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  redeemInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  redeemInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    marginRight: 8,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
  },
  successText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
  },
});