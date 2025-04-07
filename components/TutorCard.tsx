import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import { MessageSquare, Sparkles, GraduationCap } from 'lucide-react-native';
import { router } from 'expo-router';
import AvatarDisplay from './AvatarDisplay';

interface TutorCardProps {
  tutor: {
    id: string;
    name: string;
    animal: string;
    subject: string;
    catchphrase: string;
    description: string;
    specialties: string[];
    gradient: string[];
  };
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function TutorCard({ tutor, index, isSelected, onSelect }: TutorCardProps) {
  const glowOpacity = useSharedValue(0.3);
  const cardScale = useSharedValue(1);
  
  // Set up animations
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    if (isSelected) {
      cardScale.value = withSequence(
        withTiming(1.02, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
    } else {
      cardScale.value = withTiming(1, { duration: 300 });
    }
  }, [isSelected]);
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: withDelay(
      index * 100,
      withTiming(1, { duration: 500 })
    ),
    transform: [{ 
      translateY: withDelay(
        index * 100,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) })
      )
    }],
  }));

  return (
    <Animated.View 
      style={[
        styles.cardWrapper, 
        cardStyle, 
        entranceStyle, 
        { opacity: 0, transform: [{ translateY: 30 }] }
      ]}
    >
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => onSelect(tutor.id)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={tutor.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        />
        
        <Animated.View style={[styles.glowEffect, glowStyle]}>
          <LinearGradient
            colors={['transparent', tutor.gradient[0] + '80']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        <View style={styles.cardContent}>
          <View style={styles.avatarSection}>
            <AvatarDisplay
              species={tutor.animal}
              name={tutor.name}
              primaryColor={tutor.gradient[0]}
              secondaryColor={tutor.gradient[1]}
              idleAnimation={index % 2 === 0 ? 'color_shift_glow' : 'cosmic_fade_pulse'}
              size="medium"
              showName={false}
              subject={tutor.subject}
            />
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.tutorName}>
              {tutor.name} the {tutor.animal}
            </Text>
            <Text style={styles.subject}>{tutor.subject}</Text>
            <Text style={styles.catchphrase}>"{tutor.catchphrase}"</Text>
            
            {isSelected && (
              <Animated.View 
                entering={FadeIn.duration(400)}
                style={styles.expandedContent}
              >
                <Text style={styles.description}>{tutor.description}</Text>
                
                <View style={styles.specialtiesContainer}>
                  {tutor.specialties.map((specialty, idx) => (
                    <View key={idx} style={styles.specialtyTag}>
                      <Sparkles size={12} color="#00FFA9" />
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/chat/${tutor.id}`)}
                  >
                    <MessageSquare size={20} color="#000" />
                    <Text style={styles.actionButtonText}>Start Chat</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                  >
                    <GraduationCap size={20} color="#FFF" />
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                      View Lessons
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </View>
        
        {/* Cyberpunk circuit patterns */}
        <View style={styles.circuitPatterns}>
          <View style={[styles.circuitLine, styles.circuitLine1]} />
          <View style={[styles.circuitLine, styles.circuitLine2]} />
          <View style={[styles.circuitLine, styles.circuitLine3]} />
          <View style={[styles.circuitDot, styles.circuitDot1]} />
          <View style={[styles.circuitDot, styles.circuitDot2]} />
          <View style={[styles.circuitDot, styles.circuitDot3]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 10,
      },
    }),
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#00FFA9',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 255, 169, 0.4)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
      },
    }),
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.15,
  },
  glowEffect: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
  },
  avatarSection: {
    marginRight: 20,
  },
  infoSection: {
    flex: 1,
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#00FFA9',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  catchphrase: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  expandedContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 20,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  specialtyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#00FFA9',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFA9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  circuitPatterns: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.2,
  },
  circuitLine: {
    position: 'absolute',
    backgroundColor: '#00FFA9',
    height: 1,
  },
  circuitLine1: {
    top: '20%',
    left: '10%',
    width: '30%',
    transform: [{ rotate: '45deg' }],
  },
  circuitLine2: {
    bottom: '30%',
    right: '15%',
    width: '25%',
    transform: [{ rotate: '-30deg' }],
  },
  circuitLine3: {
    top: '60%',
    left: '40%',
    width: '20%',
    transform: [{ rotate: '15deg' }],
  },
  circuitDot: {
    position: 'absolute',
    backgroundColor: '#00FFA9',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  circuitDot1: {
    top: '15%',
    right: '20%',
  },
  circuitDot2: {
    bottom: '25%',
    left: '15%',
  },
  circuitDot3: {
    top: '50%',
    right: '30%',
  },
});