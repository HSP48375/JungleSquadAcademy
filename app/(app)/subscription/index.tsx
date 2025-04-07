import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Trophy, Star, Crown, Sparkles, Gamepad2, Book, Zap, Users, Check, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ParticleEffect from '@/components/ParticleEffect';

const SUBSCRIPTION_TIERS = [
  {
    id: 'prod_S44obWuTp3m86f',
    name: 'Single Tutor Plan',
    price: 4.99,
    features: [
      'Access to 1 tutor of your choice',
      'Full curriculum access',
      'All tutor-specific games',
      'Double XP for your chosen tutor'
    ],
    perks: [
      { icon: Trophy, text: '1.1x XP Multiplier', color: '#00FFA9' },
      { icon: Gamepad2, text: 'Basic Games Access', color: '#00AAFF' },
      { icon: Book, text: 'Single Tutor Curriculum', color: '#FF00AA' }
    ],
    icon: Star,
    gradient: ['#00FFA9', '#00CC88'],
    theme: 'default'
  },
  {
    id: 'prod_S44qmcQsAF4yyU',
    name: '5 Tutor Plan',
    price: 19.99,
    features: [
      'Access to any 5 tutors',
      'Switch tutors monthly',
      'Full feature access',
      'Premium learning analytics'
    ],
    perks: [
      { icon: Trophy, text: '1.25x XP Multiplier', color: '#00FFA9' },
      { icon: Gamepad2, text: 'Premium Games Access', color: '#00AAFF' },
      { icon: Book, text: '5 Tutor Curriculums', color: '#FF00AA' },
      { icon: Zap, text: '+1 Daily Challenge', color: '#FFD700' }
    ],
    icon: Trophy,
    gradient: ['#845EC2', '#D65DB1'],
    theme: 'history'
  },
  {
    id: 'prod_S45LA5uEvqGDm1',
    name: 'All Access Plan',
    price: 29.99,
    features: [
      'Access to all 10 tutors',
      'Unlimited everything',
      'Premium features & tools',
      'Advanced progress tracking'
    ],
    perks: [
      { icon: Trophy, text: '1.5x XP Multiplier', color: '#00FFA9' },
      { icon: Gamepad2, text: 'All Games Unlocked', color: '#00AAFF' },
      { icon: Book, text: 'All Tutor Curriculums', color: '#FF00AA' },
      { icon: Zap, text: 'Special Events Access', color: '#FFD700' }
    ],
    icon: Crown,
    gradient: ['#FFD700', '#FFA500'],
    theme: 'language'
  },
  {
    id: 'prod_S45MNphHMSIXeq',
    name: 'Elite Legend Squad',
    price: 49.99,
    features: [
      'Everything in All Access',
      'Double XP gains',
      'Exclusive cosmetics',
      'Beta feature access'
    ],
    perks: [
      { icon: Trophy, text: '2.0x XP Multiplier', color: '#00FFA9' },
      { icon: Sparkles, text: 'Exclusive Avatars', color: '#FFD700' },
      { icon: Gamepad2, text: 'Bonus Mini-Games', color: '#00AAFF' },
      { icon: Zap, text: 'Weekly XP Boosts', color: '#FF00AA' },
      { icon: Crown, text: 'Secret Missions', color: '#845EC2' }
    ],
    icon: Sparkles,
    gradient: ['#FF61D2', '#FE9090'],
    theme: 'art'
  }
];

export default function SubscriptionScreen() {
  const { session } = useAuth();
  const { subscription, loading, error, subscribe, cancelSubscription, updateSubscription } = useSubscription(session?.user?.id ?? '');
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (!session?.user) return;
    setProcessingTier(tierId);
    try {
      await subscribe(tierId);
    } catch (e) {
      console.error('Subscription error:', e);
    } finally {
      setProcessingTier(null);
    }
  };

  const handleUpdateSubscription = async (tierId: string) => {
    if (!session?.user || !subscription) return;
    setProcessingTier(tierId);
    try {
      await updateSubscription(tierId);
    } catch (e) {
      console.error('Update subscription error:', e);
    } finally {
      setProcessingTier(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session?.user || !subscription) return;
    setProcessingTier('cancelling');
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (e) {
      console.error('Cancel subscription error:', e);
    } finally {
      setProcessingTier(null);
    }
  };

  const confirmCancellation = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
        handleCancelSubscription();
      }
    } else {
      setShowCancelConfirm(true);
    }
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground theme="default" intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Level Up Your Learning</Text>
          <Text style={styles.subtitle}>Choose the perfect plan for your educational journey</Text>
        </View>

        {error && (
          <GlassmorphicCard
            glowColor="#FF4444"
            intensity="low"
            style={styles.errorContainer}
          >
            <View style={styles.errorContent}>
              <AlertCircle size={20} color="#FF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </GlassmorphicCard>
        )}

        {subscription && (
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="medium"
            style={styles.currentPlanContainer}
          >
            <Text style={styles.currentPlanTitle}>Your Current Plan</Text>
            <Text style={styles.currentPlanName}>{subscription.subscription_tiers?.name}</Text>
            <Text style={styles.currentPlanStatus}>
              Status: <Text style={styles.statusText}>{subscription.status === 'active' ? 'Active' : 'Inactive'}</Text>
            </Text>
            {subscription.current_period_end && (
              <Text style={styles.currentPlanExpiry}>
                Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
              </Text>
            )}
            
            {subscription.status === 'active' && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={confirmCancellation}
                disabled={processingTier === 'cancelling'}
              >
                {processingTier === 'cancelling' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                )}
              </TouchableOpacity>
            )}
          </GlassmorphicCard>
        )}

        {SUBSCRIPTION_TIERS.map((tier, index) => {
          const TierIcon = tier.icon;
          const isCurrentPlan = subscription?.subscription_tiers?.stripe_price_id === tier.id;
          const isUpgrade = subscription?.subscription_tiers?.price < tier.price;
          const isDowngrade = subscription?.subscription_tiers?.price > tier.price;
          const isProcessing = processingTier === tier.id;
          const isSelected = selectedTier === tier.id;
          
          return (
            <GlassmorphicCard
              key={tier.id}
              glowColor={tier.gradient[0]}
              intensity={isSelected || isCurrentPlan ? "high" : "medium"}
              style={[
                styles.tierCard,
                isCurrentPlan && styles.currentTierCard
              ]}
            >
              <TouchableOpacity
                style={styles.tierCardContent}
                onPress={() => setSelectedTier(isSelected ? null : tier.id)}
                activeOpacity={0.8}
              >
                <View style={styles.tierHeader}>
                  <View style={styles.tierInfo}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={tier.gradient}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <TierIcon size={32} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.price}>
                      ${tier.price}
                      <Text style={styles.perMonth}>/month</Text>
                    </Text>
                  </View>

                  {isCurrentPlan && (
                    <View style={styles.currentPlanBadge}>
                      <Check size={16} color="#000000" />
                      <Text style={styles.currentPlanText}>Current Plan</Text>
                    </View>
                  )}
                </View>

                <View style={styles.featuresList}>
                  {tier.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Check size={16} color={tier.gradient[0]} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                {/* XP Perks Section */}
                {isSelected && (
                  <View style={styles.perksSection}>
                    <Text style={styles.perksTitle}>Game Pass Perks:</Text>
                    <View style={styles.perksList}>
                      {tier.perks.map((perk, idx) => (
                        <View key={idx} style={styles.perkItem}>
                          <perk.icon size={16} color={perk.color} />
                          <Text style={[styles.perkText, { color: perk.color }]}>
                            {perk.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {!isCurrentPlan && (
                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      { backgroundColor: tier.gradient[0] }
                    ]}
                    onPress={() => subscription ? handleUpdateSubscription(tier.id) : handleSubscribe(tier.id)}
                    disabled={loading || isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <>
                        <Crown size={20} color="#000000" />
                        <Text style={styles.subscribeText}>
                          {subscription 
                            ? isUpgrade 
                              ? 'Upgrade Plan' 
                              : 'Switch Plan'
                            : 'Subscribe Now'
                          }
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </GlassmorphicCard>
          );
        })}

        <View style={styles.perks}>
          <Text style={styles.perksTitle}>All Plans Include</Text>
          
          <View style={styles.perksList}>
            <GlassmorphicCard
              glowColor="#00FFA9"
              intensity="low"
              style={styles.perkItem}
            >
              <Gamepad2 size={24} color="#00FFA9" />
              <Text style={styles.perkName}>Learning Games</Text>
              <Text style={styles.perkDesc}>Fun educational challenges</Text>
            </GlassmorphicCard>

            <GlassmorphicCard
              glowColor="#845EC2"
              intensity="low"
              style={styles.perkItem}
            >
              <Book size={24} color="#845EC2" />
              <Text style={styles.perkName}>Study Tracks</Text>
              <Text style={styles.perkDesc}>Guided learning paths</Text>
            </GlassmorphicCard>

            <GlassmorphicCard
              glowColor="#FFD700"
              intensity="low"
              style={styles.perkItem}
            >
              <Zap size={24} color="#FFD700" />
              <Text style={styles.perkName}>XP System</Text>
              <Text style={styles.perkDesc}>Track your progress</Text>
            </GlassmorphicCard>
          </View>
        </View>

        <Text style={styles.guarantee}>
          7-day money-back guarantee • Cancel anytime
        </Text>

        {showCancelConfirm && (
          <View style={styles.confirmOverlay}>
            <GlassmorphicCard
              glowColor="#FF4444"
              intensity="medium"
              style={styles.confirmDialog}
            >
              <Text style={styles.confirmTitle}>Cancel Subscription?</Text>
              <Text style={styles.confirmText}>
                You will lose access to premium features at the end of your current billing period.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.confirmCancelButton]}
                  onPress={() => setShowCancelConfirm(false)}
                >
                  <Text style={styles.confirmCancelText}>Keep Subscription</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.confirmConfirmButton]}
                  onPress={handleCancelSubscription}
                >
                  <Text style={styles.confirmConfirmText}>Yes, Cancel</Text>
                </TouchableOpacity>
              </View>
            </GlassmorphicCard>
          </View>
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  errorContainer: {
    marginBottom: 20,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  errorText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#FF4444',
    flex: 1,
  },
  currentPlanContainer: {
    padding: 20,
    marginBottom: 20,
  },
  currentPlanTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  currentPlanName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#00FFA9',
    marginBottom: 8,
  },
  currentPlanStatus: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusText: {
    color: '#00FFA9',
  },
  currentPlanExpiry: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  tierCard: {
    marginBottom: 20,
  },
  currentTierCard: {
    borderColor: '#00FFA9',
  },
  tierCardContent: {
    padding: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  tierInfo: {
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 255, 169, 0.3)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  price: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: '#00FFA9',
  },
  perMonth: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  currentPlanText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#000000',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  perksSection: {
    marginBottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  perksTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  perksList: {
    gap: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  subscribeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#000000',
  },
  perks: {
    marginBottom: 24,
  },
  perksTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  perksList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  perkItem: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    alignItems: 'center',
  },
  perkName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  perkDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  guarantee: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  confirmTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelButton: {
    backgroundColor: '#333333',
  },
  confirmCancelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  confirmConfirmButton: {
    backgroundColor: '#FF4444',
  },
  confirmConfirmText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});