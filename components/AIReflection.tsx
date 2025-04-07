import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, Sparkles, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';

interface AIReflectionProps {
  summary: string;
  onShare?: () => void;
}

export default function AIReflection({ summary, onShare }: AIReflectionProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const starScale = useSharedValue(1);
  
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
    
    // Star animation
    starScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  return (
    <GlassmorphicCard
      glowColor="#FFD700"
      intensity="medium"
      style={styles.container}
    >
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, starStyle]}>
          <Star size={24} color="#FFD700" />
        </Animated.View>
        <Text style={styles.title}>AI Reflection</Text>
      </View>
      
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 215, 0, 0.2)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      <View style={styles.content}>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.poweredBy}>
          <Sparkles size={14} color="#FFD700" />
          <Text style={styles.poweredByText}>Powered by Jungle AI</Text>
        </View>
        
        {onShare && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={onShare}
          >
            <Share2 size={16} color="#FFFFFF" />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.5,
  },
  content: {
    marginBottom: 16,
  },
  summaryText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  poweredByText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  shareText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});