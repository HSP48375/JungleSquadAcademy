import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quote, Crown, Users, MessageSquare, Trophy, Share2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarOfWeek } from '@/hooks/useAvatarOfWeek';
import { useReferral } from '@/hooks/useReferral';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import AvatarDisplay from '@/components/AvatarDisplay';
import QuoteCarousel from '@/components/QuoteCarousel';

export default function CommunityScreen() {
  const { session } = useAuth();
  const { winner, loading } = useAvatarOfWeek();
  const { referralCode, referrals, shareReferralLink } = useReferral(session?.user?.id ?? '');

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Jungle Community</Text>
          <Text style={styles.subtitle}>Connect, share, and grow together</Text>
        </View>

        {/* Avatar of the Week Preview */}
        <GlassmorphicCard
          glowColor="#FFD700"
          intensity="high"
          style={styles.featuredCard}
        >
          <View style={styles.cardHeader}>
            <Crown size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Avatar of the Week</Text>
          </View>
          
          {loading ? (
            <Text style={styles.loadingText}>Loading featured avatar...</Text>
          ) : winner ? (
            <View style={styles.winnerPreview}>
              <AvatarDisplay
                species={winner.winner.avatar.species.name}
                name={winner.winner.avatar.avatar_name}
                primaryColor={winner.winner.avatar.primary_color}
                secondaryColor={winner.winner.avatar.secondary_color}
                size="medium"
              />
              
              <View style={styles.winnerInfo}>
                <Text style={styles.winnerName}>{winner.winner.avatar.avatar_name}</Text>
                <Text style={styles.winnerStats}>
                  {winner.stats.weekly_xp} XP • {winner.stats.active_days} Day Streak
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noContentText}>No featured avatar this week.</Text>
          )}
          
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => router.push('/community/avatar-of-week')}
          >
            <Text style={styles.viewMoreText}>View Hall of Fame</Text>
          </TouchableOpacity>
        </GlassmorphicCard>

        {/* Referral Preview */}
        <GlassmorphicCard
          glowColor="#00AAFF"
          intensity="medium"
          style={styles.featuredCard}
        >
          <View style={styles.cardHeader}>
            <Share2 size={24} color="#00AAFF" />
            <Text style={styles.cardTitle}>Invite Friends</Text>
          </View>
          
          <View style={styles.referralPreview}>
            <Text style={styles.referralText}>
              Share your referral code and both you and your friend will get 5 coins!
            </Text>
            
            {referralCode && (
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeLabel}>Your Code:</Text>
                <Text style={styles.referralCode}>{referralCode}</Text>
              </View>
            )}
            
            <View style={styles.referralStats}>
              <View style={styles.referralStat}>
                <Text style={styles.referralStatValue}>{referrals.length}</Text>
                <Text style={styles.referralStatLabel}>Friends Invited</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={shareReferralLink}
              >
                <Share2 size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => router.push('/community/referrals')}
          >
            <Text style={styles.viewMoreText}>Manage Referrals</Text>
          </TouchableOpacity>
        </GlassmorphicCard>

        {/* Quotes Preview */}
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="medium"
          style={styles.featuredCard}
        >
          <View style={styles.cardHeader}>
            <Quote size={24} color="#00FFA9" />
            <Text style={styles.cardTitle}>Featured Quotes</Text>
          </View>
          
          <QuoteCarousel />
          
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => router.push('/community/quotes')}
          >
            <Text style={styles.viewMoreText}>View All Quotes</Text>
          </TouchableOpacity>
        </GlassmorphicCard>

        {/* Community Features */}
        <Text style={styles.sectionTitle}>Community Features</Text>
        
        <View style={styles.featuresGrid}>
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.featureCard}
          >
            <TouchableOpacity 
              style={styles.featureContent}
              onPress={() => router.push('/community/quotes')}
            >
              <MessageSquare size={32} color="#00FFA9" />
              <Text style={styles.featureName}>Submit a Quote</Text>
              <Text style={styles.featureDescription}>
                Share your wisdom with the jungle
              </Text>
            </TouchableOpacity>
          </GlassmorphicCard>
          
          <GlassmorphicCard
            glowColor="#FFD700"
            intensity="low"
            style={styles.featureCard}
          >
            <TouchableOpacity 
              style={styles.featureContent}
              onPress={() => router.push('/community/referrals')}
            >
              <Users size={32} color="#FFD700" />
              <Text style={styles.featureName}>Referral Program</Text>
              <Text style={styles.featureDescription}>
                Invite friends, earn rewards
              </Text>
            </TouchableOpacity>
          </GlassmorphicCard>
          
          <GlassmorphicCard
            glowColor="#FF69B4"
            intensity="low"
            style={styles.featureCard}
          >
            <TouchableOpacity 
              style={styles.featureContent}
              onPress={() => router.push('/competitions')}
            >
              <Trophy size={32} color="#FF69B4" />
              <Text style={styles.featureName}>Competitions</Text>
              <Text style={styles.featureDescription}>
                Compete and win prizes
              </Text>
            </TouchableOpacity>
          </GlassmorphicCard>
        </View>
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
  featuredCard: {
    marginBottom: 24,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 20,
  },
  noContentText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 20,
  },
  winnerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  winnerInfo: {
    marginLeft: 16,
  },
  winnerName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  winnerStats: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFD700',
  },
  referralPreview: {
    marginBottom: 20,
  },
  referralText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  referralCodeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.3)',
    alignItems: 'center',
  },
  referralCodeLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  referralCode: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#00AAFF',
  },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralStat: {
    alignItems: 'center',
  },
  referralStatValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  referralStatLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 170, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  shareButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  viewMoreButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewMoreText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: '100%',
    marginBottom: 0,
    ...Platform.select({
      web: {
        width: 'calc(33.33% - 12px)',
      },
    }),
  },
  featureContent: {
    padding: 20,
    alignItems: 'center',
  },
  featureName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
  },
});