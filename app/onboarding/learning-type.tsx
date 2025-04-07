import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, GraduationCap, BookOpen, ArrowDown } from 'lucide-react-native';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ParticleEffect from '@/components/ParticleEffect';
import { Picker } from '@react-native-picker/picker';

export default function LearningTypeScreen() {
  const { session } = useAuth();
  const [learningMode, setLearningMode] = useState<'grade' | 'independent'>('independent');
  const [gradeLevel, setGradeLevel] = useState<string>('6');
  const [skillLevel, setSkillLevel] = useState<string>('beginner');
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const schoolCardScale = useSharedValue(1);
  const independentCardScale = useSharedValue(1);
  
  useEffect(() => {
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back) });
  }, []);
  
  // Card hover/press animations
  useEffect(() => {
    if (learningMode === 'grade') {
      schoolCardScale.value = withTiming(1.05, { duration: 300 });
      independentCardScale.value = withTiming(0.98, { duration: 300 });
    } else {
      schoolCardScale.value = withTiming(0.98, { duration: 300 });
      independentCardScale.value = withTiming(1.05, { duration: 300 });
    }
  }, [learningMode]);
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  
  const schoolCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: schoolCardScale.value }],
  }));
  
  const independentCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: independentCardScale.value }],
  }));

  const handleContinue = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      // Update profile with learning preferences
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          learning_mode: learningMode,
          grade_level: learningMode === 'grade' ? gradeLevel : null,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Navigate to next step
      router.push('/onboarding/learning-track');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save learning preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <View style={styles.header}>
        <Text style={styles.title}>How Would You Like to Learn?</Text>
        <Text style={styles.subtitle}>Choose your learning journey type</Text>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="high"
          style={styles.cardContent}
        >
          <View style={styles.optionsContainer}>
            <Animated.View style={schoolCardStyle}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  learningMode === 'grade' && styles.selectedOption
                ]}
                onPress={() => setLearningMode('grade')}
              >
                <LinearGradient
                  colors={['rgba(0, 170, 255, 0.2)', 'rgba(0, 170, 255, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <GraduationCap size={40} color="#00AAFF" />
                <Text style={styles.optionTitle}>I'm in School (K-12)</Text>
                <Text style={styles.optionDescription}>
                  Follow a structured curriculum based on your grade level
                </Text>
                
                {learningMode === 'grade' && (
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Select Your Grade:</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowGradePicker(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {gradeLevel === 'K' ? 'Kindergarten' : `Grade ${gradeLevel}`}
                      </Text>
                      <ArrowDown size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    {showGradePicker && (
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={gradeLevel}
                          onValueChange={(itemValue) => {
                            setGradeLevel(itemValue);
                            setShowGradePicker(false);
                          }}
                          style={styles.picker}
                          dropdownIconColor="#FFFFFF"
                        >
                          <Picker.Item label="Kindergarten" value="K" />
                          <Picker.Item label="Grade 1" value="1" />
                          <Picker.Item label="Grade 2" value="2" />
                          <Picker.Item label="Grade 3" value="3" />
                          <Picker.Item label="Grade 4" value="4" />
                          <Picker.Item label="Grade 5" value="5" />
                          <Picker.Item label="Grade 6" value="6" />
                          <Picker.Item label="Grade 7" value="7" />
                          <Picker.Item label="Grade 8" value="8" />
                          <Picker.Item label="Grade 9" value="9" />
                          <Picker.Item label="Grade 10" value="10" />
                          <Picker.Item label="Grade 11" value="11" />
                          <Picker.Item label="Grade 12" value="12" />
                        </Picker>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={independentCardStyle}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  learningMode === 'independent' && styles.selectedOption
                ]}
                onPress={() => setLearningMode('independent')}
              >
                <LinearGradient
                  colors={['rgba(0, 255, 169, 0.2)', 'rgba(0, 255, 169, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <BookOpen size={40} color="#00FFA9" />
                <Text style={styles.optionTitle}>I'm Learning Independently</Text>
                <Text style={styles.optionDescription}>
                  Explore subjects based on your interests and skill level
                </Text>
                
                {learningMode === 'independent' && (
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Select Your Skill Level:</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowSkillPicker(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
                      </Text>
                      <ArrowDown size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    {showSkillPicker && (
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={skillLevel}
                          onValueChange={(itemValue) => {
                            setSkillLevel(itemValue);
                            setShowSkillPicker(false);
                          }}
                          style={styles.picker}
                          dropdownIconColor="#FFFFFF"
                        >
                          <Picker.Item label="Beginner" value="beginner" />
                          <Picker.Item label="Intermediate" value="intermediate" />
                          <Picker.Item label="Advanced" value="advanced" />
                        </Picker>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
          
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
              style={[styles.nextButton, loading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={loading}
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
              index === 1 && styles.activeDot
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
  optionsContainer: {
    flex: 1,
    gap: 20,
  },
  optionCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  selectedOption: {
    borderColor: '#00FFA9',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(0, 255, 169, 0.3)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
  },
  optionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 16,
  },
  dropdownContainer: {
    width: '100%',
    marginTop: 8,
  },
  dropdownLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  dropdownButtonText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
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