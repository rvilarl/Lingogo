import { t } from 'i18next';
import React from 'react';

import type { PhraseCategory } from '../types.ts';

interface PracticeEmptyStateProps {
  onResetFilter: (filter: 'all' | PhraseCategory) => void;
}

const PracticeEmptyState: React.FC<PracticeEmptyStateProps> = ({ onResetFilter }) => {
  return (
    <div className="text-center text-slate-400 p-4">
      <h2 className="text-2xl font-bold text-white mb-4">{t('practice.states.allForToday')}</h2>
      <p>{t('practice.states.completedAllAvailable')}</p>
      <p className="mt-2 text-sm">{t('practice.states.comeBackLater')}</p>
      <button
        onClick={() => onResetFilter('all')}
        className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-bold transition-colors"
      >
        {t('practice.states.practiceOtherCategories')}
      </button>
    </div>
  );
};

export default PracticeEmptyState;
