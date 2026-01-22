'use client';

import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';

interface Props {
    categories: Array<{ id: string; label: string; labelAm: string }>;
    selectedCategory: string | null;
    onSelectCategory: (id: string | null) => void;
}

/**
 * CategoryTabs - Horizontal scrolling category filter chips
 * 
 * Design principles:
 * - Touch-friendly chip size (36px min height)
 * - Clear active/inactive states
 * - Smooth horizontal scroll
 * - Readable text (13px minimum)
 */
export function CategoryTabs({ categories, selectedCategory, onSelectCategory }: Props) {
    const { language, t } = useLanguage();

    const tabs = [
        { id: null, label: language === 'am' ? 'ሁሉም' : 'All' },
        ...categories.map(cat => ({
            id: cat.id,
            label: language === 'am' ? cat.labelAm : cat.label
        }))
    ];

    return (
        <div className="px-4">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {tabs.map((tab) => {
                    const isActive = selectedCategory === tab.id;
                    
                    return (
                        <button
                            key={tab.id || 'all'}
                            onClick={() => onSelectCategory(tab.id as string | null)}
                            className="chip"
                            data-active={isActive}
                            style={{
                                background: isActive ? 'var(--brand-color)' : 'var(--surface-3)',
                                color: isActive ? '#000' : 'var(--text-2)',
                                borderColor: isActive ? 'var(--brand-color)' : 'var(--border-1)'
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
