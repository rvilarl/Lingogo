import { t } from 'i18next';
import React from 'react';

interface PracticeControlsProps {
  onSkip: () => void;
  onKnow: () => void;
  isExiting: boolean;
}

const PracticeControls: React.FC<PracticeControlsProps> = ({ onSkip, onKnow, isExiting }) => {
  return (
    <div className="flex justify-center items-center mt-3 h-12 max-w-md w-full">
      <div className="flex items-center justify-center space-x-4 animate-fade-in w-full">
        <button
          onClick={onSkip}
          disabled={isExiting}
          className="flex-grow p-2 rounded-3xl font-light text-sm text-slate-300 shadow-md transition-colors bg-purple-600 hover:bg-purple-700"
        >
          {t('practice.actions.skip')}
        </button>
        <button
          onClick={onKnow}
          disabled={isExiting}
          className="flex-grow p-2 rounded-3xl font-light text-sm text-white shadow-md transition-colors bg-green-600 hover:bg-green-700"
        >
          {t('practice.actions.know')}
        </button>
      </div>
    </div>
  );
};

export default PracticeControls;
