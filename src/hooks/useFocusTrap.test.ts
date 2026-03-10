/**
 * Tests for useFocusTrap hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    it('should initialize with inactive state by default', () => {
        const { result } = renderHook(() => useFocusTrap());

        expect(result.current.isActive).toBe(false);
    });

    it('should initialize with active state when active option is true', () => {
        const { result } = renderHook(() => useFocusTrap({ active: true }));

        expect(result.current.isActive).toBe(true);
    });

    it('should activate and deactivate the focus trap', () => {
        const { result } = renderHook(() => useFocusTrap());

        expect(result.current.isActive).toBe(false);

        act(() => {
            result.current.activate();
        });

        expect(result.current.isActive).toBe(true);

        act(() => {
            result.current.deactivate();
        });

        expect(result.current.isActive).toBe(false);
    });

    it('should call onActivate callback when activated', () => {
        const onActivate = vi.fn();
        const { result } = renderHook(() => useFocusTrap({ onActivate }));

        act(() => {
            result.current.activate();
        });

        expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('should call onDeactivate callback when deactivated', () => {
        const onDeactivate = vi.fn();
        const { result } = renderHook(() => useFocusTrap({ onDeactivate }));

        act(() => {
            result.current.activate();
        });

        act(() => {
            result.current.deactivate();
        });

        expect(onDeactivate).toHaveBeenCalledTimes(1);
    });

    it('should return a containerRef', () => {
        const { result } = renderHook(() => useFocusTrap());

        expect(result.current.containerRef).toBeDefined();
        expect(result.current.containerRef.current).toBeNull();
    });

    it('should handle Escape key to deactivate', () => {
        const onDeactivate = vi.fn();
        const { result } = renderHook(() => useFocusTrap({ active: true, onDeactivate }));

        act(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        // Note: The escape handler is set up in useEffect, so we need to check
        // that the hook properly handles the escape key
        expect(result.current.isActive).toBe(false);
    });
});
