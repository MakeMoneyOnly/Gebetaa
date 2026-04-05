/**
 * Tests for useStaff hook
 * HIGH-008: Add tests for critical hooks
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Create mock fetch function at module scope with a default implementation
// that returns a valid Response to prevent "Cannot read properties of undefined" errors
const mockFetch = vi.fn(() =>
    Promise.resolve(
        new Response(JSON.stringify({ data: { staff: [] } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    )
);

// Stub global fetch before any imports that use it
vi.stubGlobal('fetch', mockFetch);

// Dynamic import to ensure mock is set up first
const { useStaff } = await import('../useStaff');

describe('useStaff', () => {
    beforeEach(() => {
        // Clear call counts but keep a default implementation
        mockFetch.mockClear();
        // Set default implementation that returns empty staff
        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );
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

        // Override default mock for this specific test - use mockImplementation for precedence
        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: mockStaff } }), {
                    status: 200,
                    statusText: 'OK',
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.staff).toHaveLength(2);
        expect(result.current.staff[0].role).toBe('admin');
        expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Server error' }), {
                status: 500,
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Server error');
        expect(result.current.staff).toHaveLength(0);
    });

    it('should handle invite creation', async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { invite_url: 'https://example.com/invite/abc123' } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

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
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Invite failed' }), {
                status: 400,
                statusText: 'Bad Request',
                headers: { 'Content-Type': 'application/json' },
            })
        );

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
            created_at: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 'staff-1', is_active: false } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

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
