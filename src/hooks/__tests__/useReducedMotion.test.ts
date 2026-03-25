/**
 * Tests for useReducedMotion hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReducedMotion, getReducedMotionPreference } from '../useReducedMotion';

describe('useReducedMotion', () => {
    // Store original matchMedia
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        // Clear any mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: originalMatchMedia,
        });
    });

    it('should return false when user does not prefer reduced motion', () => {
        // Mock matchMedia to return false
        const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
        // Mock matchMedia to return true
        const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(true);
    });

    it('should update when preference changes', () => {
        const listeners: Array<(event: MediaQueryListEvent) => void> = [];

        const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(
                (_event: string, listener: (event: MediaQueryListEvent) => void) => {
                    listeners.push(listener);
                }
            ),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        const { result } = renderHook(() => useReducedMotion());

        // Initially false
        expect(result.current).toBe(false);

        // Simulate preference change
        act(() => {
            listeners.forEach(listener => {
                listener({ matches: true } as MediaQueryListEvent);
            });
        });

        // Should now be true
        expect(result.current).toBe(true);
    });

    it('should use fallback addListener for older browsers', () => {
        const addListenerMocks: Array<(listener: () => void) => void> = [];

        const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            // Older browser API
            addListener: vi.fn((listener: () => void) => {
                addListenerMocks.push(listener);
            }),
            removeListener: vi.fn(),
            // No addEventListener
            dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        // Should not throw
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);
    });
});

describe('getReducedMotionPreference', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: originalMatchMedia,
        });
    });

    it('should return false when user does not prefer reduced motion', () => {
        const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        expect(getReducedMotionPreference()).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
        const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        expect(getReducedMotionPreference()).toBe(true);
    });
});
