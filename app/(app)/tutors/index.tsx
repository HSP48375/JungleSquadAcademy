import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { HelpCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ImmersiveBackground from '@/components/ImmersiveBackground';
import HolographicElements from '@/components/HolographicElements';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import TutorQuiz from '@/components/TutorQuiz';
import TutorCard from '@/components/TutorCard';

const tutors = [
  {
    id: 'tango',
    name: 'Tango',
    animal: 'Tiger',
    subject: 'Mathematics',
    catchphrase: "Let's pounce on those equations!",
    description:
      'Bold and energetic, loves breaking complex math into simple steps. Tango uses jungle-inspired analogies to make abstract concepts concrete and memorable.',
    image:
      'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=300&auto=format&fit=crop',
    gradient: ['#FF7B54', '#FFB26B'],
    specialties: ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
    theme: 'math',
  },
  {
    id: 'zara',
    name: 'Zara',
    animal: 'Zebra',
    subject: 'History & Geography',
    catchphrase: 'Stripe by stripe, we uncover the past!',
    description:
      'Inquisitive and wise, great at connecting historical patterns and cultural stories. Zara helps you navigate through time periods like a zebra leading its herd across the savanna.',
    image:
      'https://images.unsplash.com/photo-1501706362039-c06b2d715385?q=80&w=300&auto=format&fit=crop',
    gradient: ['#845EC2', '#D65DB1'],
    specialties: ['World History', 'Geography', 'Cultural Studies', 'Map Skills'],
    theme: 'history',
  },
  {
    id: 'milo',
    name: 'Milo',
    animal: 'Monkey',
    subject: 'Language Arts',
    catchphrase: "Let's swing into storytelling!",
    description:
      'Fun, creative, and energetic. Milo loves metaphors, jokes, and storytelling. His playful approach makes language learning an adventure through the jungle canopy.',
    image:
      'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=300&auto=format&fit=crop',
    gradient: ['#00C6A7', '#1E4D92'],
    specialties: ['Reading', 'Grammar', 'Writing', 'Literature'],
    theme: 'language',
  },
  {
    id: 'luna',
    name: 'Luna',
    animal: 'Lioness',
    subject: 'Science',
    catchphrase: 'Roar into discovery!',
    description:
      'Confident and nurturing. Luna encourages curiosity and experimentation, guiding students through scientific concepts with the precision of a lioness on the hunt.',
    image:
      'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=300&auto=format&fit=crop',
    gradient: ['#FF9A8B', '#FF6A88'],
    specialties: ['Biology', 'Chemistry', 'Physics', 'Lab Skills'],
    theme: 'science',
  },
  {
    id: 'bindi',
    name: 'Bindi',
    animal: 'Butterfly',
    subject: 'Art & Creativity',
    catchphrase: 'Spread your wings and create!',
    description:
      'Gentle and expressive. Bindi encourages users to think outside the box and be original, transforming ideas into beautiful creations just like her metamorphosis.',
    image:
      'https://images.unsplash.com/photo-1595873520615-67e8c98db5d1?q=80&w=300&auto=format&fit=crop',
    gradient: ['#FF61D2', '#FE9090'],
    specialties: ['Drawing', 'Painting', 'Digital Art', 'Creative Expression'],
    theme: 'art',
  },
  {
    id: 'chip',
    name: 'Chip',
    animal: 'Cheetah',
    subject: 'Technology',
    catchphrase: 'Code fast, think faster!',
    description:
      'Quick-thinking, clever, and witty. Chip loves all things tech and logic, racing through complex concepts with the speed and precision of a cheetah.',
    image:
      'https://images.unsplash.com/photo-1557728325-b66b92d905e5?q=80&w=300&auto=format&fit=crop',
    gradient: ['#4158D0', '#C850C0'],
    specialties: ['Programming', 'Digital Literacy', 'Web Design', 'App Development'],
    theme: 'tech',
  },
  {
    id: 'rhea',
    name: 'Rhea',
    animal: 'Rhino',
    subject: 'Music',
    catchphrase: "Let's charge into rhythm!",
    description:
      'Calm, rhythmic, and creative. Rhea helps users find their voice and sound, with the strength and presence of a rhino but the gentleness of a music teacher.',
    image:
      'https://images.unsplash.com/photo-1584844115436-473eb4a4de8b?q=80&w=300&auto=format&fit=crop',
    gradient: ['#8EC5FC', '#E0C3FC'],
    specialties: ['Music Theory', 'Instruments', 'Singing', 'Composition'],
    theme: 'art',
  },
  {
    id: 'gabi',
    name: 'Gabi',
    animal: 'Giraffe',
    subject: 'Life Skills',
    catchphrase: 'See the big picture of life!',
    description:
      'Wise and practical. Gabi gives helpful, real-world guidance in a calming way, helping students see above the immediate challenges to the bigger opportunities ahead.',
    image:
      'https://images.unsplash.com/photo-1547721064-da6cfb341d50?q=80&w=300&auto=format&fit=crop',
    gradient: ['#FAD961', '#F76B1C'],
    specialties: ['Money Management', 'Budgeting', 'Life Planning', 'Career Skills'],
    theme: 'default',
  },
  {
    id: 'ellie',
    name: 'Ellie',
    animal: 'Elephant',
    subject: 'Social & Emotional Learning',
    catchphrase: 'Feel it. Understand it. Grow with it.',
    description:
      'Gentle, mindful, and emotionally supportive. Ellie helps users build empathy and confidence with the wisdom and memory of an elephant, never forgetting what matters most.',
    image:
      'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?q=80&w=300&auto=format&fit=crop',
    gradient: ['#B721FF', '#21D4FD'],
    specialties: ['Emotional Intelligence', 'Social Skills', 'Mindfulness', 'Self-Awareness'],
    theme: 'default',
  },
  {
    id: 'luma',
    name: 'Luma',
    animal: 'Lemur',
    subject: 'Language Learning',
    catchphrase: "One word at a time — let's leap into language!",
    description:
      'Curious, cheerful, and encouraging. Luma loves teaching basic phrases, vocab, and cultural tips, jumping between languages with the agility of a lemur in the trees.',
    image:
      'https://images.unsplash.com/photo-1606574977100-16c8c0365d33?q=80&w=300&auto=format&fit=crop',
    gradient: ['#48C6EF', '#6F86D6'],
    specialties: ['Spanish', 'French', 'Basic Phrases', 'Cultural Learning'],
    theme: 'language',
  },
];

export default function TutorsScreen() {
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  const handleQuizComplete = (tutorId: string) => {
    setShowQuiz(false);
    setSelectedTutor(tutorId);
    const tutor = tutors.find(t => t.id === tutorId);
    if (tutor) setCurrentTheme(tutor.theme);
  };

  const handleTutorSelect = (tutorId: string) => {
    const newSelection = selectedTutor === tutorId ? null : tutorId;
    setSelectedTutor(newSelection);
    const tutor = tutors.find(t => t.id === newSelection);
    setCurrentTheme(tutor ? tutor.theme : 'default');
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground theme={currentTheme as any} intensity="medium" />
      <HolographicElements intensity="low" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassmorphicCard glowColor="#00FFA9" intensity="medium" style={styles.headerCard}>
          <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
            <View>
              <Text style={styles.title}>Meet Your Tutors</Text>
              <Text style={styles.subtitle}>
                Your personal jungle guides to knowledge and discovery
              </Text>
            </View>
            <TouchableOpacity style={styles.quizButton} onPress={() => setShowQuiz(true)}>
              <HelpCircle size={20} color="#000" />
              <Text style={styles.quizButtonText}>Find Your Match</Text>
            </TouchableOpacity>
          </Animated.View>
        </GlassmorphicCard>

        {showQuiz ? (
          <GlassmorphicCard glowColor="#00FFA9" intensity="high" style={styles.quizCard}>
            <TutorQuiz onComplete={handleQuizComplete} onClose={() => setShowQuiz(false)} />
          </GlassmorphicCard>
        ) : (
          tutors.map((tutor, index) => (
            <Animated.View key={tutor.id} entering={FadeInDown.delay(index * 100).duration(500)}>
              <TutorCard
                tutor={tutor}
                index={index}
                isSelected={selectedTutor === tutor.id}
                onSelect={handleTutorSelect}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
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
    maxWidth: 250,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  quizButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
  quizCard: {
    marginBottom: 24,
  },
});
