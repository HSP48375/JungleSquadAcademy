import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Trophy, Star, CheckCircle2, Sword, Zap, Award, Book } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useXP } from '@/hooks/useXP';
import { useJournal } from '@/hooks/useJournal';
import { useAchievements } from '@/hooks/useAchievements';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import XPBar from '@/components/XPBar';
import StreakIndicator from '@/components/StreakIndicator';
import XPTransactionsList from '@/components/XPTransactionsList';
import LevelUpAnimation from '@/components/LevelUpAnimation';
import AchievementToast from '@/components/AchievementToast';

export default function ProgressScreen() {
  const { session } = useAuth();
  const { progress, loading: progressLoading } = useProgress(session?.user?.id ?? '');
  const { xp, transactions, loading: xpLoading, getStreakResetTime } = useXP(session?.user?.id ?? '');
  const { streak: journalStreak, loading: journalLoading } = useJournal(session?.user?.id ?? '');
  const { 
    newAchievement, 
    clearNewAchievement, 
    getUnlockedAchievements,
    loading: achievementsLoading
  } = useAchievements(session?.user?.id ?? '');
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const glowOpacity = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back) });
    
    glowOpacity.value = withRepeat(
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
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  // Handle level up
  const handleLevelUp = () => {
    setShowLevelUp(true);
  };
  
  // Calculate time until streak reset
  const resetTime = getStreakResetTime();
  
  // Get unlocked achievements count
  const unlockedAchievements = getUnlockedAchievements();

  if (progressLoading || xpLoading || journalLoading || achievementsLoading) {
    return (
      <View style={styles.container}>
        <ImmersiveBackground intensity="medium" />
        <Text style={styles.loadingText}>Loading progress...</Text>
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
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Your Learning Journey</Text>
            <TouchableOpacity 
              style={styles.challengesButton}
              onPress={() => router.push('/progress/challenges')}
            >
              <Sword size={20} color="#000" />
              <Text style={styles.challengesButtonText}>Challenges</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* XP and Level Card */}
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="high"
            style={styles.xpCard}
          >
            <Animated.View style={[styles.cardGlow, glowStyle]}>
              <LinearGradient
                colors={['transparent', '#00FFA940']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            
            <View style={styles.xpHeader}>
              <View>
                <Text style={styles.xpTitle}>Level {xp.level}</Text>
                <Text style={styles.xpSubtitle}>{xp.total} Total XP</Text>
              </View>
              
              <View style={styles.todayXPContainer}>
                <Zap size={16} color="#00FFA9" />
                <Text style={styles.todayXPText}>+{xp.today} Today</Text>
              </View>
            </View>
            
            <XPBar
              level={xp.level}
              progress={xp.levelProgress}
              streak={xp.streak}
              todayXP={xp.today}
              showStreak={false}
              showTodayXP={false}
              size="large"
              onLevelUp={handleLevelUp}
            />
            
            <View style={styles.streakContainer}>
              <StreakIndicator
                streak={xp.streak}
                resetTime={resetTime}
                size="medium"
              />
            </View>
          </GlassmorphicCard>
        </Animated.View>

        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <GlassmorphicCard
              glowColor="#00FFA9"
              intensity="medium"
              style={styles.statBox}
            >
              <Trophy size={24} color="#00FFA9" />
              <Text style={styles.statNumber}>{progress.length}</Text>
              <Text style={styles.statLabel}>Tutors</Text>
            </GlassmorphicCard>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <GlassmorphicCard
              glowColor="#FFD700"
              intensity="medium"
              style={styles.statBox}
            >
              <Star size={24} color="#FFD700" />
              <Text style={styles.statNumber}>
                {progress.reduce((sum, p) => sum + p.xp_points, 0)}
              </Text>
              <Text style={styles.statLabel}>Subject XP</Text>
            </GlassmorphicCard>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <GlassmorphicCard
              glowColor="#FF00AA"
              intensity="medium"
              style={styles.statBox}
            >
              <Book size={24} color="#FF00AA" />
              <Text style={styles.statNumber}>
                {journalStreak}
              </Text>
              <Text style={styles.statLabel}>Journal Streak</Text>
            </GlassmorphicCard>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learning Tools</Text>
          </View>
          
          <View style={styles.toolsGrid}>
            <GlassmorphicCard
              glowColor="#00FFA9"
              intensity="low"
              style={styles.toolCard}
            >
              <TouchableOpacity 
                style={styles.toolContent}
                onPress={() => router.push('/progress/journal')}
              >
                <Book size={32} color="#00FFA9" />
                <Text style={styles.toolName}>Learning Journal</Text>
                <Text style={styles.toolDescription}>
                  Reflect on your progress
                </Text>
              </TouchableOpacity>
            </GlassmorphicCard>
            
            <GlassmorphicCard
              glowColor="#FFD700"
              intensity="low"
              style={styles.toolCard}
            >
              <TouchableOpacity 
                style={styles.toolContent}
                onPress={() => router.push('/progress/challenges')}
              >
                <Sword size={32} color="#FFD700" />
                <Text style={styles.toolName}>Daily Challenges</Text>
                <Text style={styles.toolDescription}>
                  Complete tasks, earn XP
                </Text>
              </TouchableOpacity>
            </GlassmorphicCard>
            
            <GlassmorphicCard
              glowColor="#FF69B4"
              intensity="low"
              style={styles.toolCard}
            >
              <TouchableOpacity 
                style={styles.toolContent}
                onPress={() => router.push('/profile/achievements')}
              >
                <Trophy size={32} color="#FF69B4" />
                <Text style={styles.toolName}>Achievements</Text>
                <Text style={styles.toolDescription}>
                  {unlockedAchievements.length} Unlocked
                </Text>
              </TouchableOpacity>
            </GlassmorphicCard>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Tutor Progress</Text>
          
          {progress.map((p) => (
            <GlassmorphicCard
              key={p.id}
              glowColor="#00FFA9"
              intensity="low"
              style={styles.progressCard}
            >
              <View style={styles.progressCardContent}>
                <View style={styles.tutorAvatarContainer}>
                  <View style={[styles.tutorAvatar, { backgroundColor: '#333333' }]}>
                    {p.tutors?.avatar_url ? (
                      <Image
                        source={{ uri: p.tutors?.avatar_url }}
                        style={styles.tutorAvatarImage}
                      />
                    ) : (
                      <Trophy size={24} color="#00FFA9" />
                    )}
                  </View>
                </View>
                
                <View style={styles.progressInfo}>
                  <Text style={styles.tutorName}>{p.tutors?.name}</Text>
                  <Text style={styles.tutorSubject}>{p.tutors?.subject}</Text>
                  <View style={styles.levelContainer}>
                    <View style={styles.levelBar}>
                      <View
                        style={[
                          styles.levelProgress,
                          { width: `${(p.xp_points % 100) / 100 * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.levelText}>
                      Level {Math.floor(p.xp_points / 100) + 1}
                    </Text>
                  </View>
                  <Text style={styles.xpText}>{p.xp_points} XP</Text>
                </View>
              </View>
            </GlassmorphicCard>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.section}>
          <XPTransactionsList transactions={transactions} />
        </Animated.View>
      </ScrollView>
      
      {/* Level up animation */}
      {showLevelUp && (
        <LevelUpAnimation
          level={xp.level}
          onComplete={() => setShowLevelUp(false)}
        />
      )}
      
      {/* Achievement toast */}
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onComplete={clearNewAchievement}
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
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#fff',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  challengesButton: {
    backgroundColor: '#00FFA9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  challengesButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000',
  },
  cardWrapper: {
    marginBottom: 24,
  },
  xpCard: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  xpTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  xpSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 2,
  },
  todayXPContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  todayXPText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  streakContainer: {
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#fff',
    marginTop: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  statLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
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
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    minWidth: 100,
    marginBottom: 0,
  },
  toolContent: {
    padding: 16,
    alignItems: 'center',
  },
  toolName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  toolDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 12,
  },
  progressCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  tutorAvatarContainer: {
    marginRight: 16,
  },
  tutorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(0, 255, 169, 0.3)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  tutorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  progressInfo: {
    flex: 1,
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  tutorSubject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  levelProgress: {
    height: '100%',
    backgroundColor: '#00FFA9',
    borderRadius: 2,
  },
  levelText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  xpText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});