import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quote, Trophy, Star } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AvatarDisplay from './AvatarDisplay';
import { QUOTE_BACKGROUNDS, getBackgroundForTheme } from '@/assets/images/share-assets';

interface ShareableQuoteCardProps {
  quote: {
    id: string;
    text: string;
    author: {
      name: string;
      species: string;
      primaryColor: string;
      secondaryColor?: string;
    };
    theme: string;
    votes: number;
    xpAwarded: number;
    coinsAwarded: number;
  };
  style?: any;
}

export default function ShareableQuoteCard({ quote, style }: ShareableQuoteCardProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const borderGlow = useSharedValue(0.3);
  const quoteIconRotate = useSharedValue(0);
  
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
    
    // Border glow animation
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.2, { duration: 4000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Quote icon animation
    quoteIconRotate.value = withRepeat(
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
  
  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));
  
  const quoteIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${quoteIconRotate.value}rad` }],
  }));

  // Get background image based on theme
  const backgroundUrl = getBackgroundForTheme(quote.theme);

  return (
    <View style={[styles.container, style]}>
      {/* Background image */}
      <Image 
        source={{ uri: backgroundUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      
      {/* Overlay gradient */}
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.85)', 'rgba(15, 23, 42, 0.95)']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Animated glow effect */}
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={['transparent', quote.author.primaryColor + '80']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Animated border */}
      <Animated.View style={[styles.border, borderStyle]}>
        <LinearGradient
          colors={[quote.author.primaryColor + '60', 'transparent', quote.author.primaryColor + '60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1696446700704-46484532a18e?q=80&w=300&auto=format&fit=crop' }}
          style={styles.logo}
        />
        <Text style={styles.logoText}>Jungle Squad Academy</Text>
      </View>
      
      {/* Quote content */}
      <View style={styles.quoteContainer}>
        <Animated.View style={[styles.quoteIconContainer, quoteIconStyle]}>
          <Quote size={32} color={quote.author.primaryColor} />
        </Animated.View>
        
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        
        <View style={styles.authorContainer}>
          <AvatarDisplay
            species={quote.author.species}
            name={quote.author.name}
            primaryColor={quote.author.primaryColor}
            secondaryColor={quote.author.secondaryColor || '#333333'}
            size="small"
            showName={false}
          />
          
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{quote.author.name}</Text>
            <View style={styles.themeContainer}>
              <Star size={12} color={quote.author.primaryColor} />
              <Text style={[styles.themeText, { color: quote.author.primaryColor }]}>
                {quote.theme}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Trophy size={16} color="#FFD700" />
          <Text style={styles.statText}>{quote.votes} Votes</Text>
        </View>
        
        <View style={styles.statItem}>
          <Star size={16} color="#00FFA9" />
          <Text style={styles.statText}>+{quote.xpAwarded} XP</Text>
        </View>
        
        <View style={styles.statItem}>
          <Star size={16} color="#FFD700" />
          <Text style={styles.statText}>+{quote.coinsAwarded} Coins</Text>
        </View>
      </View>
      
      {/* Circuit decoration */}
      <View style={styles.circuitDecoration}>
        <View style={[styles.circuit, { backgroundColor: quote.author.primaryColor + '60' }]} />
        <View style={[styles.circuitDot, { backgroundColor: quote.author.primaryColor }]} />
        <View style={[styles.circuit, styles.circuit2, { backgroundColor: quote.author.primaryColor + '60' }]} />
        <View style={[styles.circuitDot, styles.circuitDot2, { backgroundColor: quote.author.primaryColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 350,
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 16,
    opacity: 0.3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  quoteContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
    justifyContent: 'center',
  },
  quoteIconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 60,
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
  },
  circuitDot2: {
    bottom: 20,
    right: 10,
  },
});