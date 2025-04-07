import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ParticleEffect from '@/components/ParticleEffect';
import AvatarDisplay from '@/components/AvatarDisplay';

export default function ConfirmationScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const subjects = params.subjects ? (params.subjects as string).split(',') : [];
  
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);
  const confettiOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Fetch user's avatar
    fetchUserAvatar();
    
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back) });
    
    // Avatar entrance animation
    avatarScale.value = withDelay(
      500,
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) })
      )
    );
    
    // Confetti animation
    confettiOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 500 })
    );
  }, []);
  
  const fetchUserAvatar = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_avatar')
        .select(`
          *,
          species:avatar_species (
            name,
            type,
            visual_effects,
            idle_animation
          )
        `)
        .eq('user_id', session.user.id)
        .single();
        
      if (error) throw error;
      
      setAvatar(data);
    } catch (e) {
      console.error('Error fetching avatar:', e);
    }
  };
  
  const handleComplete = () => {
    router.replace('/(app)');
  };
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));
  
  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="high" />
      <ParticleEffect count={40} intensity="high" />
      
      {/* Confetti animation */}
      <Animated.View style={[styles.confettiContainer, confettiStyle]}>
        <LottieView
          source={require('@/assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={styles.confetti}
        />
      </Animated.View>
      
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to the Jungle!</Text>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="high"
          style={styles.cardContent}
        >
          <Animated.View style={[styles.avatarContainer, avatarStyle]}>
            {avatar && (
              <AvatarDisplay
                species={avatar.species?.name || 'Tiger'}
                name={avatar.avatar_name}
                primaryColor={avatar.primary_color}
                secondaryColor={avatar.secondary_color}
                visualEffects={avatar.species?.visual_effects}
                idleAnimation={avatar.species?.idle_animation}
                size="large"
                showName={false}
              />
            )}
          </Animated.View>
          
          <Text style={styles.welcomeText}>
            Welcome to Jungle Squad Academy, {avatar?.avatar_name || 'Explorer'}!
          </Text>
          
          <Text style={styles.messageText}>
            Real results. Real progress. Welcome to the (AI) jungle.
          </Text>
          
          <View style={styles.subjectsContainer}>
            <Text style={styles.subjectsTitle}>Your Learning Tracks:</Text>
            <View style={styles.subjectTags}>
              {subjects.map((subjectId) => {
                const subject = SUBJECTS.find(s => s.id === subjectId);
                if (!subject) return null;
                
                return (
                  <View 
                    key={subjectId} 
                    style={[
                      styles.subjectTag,
                      { backgroundColor: subject.colors[0] + '30' }
                    ]}
                  >
                    <subject.icon size={16} color={subject.colors[0]} />
                    <Text style={[
                      styles.subjectTagText,
                      { color: subject.colors[0] }
                    ]}>
                      {subject.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
          >
            <LinearGradient
              colors={['#00FFA9', '#00AAFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.completeButtonText}>Let's Go!</Text>
            <ChevronRight size={20} color="#000000" />
          </TouchableOpacity>
        </GlassmorphicCard>
      </Animated.View>
    </View>
  );
}

// Subject definitions with icons and themes
const SUBJECTS = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: Calculator,
    description: 'Master numbers, algebra, geometry and more',
    theme: 'math',
    colors: ['#00FFFF', '#0088FF'],
  },
  {
    id: 'history',
    name: 'History & Geography',
    icon: Globe,
    description: 'Explore the past and understand our world',
    theme: 'history',
    colors: ['#FF00FF', '#8800FF'],
  },
  {
    id: 'language',
    name: 'Language Arts',
    icon: BookOpen,
    description: 'Develop reading, writing and communication skills',
    theme: 'language',
    colors: ['#FFFF00', '#FF8800'],
  },
  {
    id: 'science',
    name: 'Science',
    icon: Microscope,
    description: 'Discover how the natural world works',
    theme: 'science',
    colors: ['#00FF00', '#00FFAA'],
  },
  {
    id: 'art',
    name: 'Art & Creativity',
    icon: Palette,
    description: 'Express yourself through various art forms',
    theme: 'art',
    colors: ['#FF00AA', '#FF00FF'],
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: Code,
    description: 'Learn coding, digital literacy and tech skills',
    theme: 'tech',
    colors: ['#00AAFF', '#0066FF'],
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    description: 'Explore rhythm, melody and musical expression',
    theme: 'art',
    colors: ['#AA00FF', '#FF00AA'],
  },
  {
    id: 'life-skills',
    name: 'Life Skills',
    icon: Briefcase,
    description: 'Develop practical skills for everyday life',
    theme: 'default',
    colors: ['#FFAA00', '#FF5500'],
  },
  {
    id: 'social',
    name: 'Social & Emotional',
    icon: Heart,
    description: 'Build emotional intelligence and social skills',
    theme: 'default',
    colors: ['#FF5500', '#FF0066'],
  },
  {
    id: 'languages',
    name: 'Language Learning',
    icon: Languages,
    description: 'Learn new languages and explore cultures',
    theme: 'language',
    colors: ['#55FFAA', '#00FFFF'],
  },
];

import { Calculator, Globe, BookOpen, Microscope, Palette, Code, Music, Briefcase, Heart, Languages } from 'lucide-react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  card: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginVertical: 20,
  },
  welcomeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  messageText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#00FFA9',
    textAlign: 'center',
    marginBottom: 30,
  },
  subjectsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  subjectsTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subjectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  subjectTagText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 'auto',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 255, 169, 0.4)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  completeButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#000000',
    marginRight: 8,
  },
});