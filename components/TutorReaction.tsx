import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TutorReactionProps {
  tutorId: string;
  tutorName: string;
  tutorImage: string;
  message: string;
  mood: 'happy' | 'thinking' | 'excited' | 'encouraging' | 'neutral';
  onComplete: () => void;
}

export default function TutorReaction({
  tutorId,
  tutorName,
  tutorImage,
  message,
  mood = 'neutral',
  onComplete,
}: TutorReactionProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  // Get tutor theme colors based on tutor ID
  const getTutorColors = () => {
    const tutorThemes = {
      'tango': ['#FF7B54', '#FFB26B'],
      'zara': ['#845EC2', '#D65DB1'],
      'milo': ['#00C6A7', '#1E4D92'],
      'luna': ['#FF9A8B', '#FF6A88'],
      'bindi': ['#FF61D2', '#FE9090'],
      'chip': ['#4158D0', '#C850C0'],
      'rhea': ['#8EC5FC', '#E0C3FC'],
      'gabi': ['#FAD961', '#F76B1C'],
      'ellie': ['#B721FF', '#21D4FD'],
      'rocky': ['#48C6EF', '#6F86D6'],
    };
    
    return tutorThemes[tutorId as keyof typeof tutorThemes] || ['#00FFA9', '#00AAFF'];
  };

  // Get mood animation
  const getMoodAnimation = () => {
    switch (mood) {
      case 'happy':
        return {
          scale: withSequence(
            withSpring(1.1),
            withSpring(1)
          ),
          rotation: withSequence(
            withTiming(0.05, { duration: 200 }),
            withTiming(-0.05, { duration: 200 }),
            withTiming(0, { duration: 200 })
          )
        };
      case 'thinking':
        return {
          scale: withTiming(1),
          rotation: withSequence(
            withTiming(0.03, { duration: 500 }),
            withTiming(-0.03, { duration: 500 })
          )
        };
      case 'excited':
        return {
          scale: withSequence(
            withSpring(1.2),
            withSpring(1.1),
            withSpring(1.2),
            withSpring(1)
          ),
          rotation: withSequence(
            withTiming(0.1, { duration: 100 }),
            withTiming(-0.1, { duration: 100 }),
            withTiming(0.1, { duration: 100 }),
            withTiming(-0.1, { duration: 100 }),
            withTiming(0, { duration: 100 })
          )
        };
      case 'encouraging':
        return {
          scale: withSequence(
            withSpring(1.1),
            withSpring(1)
          ),
          rotation: withTiming(0)
        };
      default:
        return {
          scale: withTiming(1),
          rotation: withTiming(0)
        };
    }
  };

  useEffect(() => {
    // Main animation sequence
    opacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withDelay(
        3000,
        withTiming(0, { duration: 500 }, () => {
          runOnJS(onComplete)();
        })
      )
    );
    
    // Entrance animation
    translateY.value = withSpring(0, {
      damping: 12,
      stiffness: 100,
    });
    
    // Mood-specific animation
    const moodAnim = getMoodAnimation();
    scale.value = moodAnim.scale;
    rotation.value = moodAnim.rotation;
    
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
    ],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const colors = getTutorColors();

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['rgba(26,26,26,0.95)', 'rgba(10,10,10,0.9)']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View style={[styles.avatarContainer, avatarStyle]}>
        <Image
          source={{ uri: tutorImage }}
          style={styles.tutorImage}
        />
        <Animated.View style={[styles.avatarGlow, glowStyle]}>
          <LinearGradient
            colors={[colors[0] + '00', colors[0] + '80']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </Animated.View>
      
      <View style={styles.messageContainer}>
        <Text style={styles.tutorName}>{tutorName}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      
      {/* Cyberpunk circuit decoration */}
      <View style={styles.circuitDecoration}>
        <View style={[styles.circuit, { backgroundColor: colors[0] + '60' }]} />
        <View style={[styles.circuitDot, { backgroundColor: colors[0] }]} />
        <View style={[styles.circuit, styles.circuit2, { backgroundColor: colors[0] + '60' }]} />
        <View style={[styles.circuitDot, styles.circuitDot2, { backgroundColor: colors[0] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 10,
      },
    }),
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tutorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
  },
  messageContainer: {
    flex: 1,
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
    marginBottom: 4,
  },
  message: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 20,
    opacity: 0.4,
  },
  circuit: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 20,
    height: 1,
  },
  circuit2: {
    bottom: 10,
    right: 10,
    width: 15,
    transform: [{ rotate: '90deg' }],
  },
  circuitDot: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  circuitDot2: {
    bottom: 10,
    right: 10,
  },
});