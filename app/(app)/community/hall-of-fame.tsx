import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Quote, Star } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useHallOfFame } from '@/hooks/useHallOfFame';
import HallOfFameCard from '@/components/HallOfFameCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import ParticleEffect from '@/components/ParticleEffect';

export default function HallOfFameScreen() {
  const { winners, loading, error, refreshWinners } = useHallOfFame();
  
  // Animation values
  const titleGlow = useSharedValue(0.5);
  const trophyRotate = useSharedValue(0);
  
  // Set up animations
  useEffect(() => {
    // Title glow animation
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Trophy rotation animation
    trophyRotate.value = withRepeat(
      withSequence(
        withTiming(0.05, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(-0.05, { duration: 1500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const titleGlowStyle = useAnimatedStyle(() => ({
    opacity: titleGlow.value,
  }));
  
  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${trophyRotate.value}rad` }],
  }));

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Animated.View style={[styles.titleGlow, titleGlowStyle]}>
            <LinearGradient
              colors={['transparent', '#FFD700']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          
          <View style={styles.titleRow}>
            <Animated.View style={trophyStyle}>
              <Trophy size={32} color="#FFD700" />
            </Animated.View>
            <Text style={styles.title}>Hall of Fame</Text>
          </View>
          
          <Text style={styles.subtitle}>Celebrating our weekly quote champions</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Loading Hall of Fame...</Text>
        ) : winners.length > 0 ? (
          winners.map((winner, index) => (
            <Animated.View
              key={winner.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <HallOfFameCard winner={winner} index={index} />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Quote size={48} color="#666666" />
            <Text style={styles.emptyText}>
              No winners have been announced yet. Check back after the next competition ends!
            </Text>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Star size={16} color="#FFD700" />
          <Text style={styles.infoText}>
            Winners are announced weekly based on community votes
          </Text>
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
  headerContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  titleGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 8,
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
});