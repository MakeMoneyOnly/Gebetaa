import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';

export type StaffMember = {
    id: string;
    user_id: string;
    role: string;
    is_active: boolean | null;
    created_at: string | null;
    name?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    pin_code?: string | null;
    assigned_zones?: string[];
};

export const ROLE_BADGE: Record<string, string> = {
    owner: 'bg-purple-50 text-purple-600',
    admin: 'bg-indigo-50 text-indigo-600',
    manager: 'bg-blue-50 text-blue-600',
    kitchen: 'bg-orange-50 text-orange-600',
    waiter: 'bg-green-50 text-green-600',
    bar: 'bg-pink-50 text-pink-600',
};

export function useStaff() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeUpdatingId, setActiveUpdatingId] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);

    const fetchStaff = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/staff', { method: 'GET' });

            if (!response.ok) {
                let errorMessage = 'Failed to fetch staff.';
                try {
                    const errorPayload = await response.json();
                    errorMessage = errorPayload?.error ?? errorMessage;
                } catch {
                    // unexpected non-json error
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const payload = await response.json();
            setStaff((payload?.data?.staff ?? []) as StaffMember[]);
        } catch (fetchError) {
            console.error(fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch staff.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        void fetchStaff();
    }, [fetchStaff]);

    const handleInvite = async (payload: {
        email: string | null;
        role: StaffRole;
        label?: string | null;
    }) => {
        try {
            setInviteLoading(true);
            const response = await fetch('/api/staff/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to create invite.');
            }
            setInviteUrl(result?.data?.invite_url ?? null);
            toast.success('Provisioning link created.');
            return true;
        } catch (inviteError) {
            toast.error(
                inviteError instanceof Error
                    ? inviteError.message
                    : 'Failed to create provisioning link.'
            );
            return false;
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRoleUpdate = async (staffId: string, role: StaffRole) => {
        try {
            const response = await fetch(`/api/staff/${staffId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to update role.');
            }

            setStaff(previous =>
                previous.map(member => (member.id === staffId ? { ...member, role } : member))
            );
            toast.success('Role updated.');
            return true;
        } catch (roleError) {
            toast.error(roleError instanceof Error ? roleError.message : 'Failed to update role.');
            return false;
        }
    };

    const handleActiveToggle = async (member: StaffMember) => {
        try {
            const nextValue = member.is_active === false;
            setActiveUpdatingId(member.id);
            const response = await fetch(`/api/staff/${member.id}/active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: nextValue }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to update active status.');
            }

            setStaff(previous =>
                previous.map(staffMember =>
                    staffMember.id === member.id
                        ? { ...staffMember, is_active: nextValue }
                        : staffMember
                )
            );
            toast.success(nextValue ? 'Staff activated.' : 'Staff deactivated.');
            return true;
        } catch (activeError) {
            toast.error(
                activeError instanceof Error
                    ? activeError.message
                    : 'Failed to update active status.'
            );
            return false;
        } finally {
            setActiveUpdatingId(null);
        }
    };

    const handleAddPinStaff = async (payload: {
        name: string;
        role: StaffRole;
        pin_code: string;
        assigned_zones?: string[];
    }) => {
        try {
            setLoading(true);
            const response = await fetch('/api/staff/add-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to add staff member.');
            }
            
            setStaff(prev => [...prev, result.data.staff]);
            toast.success('Staff member added.');
            return true;
        } catch (err: any) {
            toast.error(err.message || 'Failed to add staff member.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        staff,
        loading,
        error,
        activeUpdatingId,
        inviteLoading,
        inviteUrl,
        setInviteUrl,
        fetchStaff,
        handleInvite,
        handleRoleUpdate,
        handleActiveToggle,
        handleAddPinStaff,
    };
}
