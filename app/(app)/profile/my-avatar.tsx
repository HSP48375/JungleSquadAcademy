import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { useProgress } from '@/hooks/useProgress';
import { useXP } from '@/hooks/useXP';
import { Edit3, Trophy, Star, Crown, Zap, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import AvatarDisplay from '@/components/AvatarDisplay';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import XPBar from '@/components/XPBar';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function MyAvatarScreen() {
  const { session } = useAuth();
  const { avatar, unlocks, loading: avatarLoading } = useAvatar(session?.user?.id ?? '');
  const { progress, loading: progressLoading } = useProgress(session?.user?.id ?? '');
  const { xp, loading: xpLoading } = useXP(session?.user?.id ?? '');
  const [showEditMenu, setShowEditMenu] = useState(false);
  
  // Animation values
  const heroScale = useSharedValue(0.95);
  const heroOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    heroScale.value = withSpring(1, { damping: 12 });
    heroOpacity.value = withSpring(1);
    
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const joinDate = new Date(avatar?.created_at ?? Date.now());

  if (avatarLoading || progressLoading || xpLoading) {
    return (
      <View style={styles.container}>
        <ImmersiveBackground intensity="medium" />
        <Text style={styles.loadingText}>Loading your jungle identity...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            
            <AvatarDisplay
              species={avatar?.species?.name ?? ''}
              name={avatar?.avatar_name ?? ''}
              primaryColor={avatar?.primary_color ?? '#00FFA9'}
              secondaryColor={avatar?.secondary_color ?? '#333333'}
              visualEffects={avatar?.species?.visual_effects}
              idleAnimation={avatar?.species?.idle_animation}
              size="large"
              showName={false}
            />

            <View style={styles.heroInfo}>
              <Text style={styles.avatarName}>{avatar?.avatar_name}</Text>
              <Text style={styles.speciesName}>{avatar?.species?.name}</Text>
              <Text style={styles.joinDate}>
                Jungle Member since {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setShowEditMenu(true)}
              >
                <Edit3 size={20} color="#000" />
                <Text style={styles.editButtonText}>Customize My Avatar</Text>
              </TouchableOpacity>
            </View>
          </GlassmorphicCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="medium"
            style={styles.statsCard}
          >
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Level {xp.level}</Text>
              <Text style={styles.xpText}>{xp.total} XP Total</Text>
            </View>

            <XPBar
              level={xp.level}
              progress={xp.levelProgress}
              streak={xp.streak}
              todayXP={xp.today}
              showLevel={false}
              size="medium"
            />

            <View style={styles.streakInfo}>
              <Zap size={20} color="#FFD700" />
              <Text style={styles.streakText}>
                {xp.streak > 0 
                  ? `${xp.streak}-day learning streak!` 
                  : 'Start your streak today!'}
              </Text>
            </View>
          </GlassmorphicCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={24} color="#00FFA9" />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsScroll}
          >
            {progress?.map((p, index) => (
              p.xp_points >= 100 && (
                <GlassmorphicCard
                  key={p.tutor_id}
                  glowColor="#FFD700"
                  intensity="medium"
                  style={styles.achievementCard}
                >
                  <Star size={32} color="#FFD700" />
                  <Text style={styles.achievementTitle}>Master of {p.tutors?.subject}</Text>
                  <Text style={styles.achievementDesc}>
                    Earned with {p.tutors?.name}
                  </Text>
                </GlassmorphicCard>
              )
            ))}
            
            {/* Show placeholder if no achievements */}
            {!progress?.some(p => p.xp_points >= 100) && (
              <GlassmorphicCard
                glowColor="#AAAAAA"
                intensity="low"
                style={styles.achievementCard}
              >
                <Trophy size={32} color="#AAAAAA" />
                <Text style={styles.achievementTitle}>No Achievements Yet</Text>
                <Text style={styles.achievementDesc}>
                  Keep learning to earn badges!
                </Text>
              </GlassmorphicCard>
            )}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={24} color="#FFD700" />
            <Text style={styles.sectionTitle}>Rare Avatars</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.avatarsScroll}
          >
            {['Phoenix Macaw', 'Shadow Jaguar', 'Crystal Gecko', 'Mecha Sloth', 'Galactic Chameleon'].map((species, index) => {
              const isUnlocked = unlocks.includes(species);
              return (
                <GlassmorphicCard
                  key={species}
                  glowColor={isUnlocked ? '#FFD700' : '#333333'}
                  intensity={isUnlocked ? 'medium' : 'low'}
                  style={styles.avatarCard}
                >
                  <AvatarDisplay
                    species={species}
                    name=""
                    primaryColor={isUnlocked ? '#FFD700' : '#666666'}
                    secondaryColor="#333333"
                    size="small"
                    showName={false}
                  />
                  <Text style={[
                    styles.avatarCardTitle,
                    !isUnlocked && styles.avatarCardTitleLocked
                  ]}>
                    {species}
                  </Text>
                  {!isUnlocked && (
                    <Text style={styles.avatarCardLockText}>
                      Keep learning to unlock!
                    </Text>
                  )}
                </GlassmorphicCard>
              );
            })}
          </ScrollView>
        </Animated.View>

        <AnimatedTouchableOpacity 
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.recapButton}
          onPress={() => router.push('/progress')}
        >
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="medium"
            style={styles.recapContent}
          >
            <View style={styles.recapInfo}>
              <Text style={styles.recapTitle}>View Weekly Recap</Text>
              <Text style={styles.recapDesc}>See your learning journey stats</Text>
            </View>
            <ChevronRight size={24} color="#00FFA9" />
          </GlassmorphicCard>
        </AnimatedTouchableOpacity>
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
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroCard: {
    alignItems: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
    opacity: 0.5,
  },
  heroInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  speciesName: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#00FFA9',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  joinDate: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  editButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  xpText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#00FFA9',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  streakText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFD700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  achievementsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  achievementCard: {
    padding: 16,
    marginRight: 16,
    width: 160,
    alignItems: 'center',
  },
  achievementTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  achievementDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  avatarsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  avatarCard: {
    padding: 16,
    marginRight: 16,
    width: 120,
    alignItems: 'center',
  },
  avatarCardTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  avatarCardTitleLocked: {
    color: '#666666',
  },
  avatarCardLockText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  recapButton: {
    marginBottom: 20,
  },
  recapContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  recapInfo: {
    flex: 1,
  },
  recapTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recapDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
});