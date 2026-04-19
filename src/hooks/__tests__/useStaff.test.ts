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
            new Response(
                JSON.stringify({ data: { invite_url: 'https://example.com/invite/abc123' } }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            )
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

    it('should handle fetch error with non-JSON response body', async () => {
        mockFetch.mockResolvedValueOnce(
            new Response('Internal Server Error', {
                status: 500,
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'text/plain' },
            })
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Error 500: Internal Server Error');
    });

    it('should handle network error with non-Error thrown', async () => {
        mockFetch.mockImplementation(() => {
            throw 'network failure';
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch staff.');
    });

    it('should handle network error with Error instance', async () => {
        mockFetch.mockImplementation(() => {
            throw new Error('Network request failed');
        });

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Network request failed');
    });

    it('should not set loading when staff already exists and fetchStaff is called', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        const staffResponse = new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

        mockFetch.mockImplementation(() => Promise.resolve(staffResponse));

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.staff).toHaveLength(1);

        await act(async () => {
            await result.current.fetchStaff();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.staff).toHaveLength(1);
    });

    it('should handle role update success', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'waiter',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 'staff-1', role: 'admin' } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let updateResult: boolean;
        await act(async () => {
            updateResult = await result.current.handleRoleUpdate('staff-1', 'admin');
        });

        expect(updateResult!).toBe(true);
        expect(result.current.staff[0].role).toBe('admin');
        expect(mockFetch).toHaveBeenCalledWith('/api/staff/staff-1/role', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'admin' }),
        });
    });

    it('should handle role update error', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'waiter',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Role update forbidden' }), {
                status: 403,
                statusText: 'Forbidden',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let updateResult: boolean;
        await act(async () => {
            updateResult = await result.current.handleRoleUpdate('staff-1', 'admin');
        });

        expect(updateResult!).toBe(false);
        expect(result.current.staff[0].role).toBe('waiter');
    });

    it('should toggle inactive staff to active (is_active=false)', async () => {
        const inactiveMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'waiter',
            is_active: false,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [inactiveMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 'staff-1', is_active: true } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        await act(async () => {
            await result.current.handleActiveToggle(inactiveMember);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/staff/staff-1/active', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: true }),
        });
        expect(result.current.staff[0].is_active).toBe(true);
    });

    it('should toggle staff with null is_active to inactive', async () => {
        const nullActiveMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'waiter',
            is_active: null,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [nullActiveMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
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
            await result.current.handleActiveToggle(nullActiveMember);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/staff/staff-1/active', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false }),
        });
        expect(result.current.staff[0].is_active).toBe(false);
    });

    it('should handle active toggle error', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Toggle failed' }), {
                status: 500,
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let toggleResult: boolean;
        await act(async () => {
            toggleResult = await result.current.handleActiveToggle(mockStaffMember);
        });

        expect(toggleResult!).toBe(false);
        expect(result.current.activeUpdatingId).toBeNull();
    });

    it('should handle add PIN staff success', async () => {
        const newPinStaff = {
            id: 'staff-new',
            user_id: 'user-new',
            role: 'kitchen',
            is_active: true,
            name: 'PIN User',
            pin_code: '1234',
        };

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
            new Response(JSON.stringify({ data: { staff: newPinStaff } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [newPinStaff] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let addResult: boolean;
        await act(async () => {
            addResult = await result.current.handleAddPinStaff({
                name: 'PIN User',
                role: 'kitchen',
                pin_code: '1234',
            });
        });

        expect(addResult!).toBe(true);
        expect(result.current.staff).toHaveLength(1);
        expect(result.current.staff[0].name).toBe('PIN User');
        expect(result.current.loading).toBe(false);
        expect(mockFetch).toHaveBeenCalledWith('/api/staff/add-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'PIN User', role: 'kitchen', pin_code: '1234' }),
        });
    });

    it('should handle add PIN staff error', async () => {
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
            new Response(JSON.stringify({ error: 'PIN code already in use' }), {
                status: 400,
                statusText: 'Bad Request',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let addResult: boolean;
        await act(async () => {
            addResult = await result.current.handleAddPinStaff({
                name: 'PIN User',
                role: 'kitchen',
                pin_code: '1234',
            });
        });

        expect(addResult!).toBe(false);
        expect(result.current.staff).toHaveLength(0);
        expect(result.current.loading).toBe(false);
    });

    it('should handle delete staff success (optimistic removal)', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.staff).toHaveLength(1);

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { success: true } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let deleteResult: boolean;
        await act(async () => {
            deleteResult = await result.current.handleDeleteStaff('staff-1');
        });

        expect(deleteResult!).toBe(true);
        await waitFor(() => {
            expect(result.current.staff).toHaveLength(0);
        });
        expect(mockFetch).toHaveBeenCalledWith('/api/staff/staff-1', {
            method: 'DELETE',
        });
    });

    it('should rollback on delete staff error', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.staff).toHaveLength(1);

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Cannot delete owner' }), {
                status: 403,
                statusText: 'Forbidden',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let deleteResult: boolean;
        await act(async () => {
            deleteResult = await result.current.handleDeleteStaff('staff-1');
        });

        expect(deleteResult!).toBe(false);
        await waitFor(() => {
            expect(result.current.staff).toHaveLength(1);
        });
    });

    it('should initialize with initialData without loading state', async () => {
        const initialStaff = [
            {
                id: 'staff-1',
                user_id: 'user-1',
                role: 'admin',
                is_active: true,
                name: 'John Doe',
            },
        ];

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: initialStaff } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff(initialStaff));

        expect(result.current.loading).toBe(false);
        expect(result.current.staff).toHaveLength(1);
        expect(result.current.staff[0].id).toBe('staff-1');
    });

    it('should handle invite exception with non-Error thrown', async () => {
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

        mockFetch.mockImplementation(() => {
            throw 'network failure';
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

    it('should handle role update exception with non-Error thrown', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'waiter',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockImplementation(() => {
            throw 'unexpected error';
        });

        let updateResult: boolean;
        await act(async () => {
            updateResult = await result.current.handleRoleUpdate('staff-1', 'admin');
        });

        expect(updateResult!).toBe(false);
    });

    it('should handle active toggle exception with non-Error thrown', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockImplementation(() => {
            throw 'unexpected error';
        });

        let toggleResult: boolean;
        await act(async () => {
            toggleResult = await result.current.handleActiveToggle(mockStaffMember);
        });

        expect(toggleResult!).toBe(false);
        expect(result.current.activeUpdatingId).toBeNull();
    });

    it('should handle add PIN staff exception with non-Error thrown', async () => {
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

        mockFetch.mockImplementation(() => {
            throw 'unexpected error';
        });

        let addResult: boolean;
        await act(async () => {
            addResult = await result.current.handleAddPinStaff({
                name: 'PIN User',
                role: 'kitchen',
                pin_code: '1234',
            });
        });

        expect(addResult!).toBe(false);
    });

    it('should handle delete staff exception with non-Error thrown and rollback', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Delete failed unexpectedly' }), {
                status: 500,
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        let deleteResult: boolean;
        await act(async () => {
            deleteResult = await result.current.handleDeleteStaff('staff-1');
        });

        expect(deleteResult!).toBe(false);
    });

    it('should set activeUpdatingId during toggle and clear after', async () => {
        const mockStaffMember = {
            id: 'staff-1',
            user_id: 'user-1',
            role: 'admin',
            is_active: true,
            name: 'John Doe',
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ data: { staff: [mockStaffMember] } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        const { result } = renderHook(() => useStaff());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.activeUpdatingId).toBeNull();

        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 'staff-1', is_active: false } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        await act(async () => {
            await result.current.handleActiveToggle(mockStaffMember);
        });

        expect(result.current.activeUpdatingId).toBeNull();
    });
});
