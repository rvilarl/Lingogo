import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import ChevronDownIcon from './icons/ChevronDownIcon';
import PlusIcon from './icons/PlusIcon';
import SettingsIcon from './icons/SettingsIcon';
import type { Category, PhraseCategory } from '../types.ts';

/**
 * Component for filtering phrases by category.
 * Allows users to switch between practicing all categories or a specific one.
 */
interface CategoryFilterProps {
  currentFilter: 'all' | PhraseCategory;
  onFilterChange: (filter: 'all' | PhraseCategory) => void;
  enabledCategories: Record<PhraseCategory, boolean>;
  currentPhraseCategory: PhraseCategory | null;
  categories: Category[];
  onAddCategory: () => void;
  onManageCategories: () => void;
  counts: Record<string, number>;
  totalUnmastered: number;
}

const CategoryFilter: React.FC<CategoryFilterProps> = (props) => {
  const {
    currentFilter,
    onFilterChange,
    enabledCategories,
    currentPhraseCategory,
    categories,
    onAddCategory,
    onManageCategories,
    counts,
    totalUnmastered,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCategoryNameById = (id: string) => categories.find((c) => c.id === id)?.name || id;

  const categoryName =
    currentFilter === 'all' ? t('practice.states.allCategories') : getCategoryNameById(currentFilter);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (filter: 'all' | PhraseCategory) => {
    onFilterChange(filter);
    setIsOpen(false);
  };

  const handleAddCategory = () => {
    onAddCategory();
    setIsOpen(false);
  };

  const handleManageCategories = () => {
    onManageCategories();
    setIsOpen(false);
  };

  const visibleCategories = categories.filter((cat) => enabledCategories[cat.id]);

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm mx-auto mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center px-4 py-2 bg-transparent hover:bg-slate-700/80 rounded-lg text-slate-300 transition-colors"
      >
        <span className="font-semibold mr-2">
          {currentFilter === 'all' && currentPhraseCategory ? getCategoryNameById(currentPhraseCategory) : categoryName}
        </span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-20 animate-fade-in flex flex-col">
          <ul className="p-1 max-h-60 overflow-y-auto hide-scrollbar">
            <li>
              <button
                onClick={() => handleSelect('all')}
                className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-600 rounded-md transition-colors flex justify-between items-center"
              >
                <span>{t('practice.states.allCategories')}</span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded-full">
                  {totalUnmastered}
                </span>
              </button>
            </li>
            {visibleCategories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleSelect(cat.id)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-600 rounded-md transition-colors flex justify-between items-center"
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {counts[cat.id] || 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-1 border-t border-slate-600 flex-shrink-0 grid grid-cols-2 gap-1">
            <button
              onClick={handleAddCategory}
              className="flex items-center justify-center gap-2 px-2 py-2 text-slate-300 hover:bg-slate-600 rounded-md transition-colors text-sm font-semibold"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{t('practice.states.add')}</span>
            </button>
            <button
              onClick={handleManageCategories}
              className="flex items-center justify-center gap-2 px-2 py-2 text-slate-300 hover:bg-slate-600 rounded-md transition-colors text-sm font-semibold"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>{t('practice.states.manage')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
