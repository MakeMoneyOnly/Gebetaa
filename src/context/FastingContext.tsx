'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FastingContextType {
    isFastingMode: boolean;
    toggleFasting: () => void;
}

const FastingContext = createContext<FastingContextType | undefined>(undefined);

export function FastingProvider({ children }: { children: ReactNode }) {
    const [isFastingMode, setIsFastingMode] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('fastingMode');
        if (stored === 'true') {
            setIsFastingMode(true);
        }
    }, []);

    const toggleFasting = () => {
        setIsFastingMode(prev => {
            const newValue = !prev;
            localStorage.setItem('fastingMode', String(newValue));
            return newValue;
        });
    };

    return (
        <FastingContext.Provider value={{ isFastingMode, toggleFasting }}>
            {children}
        </FastingContext.Provider>
    );
}

export function useFasting() {
    const context = useContext(FastingContext);
    if (context === undefined) {
        throw new Error('useFasting must be used within a FastingProvider');
    }
    return context;
}
