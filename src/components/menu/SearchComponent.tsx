'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    value: string;
    onChange: (value: string) => void;
    section: 'food' | 'drinks';
}

const placeholders: Record<string, string[]> = {
    'food': [
        "Cheese Burger",
        "Peperoni Pizza",
        "Crispy Sandwich",
        "French Fries",
        "Shekla Tibs",
        "Doro Wot"
    ],
    'drinks': [
        "Macchiato",
        "Coffee",
        "Special Tea",
        "Coca Cola",
        "Mango Juice",
        "Cold Beer"
    ]
};

/**
 * SearchComponent - Clean, functional search input with animated placeholders
 */
export function SearchComponent({ value, onChange, section }: Props) {
    const { language } = useLanguage();
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const currentPlaceholders = placeholders[section] || placeholders['food'];

    useEffect(() => {
        setPlaceholderIndex(0);
    }, [section]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [currentPlaceholders]);

    const currentPlaceholder = currentPlaceholders[placeholderIndex];

    return (
        <div className="relative">
            {/* Input */}
            <div className="relative w-full">
                {/* Search Icon */}
                <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ color: isFocused ? 'var(--brand-color)' : 'var(--text-4)' }}
                >
                    <Search className="w-5 h-5" />
                </div>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="input"
                    style={{
                        paddingLeft: '52px', // Icon (16px left + 20px width + 16px spacing)
                        paddingRight: value ? '48px' : '16px', // Space for clear button when value exists
                        borderColor: isFocused ? 'var(--brand-color)' : 'var(--border-1)',
                        transition: 'border-color 150ms ease',
                        background: 'var(--surface-2)',
                        height: '56px', // Taller touch target
                        width: '100%'
                    }}
                />

                {/* Animated Placeholder */}
                {!value && (
                    <div
                        className="absolute top-0 bottom-0 flex items-center pointer-events-none overflow-hidden"
                        style={{ 
                            left: '52px', // Match input paddingLeft
                            color: 'var(--text-4)'
                        }}
                    >
                        <span className="text-sm font-medium mr-1.5">
                            {language === 'am' ? 'ይፈልጉ' : 'Search for'}
                        </span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={`${section}-${placeholderIndex}`}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="whitespace-nowrap text-sm font-bold"
                                style={{ color: 'var(--brand-color)' }}
                            >
                                {language === 'am'
                                    ? (section === 'food' ? 'ምግብ...' : 'መጠጥ...')
                                    : currentPlaceholder}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                )}

                {/* Clear Button */}
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full z-10"
                        style={{
                            background: 'var(--surface-3)',
                            color: 'var(--text-3)'
                        }}
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
