/**
 * Tests for useStaff hook
 * HIGH-008: Add tests for critical hooks
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStaff } from '../useStaff';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useStaff', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch staff list on mount', async () => {
        const mockStaff = [
            {
                id: 'staff-1',
                user_id: 'user-1',
                role: 'admin',
                is_active: true,
                name: 'John Doe',
                email: 'john@example.com',
            },
            {
                id: 'staff-2',
                user_id: 'user-2',
                role: 'waiter',
                is_active: true,
                name: 'Jane Smith',
                email: 'jane@example.com',
            },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: { staff: mockStaff },
                }),
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.staff).toHaveLength(2);
        expect(result.current.staff[0].role).toBe('admin');
        expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Server error' }),
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Server error');
        expect(result.current.staff).toHaveLength(0);
    });

    it('should handle invite creation', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: { staff: [] },
                }),
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: { invite_url: 'https://example.com/invite/abc123' },
                }),
        });

        let inviteResult: boolean;
        await act(async () => {
            inviteResult = await result.current.handleInvite({
                email: 'new@example.com',
                role: 'waiter',
            });
        });

        expect(inviteResult!).toBe(true);
        expect(result.current.inviteUrl).toBe('https://example.com/invite/abc123');
    });

    it('should handle invite error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: { staff: [] },
                }),
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Invite failed' }),
        });

        let inviteResult: boolean;
        await act(async () => {
            inviteResult = await result.current.handleInvite({
                email: 'new@example.com',
                role: 'waiter',
            });
        });

        expect(inviteResult!).toBe(false);
    });

    it('should toggle staff active status', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: { staff: [mockStaffMember] },
                }),
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        id: 'staff-1',
                        is_active: false,
                    },
                }),
        });

        await act(async () => {
            await result.current.handleActiveToggle(mockStaffMember);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/staff/staff-1/active', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false }),
        });
    });

    it('should have correct initial state', () => {
        mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

        const { result } = renderHook(() => useStaff());

        expect(result.current.staff).toHaveLength(0);
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.inviteUrl).toBeNull();
        expect(result.current.inviteLoading).toBe(false);
    });
});
