import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FlashcardDeck {
  id: string;
  tutor_id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  unlock_requirements: any;
}

interface Flashcard {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  hints: string[];
  tags: string[];
}

interface UserFlashcard {
  id: string;
  flashcard_id: string;
  last_reviewed_at: string;
  next_review_at: string;
  difficulty_rating: number;
  times_reviewed: number;
  times_correct: number;
}

export function useFlashcards(userId: string, tutorId?: string) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Record<string, Flashcard[]>>({});
  const [progress, setProgress] = useState<Record<string, UserFlashcard>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchDecks();
    }
  }, [userId, tutorId]);

  const fetchDecks = async () => {
    try {
      // Fetch flashcard decks
      const { data: decksData, error: decksError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('created_at');

      if (decksError) throw decksError;

      // Fetch flashcards for each deck
      const cardPromises = decksData.map(deck =>
        supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', deck.id)
      );

      const cardResults = await Promise.all(cardPromises);
      const cardsByDeck = cardResults.reduce((acc, result, index) => {
        if (result.error) throw result.error;
        acc[decksData[index].id] = result.data;
        return acc;
      }, {} as Record<string, Flashcard[]>);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', userId)
        .in(
          'flashcard_id',
          Object.values(cardsByDeck)
            .flat()
            .map(card => card.id)
        );

      if (progressError) throw progressError;

      const progressByCard = progressData.reduce((acc, progress) => {
        acc[progress.flashcard_id] = progress;
        return acc;
      }, {} as Record<string, UserFlashcard>);

      setDecks(decksData);
      setCards(cardsByDeck);
      setProgress(progressByCard);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  };

  const reviewCard = async (
    flashcardId: string,
    difficultyRating: number,
    wasCorrect: boolean
  ) => {
    try {
      const { error: reviewError } = await supabase.rpc('update_flashcard_schedule', {
        p_user_id: userId,
        p_flashcard_id: flashcardId,
        p_difficulty_rating: difficultyRating,
        p_was_correct: wasCorrect,
      });

      if (reviewError) throw reviewError;
      await fetchDecks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update flashcard progress');
    }
  };

  const getDueCards = (deckId: string) => {
    const now = new Date();
    return (cards[deckId] || []).filter(card => {
      const cardProgress = progress[card.id];
      if (!cardProgress) return true; // New card
      return new Date(cardProgress.next_review_at) <= now;
    });
  };

  return {
    decks,
    cards,
    progress,
    loading,
    error,
    reviewCard,
    getDueCards,
  };
}