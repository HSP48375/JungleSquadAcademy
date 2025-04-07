import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Brain, Heart, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const questions = [
  {
    id: 1,
    text: "What interests you most?",
    options: [
      { id: 'logical', text: 'Solving Problems', icon: Brain, score: { tango: 2, chip: 2, luna: 1 } },
      { id: 'creative', text: 'Being Creative', icon: Sparkles, score: { bindi: 2, milo: 2, rhea: 1 } },
      { id: 'emotional', text: 'Understanding Others', icon: Heart, score: { ellie: 2, gabi: 2, zara: 1 } },
    ],
  },
  {
    id: 2,
    text: "How do you prefer to learn?",
    options: [
      { id: 'structured', text: 'Step by Step', score: { tango: 2, luna: 2, gabi: 1 } },
      { id: 'exploratory', text: 'Through Discovery', score: { chip: 2, bindi: 2, zara: 1 } },
      { id: 'interactive', text: 'By Discussion', score: { milo: 2, ellie: 2, luma: 1 } },
    ],
  },
  {
    id: 3,
    text: "What's your biggest goal?",
    options: [
      { id: 'mastery', text: 'Master a Skill', score: { tango: 2, rhea: 2, chip: 1 } },
      { id: 'growth', text: 'Personal Growth', score: { ellie: 2, gabi: 2, bindi: 1 } },
      { id: 'fun', text: 'Have Fun Learning', score: { milo: 2, luma: 2, zara: 1 } },
    ],
  },
];

interface TutorQuizProps {
  onComplete: (tutorId: string) => void;
  onClose: () => void;
}

export default function TutorQuiz({ onComplete, onClose }: TutorQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const handleAnswer = (option: typeof questions[0]['options'][0]) => {
    const newScores = { ...scores };
    Object.entries(option.score).forEach(([tutor, score]) => {
      newScores[tutor] = (newScores[tutor] || 0) + score;
    });
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      const bestTutor = Object.entries(newScores).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0];
      onComplete(bestTutor);
    }
  };

  const AnimatedOption = ({ option, index }: { 
    option: typeof questions[0]['options'][0],
    index: number 
  }) => {
    const Icon = option.icon;
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: withDelay(index * 200, withSpring(1)),
      transform: [{ 
        translateY: withDelay(
          index * 200, 
          withSpring(0, { damping: 12 })
        ) 
      }],
    }));

    return (
      <Animated.View style={[{ opacity: 0, transform: [{ translateY: 20 }] }, animatedStyle]}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleAnswer(option)}
        >
          <Icon size={24} color="#00FFA9" />
          <Text style={styles.optionText}>{option.text}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        {questions[currentQuestion].text}
      </Text>

      <View style={styles.options}>
        {questions[currentQuestion].options.map((option, index) => (
          <AnimatedOption key={option.id} option={option} index={index} />
        ))}
      </View>

      <View style={styles.progress}>
        {questions.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentQuestion && styles.progressDotActive
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>Skip Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  question: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  progressDotActive: {
    backgroundColor: '#00FFA9',
  },
  closeButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  closeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666',
  },
});