import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
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
import { Shuffle, ChevronRight, ChevronLeft, Check, Incognito } from 'lucide-react-native';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import AvatarDisplay from '@/components/AvatarDisplay';
import ParticleEffect from '@/components/ParticleEffect';

const ADJECTIVES = [
  'Swift', 'Mystic', 'Glowing', 'Brave', 'Clever', 'Wild', 'Noble', 'Bright',
  'Fierce', 'Wise', 'Silent', 'Mighty', 'Royal', 'Shadow', 'Crystal', 'Cosmic'
];

const BASE_SPECIES = [
  'Tiger', 'Monkey', 'Zebra', 'Elephant', 'Lemur', 'Giraffe', 'Butterfly',
  'Lion', 'Rhino', 'Raccoon'
];

const COLOR_COMBINATIONS = [
  { primary: '#00FFA9', secondary: '#333333', eye: '#FFD700' }, // Jungle Neon
  { primary: '#FF6B6B', secondary: '#4A4A4A', eye: '#4ECDC4' }, // Sunset Glow
  { primary: '#845EC2', secondary: '#2C2C2C', eye: '#FF9671' }, // Mystic Purple
  { primary: '#00C9A7', secondary: '#1A1A1A', eye: '#FFC75F' }, // Ocean Depths
  { primary: '#4D8076', secondary: '#2D2D2D', eye: '#C4FCEF' }, // Forest Shade
  { primary: '#FF8066', secondary: '#3D3D3D', eye: '#88D8B0' }, // Desert Dawn
];

const FACIAL_MARKINGS = [
  ['tribal_stripes'], 
  ['neon_spots'],
  ['star_pattern'],
  ['leaf_marks'],
  ['crystal_marks'],
  []
];

const ACCESSORIES = [
  ['leaf_crown'],
  ['crystal_pendant'],
  ['vine_bracelet'],
  ['glow_rings'],
  []
];

export default function AvatarCreationScreen() {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState({
    species: 'Tiger',
    gender: 'not_specified',
    name: '',
    primaryColor: '#00FFA9',
    secondaryColor: '#333333',
    eyeColor: '#FFD700',
    facialMarkings: [],
    accessories: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Fetch available species
    fetchSpecies();
    
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back) });
    
    // Generate a random name suggestion
    setAvatar(prev => ({
      ...prev,
      name: generateRandomName()
    }));
  }, []);
  
  const fetchSpecies = async () => {
    try {
      const { data, error } = await supabase
        .from('avatar_species')
        .select('name')
        .eq('type', 'base');
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSpeciesOptions(data.map(item => item.name));
      } else {
        setSpeciesOptions(BASE_SPECIES);
      }
    } catch (e) {
      console.error('Error fetching species:', e);
      setSpeciesOptions(BASE_SPECIES);
    }
  };

  const generateRandomName = () => {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const species = BASE_SPECIES[Math.floor(Math.random() * BASE_SPECIES.length)];
    const number = Math.floor(Math.random() * 100);
    return `${adjective}${species}${number}`;
  };

  const handleRandomize = () => {
    const colorCombo = COLOR_COMBINATIONS[Math.floor(Math.random() * COLOR_COMBINATIONS.length)];
    const markings = FACIAL_MARKINGS[Math.floor(Math.random() * FACIAL_MARKINGS.length)];
    const accessories = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)];
    const species = speciesOptions[Math.floor(Math.random() * speciesOptions.length)];

    setAvatar({
      ...avatar,
      species,
      primaryColor: colorCombo.primary,
      secondaryColor: colorCombo.secondary,
      eyeColor: colorCombo.eye,
      facialMarkings: markings,
      accessories: accessories,
      name: generateRandomName(),
    });
  };

  const handleAnonymize = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      // Get random base species
      const { data: speciesData, error: speciesError } = await supabase
        .from('avatar_species')
        .select('id, name')
        .eq('type', 'base')
        .limit(1)
        .single();

      if (speciesError) throw speciesError;

      // Generate random attributes
      const colorCombo = COLOR_COMBINATIONS[Math.floor(Math.random() * COLOR_COMBINATIONS.length)];
      const markings = FACIAL_MARKINGS[Math.floor(Math.random() * FACIAL_MARKINGS.length)];
      const accessories = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)];
      const randomName = generateRandomName();

      // Create avatar
      const { error: avatarError } = await supabase
        .from('user_avatar')
        .insert({
          user_id: session.user.id,
          species_id: speciesData.id,
          avatar_name: randomName,
          gender: 'not_specified',
          primary_color: colorCombo.primary,
          secondary_color: colorCombo.secondary,
          eye_color: colorCombo.eye,
          facial_markings: markings,
          accessories: accessories,
        });

      if (avatarError) throw avatarError;

      // Update profile with learning mode
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          learning_mode: 'independent',
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Navigate to home
      router.replace('/(app)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create anonymous avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      // Get selected species ID
      const { data: speciesData, error: speciesError } = await supabase
        .from('avatar_species')
        .select('id')
        .eq('name', avatar.species)
        .single();

      if (speciesError) throw speciesError;

      // Create avatar
      const { error: avatarError } = await supabase
        .from('user_avatar')
        .insert({
          user_id: session.user.id,
          species_id: speciesData.id,
          avatar_name: avatar.name,
          gender: avatar.gender,
          primary_color: avatar.primaryColor,
          secondary_color: avatar.secondaryColor,
          eye_color: avatar.eyeColor,
          facial_markings: avatar.facialMarkings,
          accessories: avatar.accessories,
        });

      if (avatarError) throw avatarError;

      // Continue to next step
      router.push('/onboarding/learning-type');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save avatar');
    } finally {
      setLoading(false);
    }
  };
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const renderStep = () => {
    switch (step) {
      case 0: // Choose species
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Your Species</Text>
            <Text style={styles.stepDescription}>
              Select the animal that represents your learning spirit
            </Text>
            
            <ScrollView style={styles.speciesGrid} contentContainerStyle={styles.speciesGridContent}>
              {speciesOptions.map((species, index) => (
                <Animated.View 
                  key={species}
                  entering={FadeInDown.delay(index * 100).duration(400)}
                >
                  <TouchableOpacity
                    style={[
                      styles.speciesOption,
                      avatar.species === species && styles.selectedSpecies
                    ]}
                    onPress={() => setAvatar({ ...avatar, species })}
                  >
                    <AvatarDisplay
                      species={species}
                      name=""
                      primaryColor={avatar.primaryColor}
                      secondaryColor={avatar.secondaryColor}
                      size="small"
                      showName={false}
                    />
                    <Text style={styles.speciesName}>{species}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        );
        
      case 1: // Choose gender
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Your Identity</Text>
            <Text style={styles.stepDescription}>
              Select how you'd like to be represented
            </Text>
            
            <View style={styles.genderOptions}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  avatar.gender === 'male' && styles.selectedGender
                ]}
                onPress={() => setAvatar({ ...avatar, gender: 'male' })}
              >
                <LinearGradient
                  colors={['#00AAFF30', '#00AAFF10']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.genderIcon}>♂</Text>
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  avatar.gender === 'female' && styles.selectedGender
                ]}
                onPress={() => setAvatar({ ...avatar, gender: 'female' })}
              >
                <LinearGradient
                  colors={['#FF00AA30', '#FF00AA10']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.genderIcon}>♀</Text>
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  avatar.gender === 'neutral' && styles.selectedGender
                ]}
                onPress={() => setAvatar({ ...avatar, gender: 'neutral' })}
              >
                <LinearGradient
                  colors={['#FFAA0030', '#FFAA0010']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.genderIcon}>⚧</Text>
                <Text style={styles.genderText}>Neutral</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  avatar.gender === 'not_specified' && styles.selectedGender
                ]}
                onPress={() => setAvatar({ ...avatar, gender: 'not_specified' })}
              >
                <LinearGradient
                  colors={['#00FFA930', '#00FFA910']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.genderIcon}>✱</Text>
                <Text style={styles.genderText}>Not Specified</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 2: // Create name
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Your Name</Text>
            <Text style={styles.stepDescription}>
              What should we call you in the jungle?
            </Text>
            
            <GlassmorphicCard
              glowColor="#00FFA9"
              intensity="medium"
              style={styles.nameInputContainer}
            >
              <TextInput
                style={styles.nameInput}
                value={avatar.name}
                onChangeText={(name) => setAvatar({ ...avatar, name })}
                placeholder="Enter your jungle name"
                placeholderTextColor="#666666"
                maxLength={20}
              />
            </GlassmorphicCard>
            
            <TouchableOpacity 
              style={styles.randomizeButton}
              onPress={() => setAvatar({ ...avatar, name: generateRandomName() })}
            >
              <Shuffle size={20} color="#00FFA9" />
              <Text style={styles.randomizeText}>Generate Random Name</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 3: // Customize look
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Customize Your Look</Text>
            <Text style={styles.stepDescription}>
              Choose your colors and style
            </Text>
            
            <View style={styles.previewContainer}>
              <AvatarDisplay
                species={avatar.species}
                name={avatar.name}
                primaryColor={avatar.primaryColor}
                secondaryColor={avatar.secondaryColor}
                size="large"
                showName={false}
              />
              <Text style={styles.previewName}>{avatar.name}</Text>
            </View>
            
            <View style={styles.colorPickers}>
              <Text style={styles.colorLabel}>Primary Color</Text>
              <View style={styles.colorOptions}>
                {COLOR_COMBINATIONS.map((combo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: combo.primary },
                      avatar.primaryColor === combo.primary && styles.selectedColor
                    ]}
                    onPress={() => setAvatar({
                      ...avatar,
                      primaryColor: combo.primary,
                      secondaryColor: combo.secondary,
                      eyeColor: combo.eye
                    })}
                  />
                ))}
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.randomizeButton}
              onPress={handleRandomize}
            >
              <Shuffle size={20} color="#00FFA9" />
              <Text style={styles.randomizeText}>Randomize Look</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      <ParticleEffect intensity="medium" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Create your Jungle Avatar</Text>
        <Text style={styles.subtitle}>and join the Squad!</Text>

        <TouchableOpacity
          style={styles.anonymizeButton}
          onPress={handleAnonymize}
          disabled={loading}
        >
          <Incognito size={20} color="#000" />
          <Text style={styles.anonymizeText}>Anonymize Me</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="high"
          style={styles.cardContent}
        >
          {renderStep()}
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.navigation}>
            {step > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <ChevronLeft size={20} color="#FFFFFF" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading || (step === 2 && !avatar.name.trim())}
            >
              {step === 3 ? (
                <>
                  <Check size={20} color="#000" />
                  <Text style={styles.nextText}>Complete</Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextText}>Next</Text>
                  <ChevronRight size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>
      </Animated.View>
      
      <View style={styles.progressIndicator}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === step && styles.activeDot
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
    marginBottom: 24,
    textAlign: 'center',
  },
  anonymizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    marginBottom: 20,
  },
  anonymizeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
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
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  stepDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
  },
  speciesGrid: {
    flex: 1,
  },
  speciesGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 20,
  },
  speciesOption: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
  },
  selectedSpecies: {
    borderColor: '#00FFA9',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
  },
  speciesName: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  genderOption: {
    width: '45%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedGender: {
    borderColor: '#00FFA9',
    borderWidth: 2,
  },
  genderIcon: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  genderText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  nameInputContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  nameInput: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    padding: 16,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 12,
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  colorPickers: {
    marginBottom: 20,
  },
  colorLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
      },
      default: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  randomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 169, 0.3)',
    marginTop: 8,
    gap: 8,
  },
  randomizeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
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