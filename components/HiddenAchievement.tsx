import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Trophy, Star, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';

interface HiddenAchievementProps {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isUnlocked: boolean;
  rewardType: string;
  rewardData: any;
  onPress?: () => void;
  isSecret?: boolean;
}

export default function HiddenAchievement({
  id,
  name,
  description,
  icon,
  isUnlocked,
  rewardType,
  rewardData,
  onPress,
  isSecret = true,
}: HiddenAchievementProps) {
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const iconScale = useSharedValue(1);
  
  // Set up animations
  useEffect(() => {
    if (isUnlocked) {
      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      // Icon animation
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.95, { duration: 1500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
  }, [isUnlocked]);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  // Get reward icon based on type
  const getRewardIcon = () => {
    switch (rewardType) {
      case 'avatar_item':
        return <Sparkles size={16} color="#FFD700" />;
      case 'badge':
        return <Star size={16} color="#FFD700" />;
      case 'color':
        return <Star size={16} color={rewardData.hex || '#FFD700'} />;
      default:
        return <Trophy size={16} color="#FFD700" />;
    }
  };
  
  // Get reward text based on type
  const getRewardText = () => {
    switch (rewardType) {
      case 'avatar_item':
        return `Unlocks: ${rewardData.item}`;
      case 'badge':
        return `Badge: ${rewardData.badge_name}`;
      case 'color':
        return `Color: ${rewardData.color_name}`;
      default:
        return 'Special Reward';
    }
  };

  return (
    <GlassmorphicCard
      glowColor={isUnlocked ? '#FFD700' : '#333333'}
      intensity={isUnlocked ? 'medium' : 'low'}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        disabled={!onPress}
      >
        {isUnlocked ? (
          <>
            <Animated.View style={[styles.iconContainer, iconStyle]}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Trophy size={24} color="#FFFFFF" />
              </LinearGradient>
              
              <Animated.View style={[styles.glow, glowStyle]}>
                <LinearGradient
                  colors={['transparent', '#FFD700']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
            
            <View style={styles.textContainer}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.description}>{description}</Text>
              
              <View style={styles.rewardContainer}>
                {getRewardIcon()}
                <Text style={styles.rewardText}>{getRewardText()}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.lockedIconContainer}>
              {isSecret ? (
                <Lock size={24} color="#666666" />
              ) : (
                <Trophy size={24} color="#666666" />
              )}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.lockedName}>
                {isSecret ? '????? ??????' : name}
              </Text>
              <Text style={styles.lockedDescription}>
                {isSecret 
                  ? 'This achievement is still locked. Keep exploring to discover it!' 
                  : 'Complete the requirements to unlock this achievement.'}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 34,
    opacity: 0.5,
  },
  lockedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 102, 102, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  lockedName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  lockedDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
});