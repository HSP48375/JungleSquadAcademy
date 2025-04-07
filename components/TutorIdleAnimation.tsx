import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface TutorIdleAnimationProps {
  tutorId: string;
  children: React.ReactNode;
}

export default function TutorIdleAnimation({ tutorId, children }: TutorIdleAnimationProps) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    // Different animations for different tutors
    switch (tutorId) {
      case 'tango':
        // Tiger pounce animation
        translateY.value = withRepeat(
          withSequence(
            withSpring(-5, { damping: 3 }),
            withSpring(0, { damping: 5 })
          ),
          -1,
          true
        );
        break;
      case 'zara':
        // Zebra head movement
        rotate.value = withRepeat(
          withSequence(
            withTiming(0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
            withTiming(-0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
        break;
      case 'milo':
        // Monkey bounce
        scale.value = withRepeat(
          withSequence(
            withSpring(1.05, { damping: 2 }),
            withSpring(1, { damping: 2 })
          ),
          -1,
          true
        );
        break;
      case 'luna':
        // Lioness glow
        glow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.3, { duration: 1500 })
          ),
          -1,
          true
        );
        break;
      default:
        // Default gentle float
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
            withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.sine) })
          ),
          -1,
          true
        );
    }
  }, [tutorId]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}rad` },
      { scale: scale.value },
    ],
    opacity: 1 - (glow.value * 0.3),
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});