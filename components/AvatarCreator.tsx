import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shuffle, ChevronRight, Check, Incognito } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface AvatarCreatorProps {
  onComplete: () => void;
}

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

export default function AvatarCreator({ onComplete }: AvatarCreatorProps) {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState({
    species: '',
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

    setAvatar({
      ...avatar,
      primaryColor: colorCombo.primary,
      secondaryColor: colorCombo.secondary,
      eyeColor: colorCombo.eye,
      facialMarkings: markings,
      accessories: accessories,
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

      onComplete();
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

  const handleSave = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      // Get selected species ID
      const { data: speciesData } = await supabase
        .from('avatar_species')
        .select('id')
        .eq('name', avatar.species)
        .single();

      if (!speciesData) throw new Error('Species not found');

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

      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save avatar');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Choose Your Species</Text>
            <ScrollView style={styles.speciesGrid}>
              {/* Render species options */}
            </ScrollView>
          </View>
        );
      case 1:
        return (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Choose Your Identity</Text>
            <View style={styles.genderOptions}>
              {/* Render gender options */}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Create Your Name</Text>
            <TextInput
              style={styles.nameInput}
              value={avatar.name}
              onChangeText={(name) => setAvatar({ ...avatar, name })}
              placeholder="Enter your jungle name"
              placeholderTextColor="#666"
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Customize Your Look</Text>
            <View style={styles.colorPickers}>
              {/* Render color pickers */}
            </View>
            <TouchableOpacity style={styles.randomizeButton} onPress={handleRandomize}>
              <Shuffle size={20} color="#00FFA9" />
              <Text style={styles.randomizeText}>Randomize</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

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

      {renderStep()}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  anonymizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  anonymizeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000',
  },
  step: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFF',
    marginBottom: 24,
  },
  speciesGrid: {
    flex: 1,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  nameInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  colorPickers: {
    marginVertical: 20,
  },
  randomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 16,
  },
  randomizeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    padding: 16,
  },
  backText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000',
    marginHorizontal: 8,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
  },
});