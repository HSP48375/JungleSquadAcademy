import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useFlashcards } from '@/hooks/useFlashcards';
import FlashcardDeck from '@/components/FlashcardDeck';

export default function TutorFlashcardsScreen() {
  const { tutor } = useLocalSearchParams();
  const { session } = useAuth();
  const {
    decks,
    cards,
    progress,
    loading,
    error,
    reviewCard,
    getDueCards,
  } = useFlashcards(session?.user?.id ?? '', tutor as string);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Flashcards</Text>
        <Text style={styles.subtitle}>
          Review and reinforce your knowledge
        </Text>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {loading ? (
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      ) : (
        <View style={styles.decksContainer}>
          {decks.map((deck) => {
            const dueCards = getDueCards(deck.id);
            if (dueCards.length === 0) return null;

            return (
              <View key={deck.id} style={styles.deckSection}>
                <FlashcardDeck
                  title={deck.title}
                  cards={dueCards.map(card => ({
                    id: card.id,
                    front: card.front_content,
                    back: card.back_content,
                    hints: card.hints,
                  }))}
                  onCardReview={(cardId, rating, correct) =>
                    reviewCard(cardId, rating, correct)
                  }
                />
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  header: {
    padding: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  decksContainer: {
    padding: 20,
    paddingTop: 0,
  },
  deckSection: {
    marginBottom: 32,
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
  },
});