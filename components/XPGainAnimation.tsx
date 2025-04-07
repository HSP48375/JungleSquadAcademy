import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';

interface XPGainAnimationProps {
  amount: number;
  multiplier?: number;
  position?: { x: number; y: number };
  onComplete: () => void;
}

export default function XPGainAnimation({
  amount,
  multiplier = 1,
  position,
  onComplete,
}: XPGainAnimationProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  
  // Set up animations
  useEffect(() => {
    // Main animation sequence
    opacity.value = withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withDelay(
        1000,
        withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(onComplete)();
        })
      )
    );
    
    // Scale animation
    scale.value = withSequence(
      withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back) }),
      withTiming(1, { duration: 200 }),
      withDelay(
        800,
        withTiming(0.8, { duration: 500, easing: Easing.in(Easing.cubic) })
      )
    );
    
    // Float up animation
    translateY.value = withSequence(
      withTiming(-20, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
    
    // Sparkle animation
    sparkleOpacity.value = withSequence(
      withDelay(
        100,
        withTiming(1, { duration: 200 })
      ),
      withDelay(
        300,
        withTiming(0, { duration: 800 })
      )
    );
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));
  
  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));
  
  // Determine color based on amount
  const getColor = () => {
    if (amount >= 50) return '#FFD700'; // Gold for big gains
    if (amount >= 20) return '#00FFAA'; // Teal for medium gains
    return '#00FFA9'; // Default green for small gains
  };
  
  // Format with multiplier
  const formattedAmount = multiplier > 1 
    ? `+${amount} XP (${multiplier}x)` 
    : `+${amount} XP`;

  return (
    <Animated.View 
      style={[
        styles.container,
        containerStyle,
        position && { position: 'absolute', left: position.x, top: position.y }
      ]}
    >
      <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
        <Sparkles size={24} color={getColor()} />
      </Animated.View>
      
      <Text style={[styles.xpText, { color: getColor() }]}>
        {formattedAmount}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    minWidth: 80,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -12,
    opacity: 0,
  },
  xpText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});