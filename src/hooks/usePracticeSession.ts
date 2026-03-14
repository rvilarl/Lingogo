import React, { useEffect, useRef, useState } from 'react';
import type { AnimationState, Phrase, PhraseCategory } from '../types.ts';

const SWIPE_THRESHOLD = 50; // pixels

/**
 * Properties required to initialize the practice session hook.
 */
interface UsePracticeSessionProps {
  /** The phrase currently being shown to the user */
  currentPhrase: Phrase | null;
  /** State setter for updating the current phrase */
  setCurrentPhrase: React.Dispatch<React.SetStateAction<Phrase | null>>;
  /** Array of all phrases available for practice */
  allPhrases: Phrase[];
  /** Filter to apply, either 'all' or a specific category */
  practiceCategoryFilter: 'all' | PhraseCategory;
  /** Callback executed when a phrase that was previously marked as "new" is seen */
  onMarkPhraseAsSeen: (phraseId: string) => void;
  /** Updates the swipe animation direction and key for the flashcard */
  setAnimationState: React.Dispatch<React.SetStateAction<AnimationState>>;
  /** Flag indicating if the user is exiting the practice session */
  isExiting: boolean;
}

/**
 * Custom hook to manage the state and logic of a practice session flashcard UI.
 * Handles maintaining a pool of new phrases, a set of currently practicing phrases,
 * card navigation history, and touch swipe gestures.
 * 
 * @param props - Hook configuration and dependencies
 * @returns Session state variables and handler functions
 */
export const usePracticeSession = ({
  currentPhrase,
  setCurrentPhrase,
  allPhrases,
  practiceCategoryFilter,
  onMarkPhraseAsSeen,
  setAnimationState,
  isExiting,
}: UsePracticeSessionProps) => {
  const [poolPhrases, setPoolPhrases] = useState<Phrase[]>([]);
  const [practicePhrases, setPracticePhrases] = useState<Phrase[]>([]);
  const [cardHistory, setCardHistory] = useState<string[]>([]);
  const [practiceStartUp, setPracticeStartUp] = useState(true);

  // Refs for handling touch gestures (swiping)
  const touchStartRef = useRef<number | null>(null);
  const touchMoveRef = useRef<number | null>(null);

  // Effect to mark a new phrase as seen when it appears
  useEffect(() => {
    if (currentPhrase && currentPhrase.isNew) {
      onMarkPhraseAsSeen(currentPhrase.id);
    }
  }, [currentPhrase, onMarkPhraseAsSeen]);

  useEffect(() => {
    setPracticeStartUp(true);
    setPracticePhrases([]);
    setPoolPhrases(
      practiceCategoryFilter === 'all'
        ? allPhrases
        : allPhrases.filter((p) => p.category === practiceCategoryFilter)
    );
  }, [practiceCategoryFilter]);

  /** Records the initial X coordinate when a touch starts */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchMoveRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  /** Updates the current X coordinate as the touch moves */
  const handleTouchMove = (e: React.TouchEvent) => {
    touchMoveRef.current = e.targetTouches[0].clientX;
  };

  /** 
   * Calculates the swipe distance when a touch ends.
   * Triggers a left swipe logic (unknown phrase) if deltaX < -SWIPE_THRESHOLD.
   * Triggers a right swipe logic (previous/known) if deltaX > SWIPE_THRESHOLD.
   */
  const handleTouchEnd = () => {
    if (touchStartRef.current !== null && touchMoveRef.current !== null) {
      const deltaX = touchMoveRef.current - touchStartRef.current;
      if (deltaX < -SWIPE_THRESHOLD) selectNewPhrase(false);
      else if (deltaX > SWIPE_THRESHOLD) handleSwipeRight();
    }
    touchStartRef.current = null;
    touchMoveRef.current = null;
  };

  /**
   * Advances to the next phrase in the session based on whether the current phrase
   * is marked as known. Manages the logic mapping pool and practice array sizes.
   *
   * @param knownPhrase - True if the user indicated they know the current phrase
   */
  const selectNewPhrase = (knownPhrase: boolean) => {
    if (currentPhrase) {
      setCardHistory((prev) => [...prev, currentPhrase.id]);
    }

    if (practiceStartUp && !knownPhrase) {
      if (currentPhrase) {
        setPracticePhrases((prev) => [...prev, currentPhrase]);
      }
      if (practicePhrases.length >= 10 || poolPhrases.length === 0) {
        setPracticeStartUp(false);
      }
    }
    if (knownPhrase && currentPhrase) {
      setPracticePhrases((prev) => prev.filter((phrase) => phrase.id !== currentPhrase.id));
    }

    const phrases = practiceStartUp ? poolPhrases : practicePhrases;
    const nextPhrase =
      phrases.length > 0 ? phrases[Math.floor(Math.random() * phrases.length)] : null;

    if (nextPhrase) {
      setAnimationState({ key: nextPhrase.id, direction: 'right' });
      setPoolPhrases((prev) => prev.filter((phrase) => phrase.id !== nextPhrase.id));
    }
    setCurrentPhrase(nextPhrase);
  };

  /**
   * Returns to the previous phrase in the user's history when swiping right.
   * Pops the last viewed phrase ID from the history stack and displays it.
   */
  const handleSwipeRight = () => {
    if (isExiting || cardHistory.length === 0) return;

    const lastPhraseId = cardHistory[cardHistory.length - 1];
    const prevPhrase = allPhrases.find((p) => p.id === lastPhraseId);

    if (prevPhrase) {
      setCardHistory((prev) => prev.slice(0, -1));
      setAnimationState({ key: prevPhrase.id, direction: 'left' });
      setCurrentPhrase(prevPhrase);
    }
  };

  return {
    practicePhrases,
    practiceStartUp,
    cardHistory,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    selectNewPhrase,
    handleSwipeRight,
  };
};
