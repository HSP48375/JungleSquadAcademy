import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Gift, Award, Share2, Sparkles, Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useReferral } from '@/hooks/useReferral';
import ReferralCard from '@/components/ReferralCard';
import RewardClaimModal from '@/components/RewardClaimModal';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import AvatarDisplay from '@/components/AvatarDisplay';

export default function ReferralsScreen() {
  const { session } = useAuth();
  const { 
    referralCode, 
    referralLink, 
    referrals, 
    pendingReferrals,
    totalCoins, 
    rewardTier,
    loading, 
    error, 
    shareReferralLink,
    redeemReferralCode,
    claimTierReward,
    refreshReferrals
  } = useReferral(session?.user?.id ?? '');
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  
  useEffect(() => {
    if (session?.user) {
      refreshReferrals();
    }
  }, [session]);
  
  // Show reward modal if eligible for unclaimed reward
  useEffect(() => {
    if (rewardTier && rewardTier.bonus > 0 && !rewardTier.claimed && !loading) {
      setShowRewardModal(true);
    }
  }, [rewardTier, loading]);
  
  const handleClaimReward = async () => {
    const success = await claimTierReward();
    if (success) {
      setShowRewardModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Your Tribe</Text>
          <Text style={styles.subtitle}>Share the jungle knowledge and earn rewards!</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <ReferralCard
          referralCode={referralCode || ''}
          referralLink={referralLink || ''}
          totalReferrals={referrals.length}
          totalCoins={totalCoins}
          onShare={shareReferralLink}
          onRedeem={redeemReferralCode}
        />

        <GlassmorphicCard
          glowColor={rewardTier.color}
          intensity="medium"
          style={styles.tierCard}
        >
          <View style={styles.tierHeader}>
            <Award size={24} color={rewardTier.color} />
            <Text style={[styles.tierTitle, { color: rewardTier.color }]}>
              {rewardTier.tier} Tier
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((referrals.length / 25) * 100, 100)}%`,
                    backgroundColor: rewardTier.color 
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {referrals.length}/25 Referrals
            </Text>
          </View>
          
          <View style={styles.tierLevels}>
            <View style={styles.tierLevel}>
              <View style={[styles.tierDot, referrals.length >= 5 && { backgroundColor: '#C0C0C0' }]} />
              <Text style={styles.tierLevelText}>5</Text>
            </View>
            <View style={styles.tierLevel}>
              <View style={[styles.tierDot, referrals.length >= 10 && { backgroundColor: '#FFD700' }]} />
              <Text style={styles.tierLevelText}>10</Text>
            </View>
            <View style={styles.tierLevel}>
              <View style={[styles.tierDot, referrals.length >= 25 && { backgroundColor: '#00FFFF' }]} />
              <Text style={styles.tierLevelText}>25</Text>
            </View>
          </View>
          
          {rewardTier.bonus > 0 && rewardTier.claimed && (
            <View style={styles.bonusContainer}>
              <Trophy size={16} color={rewardTier.color} />
              <Text style={[styles.bonusText, { color: rewardTier.color }]}>
                {rewardTier.tier} Tier Unlocked!
              </Text>
            </View>
          )}
          
          {rewardTier.bonus > 0 && !rewardTier.claimed && (
            <TouchableOpacity 
              style={[styles.claimButton, { backgroundColor: rewardTier.color }]}
              onPress={() => setShowRewardModal(true)}
            >
              <Sparkles size={16} color="#000000" />
              <Text style={styles.claimButtonText}>
                Claim {rewardTier.bonus} Coin Bonus
              </Text>
            </TouchableOpacity>
          )}
        </GlassmorphicCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          <TouchableOpacity 
            style={styles.leaderboardButton}
            onPress={() => router.push('/community/leaderboard')}
          >
            <Trophy size={16} color="#FFD700" />
            <Text style={styles.leaderboardText}>Leaderboard</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading referrals...</Text>
        ) : referrals.length > 0 ? (
          <>
            {referrals.map((referral) => (
              <GlassmorphicCard
                key={referral.id}
                glowColor="#00FFA9"
                intensity="low"
                style={styles.referralItem}
              >
                <View style={styles.referralContent}>
                  <AvatarDisplay
                    species={referral.referred.avatar.species.name}
                    name={referral.referred.avatar.avatar_name}
                    primaryColor={referral.referred.avatar.primary_color}
                    size="small"
                  />
                  
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>
                      {referral.referred.avatar.avatar_name}
                    </Text>
                    <Text style={styles.referralDate}>
                      Joined {new Date(referral.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.rewardBadge}>
                    <Coins size={14} color="#FFD700" />
                    <Text style={styles.rewardText}>+{referral.coins_earned}</Text>
                  </View>
                </View>
              </GlassmorphicCard>
            ))}
            
            {pendingReferrals.length > 0 && (
              <>
                <Text style={styles.pendingTitle}>Pending Invites</Text>
                {pendingReferrals.map((referral) => (
                  <GlassmorphicCard
                    key={referral.id}
                    glowColor="#666666"
                    intensity="low"
                    style={styles.referralItem}
                  >
                    <View style={styles.referralContent}>
                      <AvatarDisplay
                        species={referral.referred.avatar.species.name}
                        name={referral.referred.avatar.avatar_name}
                        primaryColor={referral.referred.avatar.primary_color}
                        size="small"
                      />
                      
                      <View style={styles.referralInfo}>
                        <Text style={styles.referralName}>
                          {referral.referred.avatar.avatar_name}
                        </Text>
                        <Text style={styles.pendingText}>
                          Waiting for first login
                        </Text>
                      </View>
                      
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                    </View>
                  </GlassmorphicCard>
                ))}
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Users size={48} color="#666666" />
            <Text style={styles.emptyText}>
              You haven't referred anyone yet. Share your code to start earning rewards!
            </Text>
            <TouchableOpacity 
              style={styles.shareAgainButton}
              onPress={shareReferralLink}
            >
              <Share2 size={20} color="#00FFA9" />
              <Text style={styles.shareAgainText}>Share Your Code</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="low"
          style={styles.howItWorksCard}
        >
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Invite friends using your unique referral code
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friends Join</Text>
              <Text style={styles.stepDescription}>
                When they sign up using your code, you both get 5 coins
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Unlock Tiers</Text>
              <Text style={styles.stepDescription}>
                Reach milestones to earn bonus rewards and exclusive perks
              </Text>
            </View>
          </View>
        </GlassmorphicCard>
      </ScrollView>
      
      {showRewardModal && (
        <RewardClaimModal
          tier={rewardTier.tier}
          reward={rewardTier.bonus}
          onClaim={handleClaimReward}
          onClose={() => setShowRewardModal(false)}
        />
      )}
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  tierCard: {
    padding: 20,
    marginBottom: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tierTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFD700',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'right',
  },
  tierLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tierLevel: {
    alignItems: 'center',
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
  },
  tierLevelText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  bonusText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFD700',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  claimButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  leaderboardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  referralItem: {
    marginBottom: 12,
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  referralInfo: {
    flex: 1,
    marginLeft: 16,
  },
  referralName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  referralDate: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  pendingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  pendingBadge: {
    backgroundColor: 'rgba(102, 102, 102, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#888888',
  },
  pendingTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
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
    marginTop: 16,
    marginBottom: 24,
  },
  shareAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  shareAgainText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
  },
  howItWorksCard: {
    padding: 20,
    marginTop: 24,
  },
  howItWorksTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 255, 169, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
});

// Add Coins component for TypeScript
const Coins = ({ size, color }: { size: number; color: string }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ 
        width: size * 0.8, 
        height: size * 0.8, 
        borderRadius: size * 0.4, 
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)'
      }}>
        <Text style={{ 
          fontFamily: 'SpaceGrotesk-Bold', 
          fontSize: size * 0.4, 
          color: '#000000' 
        }}>$</Text>
      </View>
    </View>
  );
};