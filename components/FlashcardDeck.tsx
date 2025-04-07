import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Book, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);

interface FlashcardDeckProps {
  title: string;
  cards: Array<{
    id: string;
    front: string;
    back: string;
    hints?: string[];
  }>;
  onCardReview: (cardId: string, rating: number, correct: boolean) => void;
}

export default function FlashcardDeck({ title, cards, onCardReview }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const currentCard = cards[currentIndex];

  const flipCard = () => {
    rotation.value = withSequence(
      withSpring(180),
      withTiming(0, {}, () => {
        runOnJS(setShowingBack)(!showingBack);
      })
    );
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const isCorrect = direction === 'right';
    const rating = isCorrect ? 5 : 1;

    translateX.value = withSequence(
      withSpring(direction === 'right' ? CARD_WIDTH : -CARD_WIDTH),
      withTiming(0, {}, () => {
        runOnJS(onCardReview)(currentCard.id, rating, isCorrect);
        runOnJS(setCurrentIndex)((prev) => (prev + 1) % cards.length);
        runOnJS(setShowingBack)(false);
      })
    );
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateY: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  if (!currentCard) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No cards to review!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.counter}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <TouchableOpacity style={styles.cardContent} onPress={flipCard}>
          <Text style={styles.cardText}>
            {showingBack ? currentCard.back : currentCard.front}
          </Text>
          {!showingBack && currentCard.hints && currentCard.hints.length > 0 && (
            <View style={styles.hints}>
              {currentCard.hints.map((hint, index) => (
                <Text key={index} style={styles.hintText}>
                  Hint {index + 1}: {hint}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.flipPrompt}>
            <RotateCw size={16} color="#666666" />
            <Text style={styles.flipText}>Tap to flip</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.incorrectButton]}
          onPress={() => handleSwipe('left')}
        >
          <ThumbsDown size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Incorrect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.correctButton]}
          onPress={() => handleSwipe('right')}
        >
          <ThumbsUp size={24} color="#000000" />
          <Text style={[styles.actionText, styles.correctText]}>Correct</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  counter: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
  card: {
    width: CARD_WIDTH,
    height: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  hints: {
    marginTop: 20,
  },
  hintText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  flipPrompt: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flipText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  incorrectButton: {
    backgroundColor: '#333333',
  },
  correctButton: {
    backgroundColor: '#00FFA9',
  },
  actionText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  correctText: {
    color: '#000000',
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});