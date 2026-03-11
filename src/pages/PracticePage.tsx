/**
 * PracticePage.tsx
 *
 * This file contains the main practice interface for the application.
 * It handles the display of flashcards, user interaction (swiping, grading),
 * and manages the flow of the practice session.
 */

import { t } from 'i18next';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import ArrowRightIcon from '../components/icons/ArrowRightIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import PlusIcon from '../components/icons/PlusIcon';
import SettingsIcon from '../components/icons/SettingsIcon';
import CategoryFilter from '../components/CategoryFilter';
import PracticeEmptyState from '../components/PracticeEmptyState';
import PracticeControls from '../components/PracticeControls';
import PhraseCard from '../components/PhraseCard';
import PhraseCardSkeleton from '../components/PhraseCardSkeleton';
import PracticePageContextMenu from '../components/PracticePageContextMenu';
import { useLanguage } from '../contexts/languageContext.tsx';
import { speak } from '../services/speechService.ts';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { AnimationDirection, AnimationState, Category, Phrase, PhraseCategory, PracticeReviewAction, WordAnalysis } from '../types.ts';

const SWIPE_THRESHOLD = 50; // pixels

/**
 * Props for the PracticePage component.
 * Includes data for the current phrase, callbacks for user actions,
 * and settings for the practice session.
 */
interface PracticePageProps {
  currentPhrase: Phrase | null;
  setCurrentPhrase: React.Dispatch<React.SetStateAction<Phrase | null>>;
  isAnswerRevealed: boolean;
  onSetIsAnswerRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  error: string | null;
  onUpdateMastery: (action: PracticeReviewAction) => Promise<boolean>;
  onOpenChat: (phrase: Phrase) => void;
  onOpenDeepDive: (phrase: Phrase) => void;
  onOpenMovieExamples: (phrase: Phrase) => void;
  onOpenWordAnalysis: (phrase: Phrase, word: string) => void;
  onGetWordTranslation: (
    nativePhrase: string,
    learningPhrase: string,
    nativeWord: string
  ) => Promise<{ learningTranslation: string }>;
  onOpenVerbConjugation: (infinitive: string) => void;
  onOpenNounDeclension: (noun: string, article: string) => void;
  onOpenAdjectiveDeclension: (adjective: string) => void;
  onOpenSentenceChain: (phrase: Phrase) => void;
  onOpenImprovePhrase: (phrase: Phrase) => void;
  onOpenLearningAssistant: (phrase: Phrase) => void;
  onOpenVoiceWorkspace: (phrase: Phrase) => void;
  onDeletePhrase: (phraseId: string) => void;
  onGoToList: (phrase: Phrase) => void;
  onOpenDiscussTranslation: (phrase: Phrase) => void;
  settings: {
    soundEffects: boolean;
    autoSpeak: boolean;
    enabledCategories: Record<PhraseCategory, boolean>;
  };
  allPhrases: Phrase[];
  onCreateCard: (phraseData: { learning: string; native: string }) => void;
  onAnalyzeWord: (phrase: Phrase, word: string) => Promise<WordAnalysis | null>;
  isWordAnalysisLoading: boolean;
  cardActionUsage: { [key: string]: number };
  onLogCardActionUsage: (button: string) => void;
  practiceCategoryFilter: 'all' | PhraseCategory;
  setPracticeCategoryFilter: (filter: 'all' | PhraseCategory) => void;
  onMarkPhraseAsSeen: (phraseId: string) => void;
  categories: Category[];
  onAddCategory: () => void;
  onOpenCategoryManager: () => void;
  unmasteredCountsByCategory: Record<string, number>;
}

/**
 * The main Practice Page component.
 * Orchestrates the flashcard practice experience.
 */
const PracticePage: React.FC<PracticePageProps> = (props) => {
  const {
    currentPhrase,
    setCurrentPhrase,
    isAnswerRevealed,
    onSetIsAnswerRevealed,
    isLoading,
    error,
    onUpdateMastery,
    onOpenChat,
    onOpenDeepDive,
    onOpenMovieExamples,
    onOpenWordAnalysis,
    onGetWordTranslation,
    onOpenVerbConjugation,
    onOpenNounDeclension,
    onOpenAdjectiveDeclension,
    onOpenSentenceChain,
    onOpenImprovePhrase,
    onOpenLearningAssistant,
    onOpenVoiceWorkspace,
    onDeletePhrase,
    onGoToList,
    onOpenDiscussTranslation,
    settings,
    allPhrases,
    onCreateCard,
    onAnalyzeWord,
    isWordAnalysisLoading,
    cardActionUsage,
    onLogCardActionUsage,
    practiceCategoryFilter,
    setPracticeCategoryFilter,
    onMarkPhraseAsSeen,
    categories,
    onAddCategory,
    onOpenCategoryManager,
    unmasteredCountsByCategory,
  } = props;

  const [animationState, setAnimationState] = useState<AnimationState>({ key: '', direction: 'right' });
  const [isExiting, setIsExiting] = useState(false);
  const unmasteredCount = useMemo(() => allPhrases.length, [allPhrases]);
  const { profile } = useLanguage();

  const {
    practicePhrases,
    practiceStartUp,
    cardHistory,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    selectNewPhrase,
    handleSwipeRight,
  } = usePracticeSession({
    currentPhrase,
    setCurrentPhrase,
    allPhrases,
    practiceCategoryFilter,
    onMarkPhraseAsSeen,
    setAnimationState,
    isExiting,
  });

  // State for the context menu (long press or specific action)
  const [contextMenuTarget, setContextMenuTarget] = useState<{ phrase: Phrase; word?: string } | null>(null);
  // State for visual feedback (e.g., green flash on correct answer)
  const [flashState, setFlashState] = useState<'green' | null>(null);

  /**
   * Handles the "Know" button click.
   * Updates mastery, shows visual feedback, and proceeds to the next card.
   * Checks if a "leech" modal was shown to avoid conflicting transitions.
   */
  const handleKnowClick = async () => {
    if (isExiting || !currentPhrase) return;

    setFlashState('green');
    const leechModalShown = await onUpdateMastery('know');

    // If leech modal was shown, it handles the transition.
    // Otherwise, proceed to next card.
    if (!leechModalShown) {
      selectNewPhrase(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check if any modal is open by looking for a modal backdrop
      const isModalOpen = !!document.querySelector('.fixed.inset-0.bg-black\\/60, .fixed.inset-0.bg-black\\/70');
      if (isModalOpen) return;

      if (currentPhrase && !isExiting) {
        if (e.key === 'ArrowRight') {
          selectNewPhrase(false);
        } else if (e.key === 'ArrowLeft') {
          handleSwipeRight();
        } else if (e.key === ' ') {
          // Space bar to flip
          e.preventDefault();
          if (!isAnswerRevealed) {
            onSetIsAnswerRevealed(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPhrase, isAnswerRevealed, isExiting, handleSwipeRight, selectNewPhrase, onSetIsAnswerRevealed]);

  /**
   * Renders the main content of the practice page based on the current state.
   * Handles loading, error, empty states (completed all, completed category, etc.),
   * and the active flashcard view.
   */
  const renderContent = () => {
    if (isLoading) return <PhraseCardSkeleton />;

    console.log("renderContent", currentPhrase);
    if (practiceStartUp === false && practicePhrases.length === 0) {
      // This case means there are cards in the pool, but none are due for review right now.
      return <PracticeEmptyState onResetFilter={setPracticeCategoryFilter} />;
    }

    const animationClass = isExiting
      ? animationState.direction === 'right'
        ? 'card-exit-left'
        : 'card-exit-right'
      : animationState.direction === 'right'
        ? 'card-enter-right'
        : 'card-enter-left';

    if (currentPhrase) return (
      <div className="relative w-full max-w-2xl flex items-center justify-center">
        {currentPhrase && (
          <>
            <button
              onClick={handleSwipeRight}
              disabled={cardHistory.length === 0}
              className="hidden md:flex absolute top-1/2- left-0 -translate-y-1/2 w-12 h-12 bg-slate-800/50 hover:bg-slate-700/80 rounded-full items-center justify-center transition-colors text-slate-300 hover:text-white z-10 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Предыдущая карта"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => selectNewPhrase(false)}
              disabled={unmasteredCount <= 1}
              className="hidden md:flex absolute top-1/2- right-0 -translate-y-1/2 w-12 h-12 bg-slate-800/50 hover:bg-slate-700/80 rounded-full items-center justify-center transition-colors text-slate-300 hover:text-white z-10 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Следующая карта"
            >
              <ArrowRightIcon className="w-6 h-6" />
            </button>
          </>
        )}
        <div className="flex flex-col items-center w-full px-2">
          <div
            id="practice-card-container"
            className="w-full max-w-md h-64 relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div key={animationState.key} className={`absolute inset-0 ${animationClass}`}>
              <PhraseCard
                phrase={currentPhrase}
                isFlipped={isAnswerRevealed}
                onFlip={() => {
                  speak(isAnswerRevealed ? currentPhrase.text.native : currentPhrase.text.learning, {
                    lang: isAnswerRevealed ? profile.native : profile.learning,
                  });
                  onSetIsAnswerRevealed(!isAnswerRevealed);
                }}
                onSpeak={(text, options) => speak(text, options)}
                onOpenChat={onOpenChat}
                onOpenDeepDive={onOpenDeepDive}
                onOpenMovieExamples={onOpenMovieExamples}
                onWordClick={onOpenWordAnalysis}
                onGetWordTranslation={onGetWordTranslation}
                onOpenSentenceChain={onOpenSentenceChain}
                onOpenImprovePhrase={onOpenImprovePhrase}
                onOpenContextMenu={setContextMenuTarget}
                onOpenVoicePractice={onOpenVoiceWorkspace}
                onOpenLearningAssistant={onOpenLearningAssistant}
                isWordAnalysisLoading={isWordAnalysisLoading}
                cardActionUsage={cardActionUsage}
                onLogCardActionUsage={onLogCardActionUsage}
                flash={flashState}
                onFlashEnd={() => setFlashState(null)}
              />
            </div>
          </div>

          <PracticeControls
            onSkip={() => selectNewPhrase(false)}
            onKnow={handleKnowClick}
            isExiting={isExiting}
          />
        </div>
      </div>
    );
    return null
  };

  return (
    <>
      <CategoryFilter
        currentFilter={practiceCategoryFilter}
        onFilterChange={setPracticeCategoryFilter}
        enabledCategories={settings.enabledCategories}
        currentPhraseCategory={currentPhrase?.category || null}
        categories={categories}
        onAddCategory={onAddCategory}
        onManageCategories={onOpenCategoryManager}
        counts={unmasteredCountsByCategory}
        totalUnmastered={unmasteredCount}
      />
      {renderContent()}
      {contextMenuTarget && (
        <PracticePageContextMenu
          target={contextMenuTarget}
          onClose={() => setContextMenuTarget(null)}
          onDelete={onDeletePhrase}
          onGoToList={onGoToList}
          onDiscuss={onOpenDiscussTranslation}
          onCreateCard={onCreateCard}
          onAnalyzeWord={onAnalyzeWord}
          onOpenWordAnalysis={onOpenWordAnalysis}
          onOpenVerbConjugation={onOpenVerbConjugation}
          onOpenNounDeclension={onOpenNounDeclension}
          onOpenAdjectiveDeclension={onOpenAdjectiveDeclension}
        />
      )}
      {error && (
        <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-md mx-auto">
          <p className="font-semibold">{t('practice.states.errorOccurred')}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
};

export default PracticePage;
