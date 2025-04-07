import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Clock, Star, Lock, Gamepad2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useAchievements } from '@/hooks/useAchievements';
import GamePassUpsell from '@/components/GamePassUpsell';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ParticleEffect from '@/components/ParticleEffect';
import AchievementToast from '@/components/AchievementToast';

const games = [
  {
    id: 'number-ninja',
    title: 'Number Ninja',
    description: 'Slice through equations with lightning speed!',
    subject: 'Mathematics',
    tutor: 'Tango the Tiger',
    image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400&fit=crop',
    difficulty: 'medium',
    timeLimit: 60,
    points: 100,
    isPremium: false,
    theme: 'math',
    colors: ['#00FFFF', '#0088FF'],
  },
  {
    id: 'history-hunter',
    title: 'History Hunter',
    description: 'Travel through time to collect historical artifacts!',
    subject: 'History',
    tutor: 'Zara the Zebra',
    image: 'https://images.unsplash.com/photo-1599458448510-59aecaea4752?w=400&fit=crop',
    difficulty: 'easy',
    timeLimit: 120,
    points: 150,
    isPremium: true,
    theme: 'history',
    colors: ['#FF00FF', '#8800FF'],
  },
  {
    id: 'word-wizard',
    title: 'Word Wizard',
    description: 'Cast spells by forming words and phrases!',
    subject: 'Language Arts',
    tutor: 'Milo the Monkey',
    image: 'https://images.unsplash.com/photo-1505775561242-727b7fba20f0?w=400&fit=crop',
    difficulty: 'hard',
    timeLimit: 180,
    points: 200,
    isPremium: true,
    theme: 'language',
    colors: ['#FFFF00', '#FF8800'],
  },
  {
    id: 'science-explorer',
    title: 'Science Explorer',
    description: 'Discover scientific principles through experiments!',
    subject: 'Science',
    tutor: 'Luna the Lioness',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&fit=crop',
    difficulty: 'medium',
    timeLimit: 150,
    points: 175,
    isPremium: true,
    theme: 'science',
    colors: ['#00FF00', '#00FFAA'],
  },
];

// Easter egg achievement ID for playing 3 different games
const GAME_EXPLORER_ACHIEVEMENT_ID = 'game-explorer-achievement';

export default function GamesScreen() {
  const { session } = useAuth();
  const { canAccessPremiumGames, loading: accessLoading } = useFeatureAccess(session?.user?.id ?? '');
  const { 
    newAchievement, 
    clearNewAchievement, 
    unlockAchievement 
  } = useAchievements(session?.user?.id ?? '');
  
  const [showUpsell, setShowUpsell] = useState(false);
  const [playedGames, setPlayedGames] = useState<Set<string>>(new Set());
  const [hoveredTutor, setHoveredTutor] = useState(null);

  // Track played games in local storage
  useEffect(() => {
    const loadPlayedGames = async () => {
      try {
        const storedGames = localStorage.getItem('playedGames');
        if (storedGames) {
          setPlayedGames(new Set(JSON.parse(storedGames)));
        }
      } catch (e) {
        console.error('Error loading played games:', e);
      }
    };
    
    loadPlayedGames();
  }, []);
  
  // Check for game explorer achievement
  useEffect(() => {
    const checkGameExplorerAchievement = async () => {
      if (playedGames.size >= 3) {
        await unlockAchievement(GAME_EXPLORER_ACHIEVEMENT_ID);
      }
    };
    
    if (session?.user && playedGames.size >= 3) {
      checkGameExplorerAchievement();
    }
  }, [playedGames.size, session?.user]);

  const handleGamePress = (game: typeof games[0]) => {
    if (!game.isPremium || canAccessPremiumGames) {
      // Track played game
      const newPlayedGames = new Set(playedGames);
      newPlayedGames.add(game.id);
      setPlayedGames(newPlayedGames);
      
      // Store in localStorage
      try {
        localStorage.setItem('playedGames', JSON.stringify([...newPlayedGames]));
      } catch (e) {
        console.error('Error saving played games:', e);
      }
      
      router.push(`/games/${game.id}?title=${game.title}`);
    } else {
      setShowUpsell(true);
    }
  };

  if (accessLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ImmersiveBackground theme="default" intensity="low" />
        <ActivityIndicator size="large" color="#00FFA9" />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImmersiveBackground theme="default" intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Learning Games</Text>
          <Text style={styles.subtitle}>Play, learn, and earn rewards!</Text>
        </View>

        <View style={styles.gamesGrid}>
          {games.map((game, index) => (
            <GlassmorphicCard
              key={game.id}
              glowColor={game.colors[0]}
              intensity="medium"
              style={styles.gameCard}
            >
              <TouchableOpacity
                style={styles.gameCardContent}
                onPress={() => handleGamePress(game)}
                activeOpacity={0.8}
                onHoverIn={() => setHoveredTutor(game.id)}
                onHoverOut={() => setHoveredTutor(null)}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: game.image }} style={styles.gameImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.imageGradient}
                  />
                  
                  {game.isPremium && !canAccessPremiumGames && (
                    <View style={styles.premiumBadge}>
                      <Lock size={16} color="#FFD700" />
                      <Text style={styles.premiumText}>Premium</Text>
                    </View>
                  )}
                  
                  {playedGames.has(game.id) && (
                    <View style={styles.playedBadge}>
                      <Gamepad2 size={16} color="#00FFA9" />
                      <Text style={styles.playedText}>Played</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.gameInfo}>
                  <Text style={styles.gameTitle}>{game.title}</Text>
                  <Text style={styles.gameDescription}>{game.description}</Text>
                  
                  <View style={styles.gameMetrics}>
                    <View style={styles.metricItem}>
                      <Clock size={16} color={game.colors[0]} />
                      <Text style={[styles.metricText, { color: game.colors[0] }]}>{game.timeLimit}s</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Trophy size={16} color={game.colors[0]} />
                      <Text style={[styles.metricText, { color: game.colors[0] }]}>{game.points} XP</Text>
                    </View>
                    <View style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          game.difficulty === 'easy'
                            ? '#4CAF5080'
                            : game.difficulty === 'medium'
                            ? '#FF980080'
                            : '#F4433680',
                      }
                    ]}>
                      <Star size={12} color="#FFF" />
                      <Text style={styles.difficultyText}>
                        {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Circuit decoration */}
                <View style={styles.circuitDecoration}>
                  <View style={[styles.circuit, { backgroundColor: game.colors[0] }]} />
                  <View style={[styles.circuitDot, { backgroundColor: game.colors[0] }]} />
                </View>
              </TouchableOpacity>
            </GlassmorphicCard>
          ))}
        </View>

        {showUpsell && (
          <GamePassUpsell onClose={() => setShowUpsell(false)} />
        )}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAA',
  },
  gamesGrid: {
    gap: 20,
  },
  gameCard: {
    marginBottom: 0,
  },
  gameCardContent: {
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
  },
  gameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  gameInfo: {
    padding: 16,
  },
  gameTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  gameDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#BBB',
    marginBottom: 16,
    lineHeight: 20,
  },
  gameMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    marginLeft: 4,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFF',
    marginLeft: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
  },
  playedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00FFA9',
  },
  playedText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#00FFA9',
    marginLeft: 4,
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 20,
    opacity: 0.6,
  },
  circuit: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 20,
    height: 1,
  },
  circuitDot: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});