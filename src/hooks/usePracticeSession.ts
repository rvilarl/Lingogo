import React, { useEffect, useRef, useState } from 'react';
import type { AnimationState, Phrase, PhraseCategory } from '../types.ts';

const SWIPE_THRESHOLD = 50; // pixels

interface UsePracticeSessionProps {
  currentPhrase: Phrase | null;
  setCurrentPhrase: React.Dispatch<React.SetStateAction<Phrase | null>>;
  allPhrases: Phrase[];
  practiceCategoryFilter: 'all' | PhraseCategory;
  onMarkPhraseAsSeen: (phraseId: string) => void;
  setAnimationState: React.Dispatch<React.SetStateAction<AnimationState>>;
  isExiting: boolean;
}

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchMoveRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchMoveRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current !== null && touchMoveRef.current !== null) {
      const deltaX = touchMoveRef.current - touchStartRef.current;
      if (deltaX < -SWIPE_THRESHOLD) selectNewPhrase(false);
      else if (deltaX > SWIPE_THRESHOLD) handleSwipeRight();
    }
    touchStartRef.current = null;
    touchMoveRef.current = null;
  };

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
