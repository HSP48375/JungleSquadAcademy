import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Lock, Unlock, Filter } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import HiddenAchievement from '@/components/HiddenAchievement';
import AchievementToast from '@/components/AchievementToast';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';

export default function AchievementsScreen() {
  const { session } = useAuth();
  const { 
    achievements, 
    userAchievements, 
    loading, 
    error, 
    newAchievement,
    clearNewAchievement,
    isAchievementUnlocked,
  } = useAchievements(session?.user?.id ?? '');
  
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  // Filter achievements based on selected filter
  const filteredAchievements = () => {
    switch (filter) {
      case 'unlocked':
        return achievements.filter(a => isAchievementUnlocked(a.id));
      case 'locked':
        return achievements.filter(a => !isAchievementUnlocked(a.id));
      default:
        return achievements;
    }
  };
  
  // Calculate stats
  const totalAchievements = achievements.length;
  const unlockedCount = userAchievements.length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Secret Achievements</Text>
          <Text style={styles.subtitle}>Discover hidden challenges and rewards</Text>
        </View>
        
        <Animated.View entering={FadeInDown.duration(800)}>
          <GlassmorphicCard
            glowColor="#FFD700"
            intensity="medium"
            style={styles.statsCard}
          >
            <View style={styles.statsHeader}>
              <Trophy size={24} color="#FFD700" />
              <Text style={styles.statsTitle}>Your Progress</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${completionPercentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {unlockedCount}/{totalAchievements} Achievements ({completionPercentage}%)
              </Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Unlock size={20} color="#00FFA9" />
                </View>
                <Text style={styles.statValue}>{unlockedCount}</Text>
                <Text style={styles.statLabel}>Unlocked</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Lock size={20} color="#FF69B4" />
                </View>
                <Text style={styles.statValue}>{totalAchievements - unlockedCount}</Text>
                <Text style={styles.statLabel}>Locked</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Star size={20} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>{completionPercentage}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>
          </GlassmorphicCard>
        </Animated.View>
        
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilter
            ]}
            onPress={() => setFilter('all')}
          >
            <Trophy size={16} color={filter === 'all' ? '#000000' : '#FFFFFF'} />
            <Text style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'unlocked' && styles.activeFilter
            ]}
            onPress={() => setFilter('unlocked')}
          >
            <Unlock size={16} color={filter === 'unlocked' ? '#000000' : '#FFFFFF'} />
            <Text style={[
              styles.filterText,
              filter === 'unlocked' && styles.activeFilterText
            ]}>
              Unlocked
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'locked' && styles.activeFilter
            ]}
            onPress={() => setFilter('locked')}
          >
            <Lock size={16} color={filter === 'locked' ? '#000000' : '#FFFFFF'} />
            <Text style={[
              styles.filterText,
              filter === 'locked' && styles.activeFilterText
            ]}>
              Locked
            </Text>
          </TouchableOpacity>
        </View>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {loading ? (
          <Text style={styles.loadingText}>Loading achievements...</Text>
        ) : filteredAchievements().length > 0 ? (
          filteredAchievements().map((achievement, index) => (
            <Animated.View
              key={achievement.id}
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              <HiddenAchievement
                id={achievement.id}
                name={achievement.name}
                description={achievement.description}
                icon={achievement.icon_url}
                isUnlocked={isAchievementUnlocked(achievement.id)}
                rewardType={achievement.reward_type}
                rewardData={achievement.reward_data}
                isSecret={!isAchievementUnlocked(achievement.id)}
              />
            </Animated.View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No achievements found for the selected filter.
          </Text>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How to Earn Achievements</Text>
          <Text style={styles.infoText}>
            Secret achievements are unlocked by discovering hidden features and completing special actions throughout the app. Explore, experiment, and engage with different features to discover them all!
          </Text>
        </View>
      </ScrollView>
      
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
    marginBottom: 24,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statsTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 20,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  activeFilter: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  activeFilterText: {
    color: '#000000',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 22,
  },
});