import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  FadeInDown,
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, BookOpen, Calculator, Globe, Microscope, Palette, Code, Music, Briefcase, Heart, Languages } from 'lucide-react-native';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ParticleEffect from '@/components/ParticleEffect';

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

export default function LearningTrackScreen() {
  const { session } = useAuth();
  const [learningMode, setLearningMode] = useState<'grade' | 'independent'>('independent');
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState('default');
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Fetch user's learning preferences
    fetchUserPreferences();
    
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back) });
  }, []);
  
  const fetchUserPreferences = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('learning_mode, grade_level')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setLearningMode(data.learning_mode as 'grade' | 'independent');
        setGradeLevel(data.grade_level);
      }
    } catch (e) {
      console.error('Error fetching user preferences:', e);
    }
  };
  
  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      // If already selected, remove it
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      }
      
      // Otherwise add it (limit to 3 selections)
      if (prev.length < 3) {
        const newSelection = [...prev, subjectId];
        
        // Update theme based on first selection
        if (newSelection.length === 1) {
          const subject = SUBJECTS.find(s => s.id === subjectId);
          if (subject) {
            setCurrentTheme(subject.theme);
          }
        }
        
        return newSelection;
      }
      
      return prev;
    });
  };
  
  const handleContinue = async () => {
    if (!session?.user || selectedSubjects.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // In a real app, we would save the selected subjects to the user's profile
      // or create learning track enrollments
      
      // For now, just navigate to the confirmation screen
      router.push({
        pathname: '/onboarding/confirmation',
        params: {
          subjects: selectedSubjects.join(',')
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save learning tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <View style={styles.container}>
      <ImmersiveBackground theme={currentTheme as any} intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Learning Tracks</Text>
        <Text style={styles.subtitle}>
          Select up to 3 subjects you'd like to explore
        </Text>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="high"
          style={styles.cardContent}
        >
          <Text style={styles.selectionCount}>
            {selectedSubjects.length}/3 subjects selected
          </Text>
          
          <ScrollView style={styles.subjectsContainer} contentContainerStyle={styles.subjectsContent}>
            {SUBJECTS.map((subject, index) => {
              const isSelected = selectedSubjects.includes(subject.id);
              const SubjectIcon = subject.icon;
              
              return (
                <Animated.View
                  key={subject.id}
                  entering={FadeInDown.delay(index * 100).duration(400)}
                >
                  <TouchableOpacity
                    style={[
                      styles.subjectCard,
                      isSelected && styles.selectedSubject
                    ]}
                    onPress={() => handleSubjectToggle(subject.id)}
                  >
                    <LinearGradient
                      colors={[
                        isSelected ? subject.colors[0] + '30' : 'rgba(26, 26, 26, 0.6)', 
                        isSelected ? subject.colors[1] + '10' : 'rgba(26, 26, 26, 0.3)'
                      ]}
                      style={StyleSheet.absoluteFill}
                    />
                    
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: subject.colors[0] + '20' }
                    ]}>
                      <SubjectIcon size={24} color={subject.colors[0]} />
                    </View>
                    
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectDescription}>{subject.description}</Text>
                    </View>
                    
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: subject.colors[0] }]}>
                        <Text style={styles.selectedText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.navigation}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={loading}
            >
              <ChevronLeft size={20} color="#FFFFFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton, 
                (loading || selectedSubjects.length === 0) && styles.buttonDisabled
              ]}
              onPress={handleContinue}
              disabled={loading || selectedSubjects.length === 0}
            >
              <Text style={styles.nextText}>Continue</Text>
              <ChevronRight size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>
      </Animated.View>
      
      <View style={styles.progressIndicator}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === 2 && styles.activeDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  selectionCount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
    marginBottom: 16,
    textAlign: 'center',
  },
  subjectsContainer: {
    flex: 1,
  },
  subjectsContent: {
    paddingBottom: 20,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  selectedSubject: {
    borderColor: '#00FFA9',
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subjectDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  backText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFA9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#00FFA9',
    ...Platform.select({
      web: {
        boxShadow: '0 0 5px rgba(0, 255, 169, 0.5)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 3,
      },
    }),
  },
});