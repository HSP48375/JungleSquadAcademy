import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Coins, X } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import GlassmorphicCard from './GlassmorphicCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RewardClaimModalProps {
  tier: string;
  reward: number;
  onClaim: () => void;
  onClose: () => void;
}

export default function RewardClaimModal({ tier, reward, onClaim, onClose }: RewardClaimModalProps) {
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);
  
  // Get tier color
  const getTierColor = () => {
    switch (tier) {
      case 'Diamond': return '#00FFFF';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      default: return '#CD7F32'; // Bronze
    }
  };
  
  const tierColor = getTierColor();
  
  // Set up animations
  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 400 });
    
    // Icon animations
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    iconRotate.value = withRepeat(
      withSequence(
        withTiming(0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(-0.05, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}rad` },
    ],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const handleClaim = () => {
    // Trigger exit animation
    scale.value = withTiming(0.8, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      onClaim();
    });
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      />
      
      <ConfettiCannon
        count={100}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart
        fadeOut
        colors={[tierColor, '#00FFA9', '#FFFFFF', '#FF69B4']}
      />
      
      <Animated.View style={[styles.container, containerStyle]}>
        <GlassmorphicCard
          glowColor={tierColor}
          intensity="high"
          style={styles.card}
        >
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <LinearGradient
              colors={[tierColor, tierColor + '80']}
              style={styles.iconBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Award size={48} color="#FFFFFF" />
            </LinearGradient>
            
            <Animated.View style={[styles.iconGlow, glowStyle]}>
              <LinearGradient
                colors={['transparent', tierColor + '80']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
          
          <Text style={styles.title}>
            {tier} Tier Unlocked!
          </Text>
          
          <Text style={styles.message}>
            Congratulations! You've reached the {tier} tier in our referral program.
          </Text>
          
          <View style={styles.rewardContainer}>
            <Coins size={24} color="#FFD700" />
            <Text style={styles.rewardText}>
              {reward} Coin Bonus
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.claimButton, { backgroundColor: tierColor }]}
            onPress={handleClaim}
          >
            <Text style={styles.claimButtonText}>
              Claim Your Reward
            </Text>
          </TouchableOpacity>
        </GlassmorphicCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  card: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 70,
    opacity: 0.5,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  message: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 24,
    gap: 12,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  claimButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  claimButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
});