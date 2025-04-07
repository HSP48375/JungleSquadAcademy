import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useXP } from '@/hooks/useXP';
import { useAvatarOfWeek } from '@/hooks/useAvatarOfWeek';
import { useCompetitions } from '@/hooks/useCompetitions';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  FadeInDown
} from 'react-native-reanimated';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ParticleEffect from '@/components/ParticleEffect';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import XPBar from '@/components/XPBar';
import XPGainAnimation from '@/components/XPGainAnimation';
import QuoteCarousel from '@/components/QuoteCarousel';
import AvatarOfWeek from '@/components/AvatarOfWeek';
import CompetitionCard from '@/components/CompetitionCard';
import { useState, useEffect } from 'react';

const tutors = [
  {
    id: 'tango',
    name: 'Tango',
    animal: 'Tiger',
    subject: 'Mathematics',
    catchphrase: "Let's pounce on those equations!",
    primaryColor: '#FF7B54',
    secondaryColor: '#FFB26B',
  },
  {
    id: 'zara',
    name: 'Zara',
    animal: 'Zebra',
    subject: 'History & Geography',
    catchphrase: "Stripe by stripe, we uncover the past!",
    primaryColor: '#845EC2',
    secondaryColor: '#D65DB1',
  },
  {
    id: 'milo',
    name: 'Milo',
    animal: 'Monkey',
    subject: 'Language Arts',
    catchphrase: "Let's swing into storytelling!",
    primaryColor: '#00C6A7',
    secondaryColor: '#1E4D92',
  },
];

export default function Home() {
  const { session } = useAuth();
  const { xp, addXP, getXPMultiplier } = useXP(session?.user?.id ?? '');
  const { winner: avatarOfWeek } = useAvatarOfWeek();
  const { activeCompetition, participation, joinCompetition } = useCompetitions(session?.user?.id ?? '');
  const userName = session?.user?.email?.split('@')[0] || 'Explorer';
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGainAmount, setXpGainAmount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Animation values
  const heroScale = useSharedValue(0.95);
  const heroOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);
  const streakFlameScale = useSharedValue(1);
  const streakFlameOpacity = useSharedValue(0.8);

  // Set up animations
  useEffect(() => {
    heroScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    heroOpacity.value = withTiming(1, { duration: 800 });
    
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Streak flame animation
    if (xp.streak >= 3) {
      streakFlameScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      streakFlameOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
    
    // Award login XP (this would normally be handled by the backend)
    const awardLoginXP = async () => {
      // Check if we've already awarded XP today
      const lastLoginDate = localStorage.getItem('lastLoginXP');
      const today = new Date().toDateString();
      
      if (lastLoginDate !== today) {
        // Add a slight delay for better UX
        setTimeout(() => {
          setXpGainAmount(5);
          setShowXPGain(true);
          localStorage.setItem('lastLoginXP', today);
        }, 1500);
      }
    };
    
    if (session?.user) {
      awardLoginXP();
    }
  }, [session, xp.streak]);
  
  // Animated styles
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const streakFlameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakFlameScale.value }],
    opacity: streakFlameOpacity.value,
  }));
  
  // Handle XP gain animation completion
  const handleXPGainComplete = () => {
    setShowXPGain(false);
    addXP(xpGainAmount, 'daily_login');
  };
  
  // Handle level up
  const handleLevelUp = () => {
    setShowLevelUp(true);
  };
  
  // Handle joining active competition
  const handleJoinCompetition = () => {
    if (activeCompetition) {
      joinCompetition(activeCompetition.id);
    }
  };
  
  // Check if user is participating in active competition
  const isParticipating = activeCompetition 
    ? participation[activeCompetition.id]?.opted_in 
    : false;
  
  // Get progress for active competition
  const competitionProgress = activeCompetition && isParticipating
    ? {
        totalXp: participation[activeCompetition.id].total_xp,
        challengesCompleted: participation[activeCompetition.id].challenges_completed
      }
    : undefined;

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {userName}!</Text>
          <Text style={styles.subtitle}>Your jungle guides await</Text>
          
          {/* XP Bar */}
          <View style={styles.xpBarContainer}>
            <XPBar
              level={xp.level}
              progress={xp.levelProgress}
              streak={xp.streak}
              todayXP={xp.today}
              onLevelUp={handleLevelUp}
            />
          </View>
        </View>

        {/* Active Competition (if available) */}
        {activeCompetition && (
          <Animated.View entering={FadeInDown.duration(800)}>
            <CompetitionCard
              id={activeCompetition.id}
              title={activeCompetition.title}
              description={activeCompetition.description}
              subject={activeCompetition.subject}
              startDate={activeCompetition.start_date}
              endDate={activeCompetition.end_date}
              hasLeaderboard={activeCompetition.leaderboard_enabled}
              participationThreshold={activeCompetition.participation_threshold}
              participationReward={activeCompetition.participation_reward}
              isParticipating={isParticipating}
              progress={competitionProgress}
              onJoin={handleJoinCompetition}
              onPress={() => router.push(`/competitions/${activeCompetition.id}?title=${activeCompetition.title}`)}
            />
          </Animated.View>
        )}

        {/* Avatar of the Week (if available) */}
        {avatarOfWeek && (
          <Animated.View entering={FadeInDown.duration(800)}>
            <AvatarOfWeek
              avatar={{
                name: avatarOfWeek.winner.avatar.avatar_name,
                species: avatarOfWeek.winner.avatar.species.name,
                primaryColor: avatarOfWeek.winner.avatar.primary_color,
                secondaryColor: avatarOfWeek.winner.avatar.secondary_color,
                visualEffects: avatarOfWeek.winner.avatar.species.visual_effects,
                idleAnimation: avatarOfWeek.winner.avatar.species.idle_animation,
              }}
              stats={{
                weeklyXp: avatarOfWeek.stats.weekly_xp,
                activeDays: avatarOfWeek.stats.active_days,
                tutorsEngaged: avatarOfWeek.stats.tutors_engaged,
              }}
            />
          </Animated.View>
        )}

        {/* Featured Quote */}
        <QuoteCarousel />

        <Animated.View style={[styles.heroSection, heroStyle]}>
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="high"
            style={styles.heroCard}
          >
            <Animated.View style={[styles.heroGlow, glowStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(0, 255, 169, 0.2)']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            
            <ParticleEffect count={10} intensity="low" />
            
            <Text style={styles.heroTitle}>The World's Most Advanced AI Tutoring Ecosystem</Text>
            <Text style={styles.heroSubtitle}>Join the squad. Transform your potential.</Text>
            
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => router.push('/chat')}
            >
              <LinearGradient
                colors={['#00FFA9', '#00CC88']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.heroButtonText}>Start Learning</Text>
            </TouchableOpacity>
            
            {/* Streak flames for 3+ day streaks */}
            {xp.streak >= 3 && (
              <Animated.View style={[styles.streakFlames, streakFlameStyle]}>
                <LinearGradient
                  colors={xp.streak >= 7 
                    ? ['#FF0000', '#FF6600'] 
                    : xp.streak >= 5 
                      ? ['#FF6600', '#FFCC00'] 
                      : ['#FFCC00', '#FFFF00']}
                  style={styles.streakGradient}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
              </Animated.View>
            )}
            
            {/* Cyberpunk circuit decoration */}
            <View style={styles.circuitDecoration}>
              <View style={styles.circuit} />
              <View style={styles.circuitDot} />
              <View style={[styles.circuit, styles.circuit2]} />
              <View style={[styles.circuitDot, styles.circuitDot2]} />
            </View>
          </GlassmorphicCard>
        </Animated.View>
        
        <Text style={styles.sectionTitle}>Your Tutors</Text>
        
        {tutors.map((tutor, index) => (
          <Animated.View 
            key={tutor.id}
            entering={FadeInDown.delay(index * 100).duration(400)}
          >
            <GlassmorphicCard
              glowColor={tutor.primaryColor}
              intensity="medium"
              style={styles.tutorCard}
            >
              <TouchableOpacity 
                style={styles.tutorCardContent}
                onPress={() => router.push(`/chat/${tutor.id}`)}
                activeOpacity={0.8}
              >
                <AvatarDisplay
                  species={tutor.animal}
                  name={tutor.name}
                  primaryColor={tutor.primaryColor}
                  secondaryColor={tutor.secondaryColor}
                  size="medium"
                  showName={false}
                  subject={tutor.subject}
                />
                
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{tutor.name} the {tutor.animal}</Text>
                  <Text style={[styles.tutorSubject, { color: tutor.primaryColor }]}>{tutor.subject}</Text>
                  <Text style={styles.tutorCatchphrase}>"{tutor.catchphrase}"</Text>
                </View>
              </TouchableOpacity>
              
              {/* Cyberpunk circuit decoration */}
              <View style={styles.tutorCircuitDecoration}>
                <View style={[styles.tutorCircuit, { backgroundColor: tutor.primaryColor + '60' }]} />
                <View style={[styles.tutorCircuitDot, { backgroundColor: tutor.primaryColor }]} />
              </View>
            </GlassmorphicCard>
          </Animated.View>
        ))}
      </ScrollView>
      
      {/* XP Gain Animation */}
      {showXPGain && (
        <XPGainAnimation
          amount={xpGainAmount}
          multiplier={getXPMultiplier()}
          position={{ x: 20, y: 120 }}
          onComplete={handleXPGainComplete}
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
  greeting: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#B794F6',
    marginBottom: 16,
  },
  xpBarContainer: {
    marginTop: 8,
  },
  heroSection: {
    marginBottom: 30,
  },
  heroCard: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  heroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#B794F6',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 255, 169, 0.4)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  heroButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#000',
  },
  streakFlames: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.8,
  },
  streakGradient: {
    width: '100%',
    height: '100%',
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 30,
    opacity: 0.6,
  },
  circuit: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 30,
    height: 1,
    backgroundColor: '#00FFA9',
  },
  circuit2: {
    bottom: 20,
    right: 10,
    width: 20,
    transform: [{ rotate: '90deg' }],
  },
  circuitDot: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00FFA9',
  },
  circuitDot2: {
    bottom: 20,
    right: 10,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  tutorCard: {
    marginBottom: 16,
  },
  tutorCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  tutorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  tutorName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  tutorSubject: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#00FFA9',
    marginBottom: 4,
  },
  tutorCatchphrase: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  tutorCircuitDecoration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 20,
    opacity: 0.6,
  },
  tutorCircuit: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 20,
    height: 1,
  },
  tutorCircuitDot: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});