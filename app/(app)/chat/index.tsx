import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Zap, Star, Book } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ParticleEffect from '@/components/ParticleEffect';

export default function ChatList() {
  const { session } = useAuth();
  const { canAccessTutor, canAccessAllTutors, loading: accessLoading } = useFeatureAccess(session?.user?.id ?? '');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTutor, setHoveredTutor] = useState(null);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('name');

      if (error) throw error;
      setTutors(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Get tutor theme colors
  const getTutorTheme = (tutor) => {
    const subjectColorMap = {
      'Mathematics': ['#00FFFF', '#0088FF'],
      'History & Geography': ['#FF00FF', '#8800FF'],
      'Language Arts': ['#FFFF00', '#FF8800'],
      'Science': ['#00FF00', '#00FFAA'],
      'Art & Creativity': ['#FF00AA', '#FF00FF'],
      'Technology': ['#00AAFF', '#0066FF'],
      'Music': ['#AA00FF', '#FF00AA'],
      'Life Skills': ['#FFAA00', '#FF5500'],
      'Social & Emotional Learning': ['#FF5500', '#FF0066'],
      'Language Learning': ['#55FFAA', '#00FFFF'],
    };
    
    return subjectColorMap[tutor.subject] || ['#00FFA9', '#00AAFF'];
  };

  if (loading || accessLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00FFA9" />
        <Text style={styles.loadingText}>Loading tutors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ParticleEffect intensity="medium" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.duration(800)}
          style={styles.header}
        >
          <Text style={styles.title}>Jungle Squad Tutors</Text>
          <Text style={styles.subtitle}>
            Choose your guide for today's learning adventure
          </Text>
        </Animated.View>
        
        <View style={styles.tutorsGrid}>
          {tutors.map((tutor, index) => {
            const hasAccess = canAccessTutor(tutor.id) || canAccessAllTutors;
            const tutorTheme = getTutorTheme(tutor);
            
            // Animation values
            const glowOpacity = useSharedValue(0.5);
            const cardScale = useSharedValue(1);
            
            // Set up animations
            useEffect(() => {
              glowOpacity.value = withRepeat(
                withSequence(
                  withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
                  withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
                ),
                -1,
                true
              );
              
              if (hoveredTutor === tutor.id) {
                cardScale.value = withTiming(1.03, { duration: 300 });
              } else {
                cardScale.value = withTiming(1, { duration: 300 });
              }
            }, [hoveredTutor]);
            
            const cardStyle = useAnimatedStyle(() => ({
              transform: [{ scale: cardScale.value }],
            }));
            
            return (
              <Animated.View 
                key={tutor.id}
                entering={FadeInDown.delay(index * 100).duration(500)}
                style={[styles.tutorCardWrapper, cardStyle]}
              >
                <Pressable 
                  style={styles.tutorCard}
                  onPress={() => hasAccess ? router.push(`/chat/${tutor.id}`) : router.push('/subscription')}
                  onHoverIn={() => setHoveredTutor(tutor.id)}
                  onHoverOut={() => setHoveredTutor(null)}
                >
                  <LinearGradient
                    colors={[tutorTheme[0] + '30', tutorTheme[1] + '10']}
                    style={styles.cardGradient}
                  />
                  
                  {!hasAccess && (
                    <View style={styles.lockOverlay}>
                      <Lock size={24} color="#FFD700" />
                      <Text style={styles.lockText}>Upgrade to Access</Text>
                    </View>
                  )}
                  
                  <View style={styles.avatarContainer}>
                    <Image 
                      source={{ uri: tutor.avatar_url }} 
                      style={styles.avatar}
                    />
                    
                    {/* Cyberpunk overlay */}
                    <LinearGradient
                      colors={['transparent', tutorTheme[0] + '60']}
                      style={styles.avatarOverlay}
                    />
                    
                    {/* Subject icon */}
                    <View style={[styles.subjectIcon, { backgroundColor: tutorTheme[0] }]}>
                      {tutor.subject === 'Mathematics' && <Zap size={14} color="#000" />}
                      {tutor.subject === 'Language Arts' && <Book size={14} color="#000" />}
                      {tutor.subject === 'Science' && <Star size={14} color="#000" />}
                      {!['Mathematics', 'Language Arts', 'Science'].includes(tutor.subject) && 
                        <Star size={14} color="#000" />
                      }
                    </View>
                  </View>
                  
                  <View style={styles.tutorInfo}>
                    <Text style={styles.tutorName}>
                      {tutor.name} the {tutor.animal}
                    </Text>
                    
                    <Text style={[styles.tutorSubject, { color: tutorTheme[0] }]}>
                      {tutor.subject}
                    </Text>
                    
                    <Text style={styles.tutorCatchphrase}>
                      "{tutor.catchphrase}"
                    </Text>
                  </View>
                  
                  {/* Cyberpunk circuit decoration */}
                  <View style={styles.circuitPatterns}>
                    <View style={[styles.circuitLine, styles.circuitLine1]} />
                    <View style={[styles.circuitLine, styles.circuitLine2]} />
                    <View style={[styles.circuitLine, styles.circuitLine3]} />
                    <View style={[styles.circuitDot, styles.circuitDot1]} />
                    <View style={[styles.circuitDot, styles.circuitDot2]} />
                    <View style={[styles.circuitDot, styles.circuitDot3]} />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
  },
  tutorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tutorCardWrapper: {
    width: '100%',
    marginBottom: 16,
    ...Platform.select({
      web: {
        width: 'calc(50% - 8px)',
      },
    }),
  },
  tutorCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 16,
  },
  lockText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFD700',
    marginTop: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(0, 255, 169, 0.3)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 5,
      },
    }),
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  subjectIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00FFA9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  tutorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  tutorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  tutorSubject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
    marginBottom: 4,
  },
  tutorCatchphrase: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    fontStyle: 'italic',
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
  },
});