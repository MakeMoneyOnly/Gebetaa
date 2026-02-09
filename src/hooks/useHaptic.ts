'use client';

import { useCallback } from 'react';

type HapticPattern = 'soft' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptic() {
    const trigger = useCallback((pattern: HapticPattern = 'medium') => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            switch (pattern) {
                case 'soft':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(20);
                    break;
                case 'heavy':
                    navigator.vibrate(40);
                    break;
                case 'success':
                    navigator.vibrate([10, 30, 10]);
                    break;
                case 'warning':
                    navigator.vibrate([30, 50, 10]);
                    break;
                case 'error':
                    navigator.vibrate([50, 100, 50, 100]);
                    break;
                default:
                    navigator.vibrate(20);
            }
        }
    }, []);

    return { trigger };
}
