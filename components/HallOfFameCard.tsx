import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Coins, Zap, Quote, Calendar } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';
import AvatarDisplay from './AvatarDisplay';

interface HallOfFameCardProps {
  winner: {
    id: string;
    entry: {
      quote_text: string;
      user: {
        avatar: {
          avatar_name: string;
          species: {
            name: string;
          };
          primary_color: string;
          secondary_color: string;
        };
      };
    };
    theme: {
      theme: string;
    };
    votes_count: number;
    coins_awarded: number;
    xp_awarded: number;
    announced_at: string;
  };
  index: number;
}

export default function HallOfFameCard({ winner, index }: HallOfFameCardProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const ribbonWave = useSharedValue(0);
  
  // Set up animations
  useEffect(() => {
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Ribbon wave animation
    ribbonWave.value = withRepeat(
      withSequence(
        withTiming(0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(-0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const ribbonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ribbonWave.value}rad` }],
  }));
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get medal color based on index
  const getMedalColor = () => {
    if (index === 0) return ['#FFD700', '#FFA500']; // Gold
    if (index === 1) return ['#C0C0C0', '#A0A0A0']; // Silver
    if (index === 2) return ['#CD7F32', '#8B4513']; // Bronze
    return ['#00FFA9', '#00AAFF']; // Default teal
  };
  
  const medalColors = getMedalColor();
  const formattedDate = formatDate(winner.announced_at);
  const isTopThree = index < 3;

  return (
    <GlassmorphicCard
      glowColor={medalColors[0]}
      intensity={isTopThree ? 'high' : 'medium'}
      style={styles.container}
    >
      {/* Date ribbon */}
      <Animated.View style={[styles.dateRibbon, ribbonStyle]}>
        <LinearGradient
          colors={medalColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ribbonGradient}
        >
          <Calendar size={12} color="#FFFFFF" />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </LinearGradient>
      </Animated.View>
      
      <View style={styles.content}>
        {/* Header with avatar and theme */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <AvatarDisplay
              species={winner.entry.user.avatar.species.name}
              name={winner.entry.user.avatar.avatar_name}
              primaryColor={winner.entry.user.avatar.primary_color}
              secondaryColor={winner.entry.user.avatar.secondary_color || '#333333'}
              size="small"
              showName={false}
            />
          </View>
          
          <View style={styles.winnerInfo}>
            <Text style={styles.winnerName}>{winner.entry.user.avatar.avatar_name}</Text>
            <View style={styles.themeContainer}>
              <Quote size={12} color={medalColors[0]} />
              <Text style={[styles.themeText, { color: medalColors[0] }]}>
                Theme: {winner.theme.theme}
              </Text>
            </View>
          </View>
          
          {isTopThree && (
            <View style={styles.trophyContainer}>
              <LinearGradient
                colors={medalColors}
                style={styles.trophyBackground}
              >
                <Trophy size={24} color="#FFFFFF" />
              </LinearGradient>
              
              <Animated.View style={[styles.trophyGlow, glowStyle]}>
                <LinearGradient
                  colors={['transparent', medalColors[0] + '80']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          )}
        </View>
        
        {/* Quote */}
        <Text style={styles.quoteText}>"{winner.entry.quote_text}"</Text>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Zap size={16} color="#00FFA9" />
            <Text style={styles.statText}>XP Earned: {winner.xp_awarded}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Coins size={16} color="#FFD700" />
            <Text style={styles.statText}>Coins: {winner.coins_awarded}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Trophy size={16} color={medalColors[0]} />
            <Text style={styles.statText}>Votes: {winner.votes_count}</Text>
          </View>
        </View>
        
        {/* Circuit decoration */}
        <View style={styles.circuitDecoration}>
          <View style={[styles.circuit, { backgroundColor: medalColors[0] + '60' }]} />
          <View style={[styles.circuitDot, { backgroundColor: medalColors[0] }]} />
        </View>
      </View>
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  dateRibbon: {
    position: 'absolute',
    top: 12,
    right: -30,
    width: 120,
    height: 24,
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  ribbonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
  },
  trophyContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    marginLeft: 8,
  },
  trophyBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  trophyGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    opacity: 0.5,
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFFFFF',
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