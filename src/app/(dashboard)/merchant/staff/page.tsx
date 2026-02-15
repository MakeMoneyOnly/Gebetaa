'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, UserMinus, Shield, Loader2, Link as LinkIcon, Copy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

interface StaffMember {
    id: string;
    role: 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';
    is_active: boolean;
    user_id: string;
    email?: string;
}

interface Invite {
    id: string;
    code: string;
    role: string;
    status: 'pending' | 'accepted' | 'expired';
    created_at: string;
    expires_at: string;
}

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteRole, setInviteRole] = useState('waiter');
    const [generatedLink, setGeneratedLink] = useState('');

    const { user } = useRole(null);
    const supabase = createClient();

    useEffect(() => {
        if (user) {
            fetchStaff();
            fetchInvites();
        }
    }, [user]);

    const fetchStaff = async () => {
        try {
            const { data: currentStaff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user?.id || '')
                .single();

            if (!currentStaff) return;

            const { data } = await supabase
                .from('restaurant_staff')
                .select('*')
                .eq('restaurant_id', currentStaff.restaurant_id)
                .order('role');

            if (data) setStaff(data as any);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvites = async () => {
        try {
            const { data: currentStaff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user?.id || '')
                .single();

            if (!currentStaff) return;

            const { data } = await supabase
                .from('staff_invites')
                .select('*')
                .eq('restaurant_id', currentStaff.restaurant_id)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (data) setInvites(data as any);
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    const handleCreateInvite = async () => {
        try {
            const { data: currentStaff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user?.id || '')
                .single();

            if (!currentStaff) return;

            const code = Math.random().toString(36).substring(2, 10).toUpperCase();

            const { data, error } = await supabase
                .from('staff_invites')
                .insert([{
                    restaurant_id: currentStaff.restaurant_id,
                    role: inviteRole,
                    code: code,
                    created_by: user?.id
                }])
                .select()
                .single();

            if (error) throw error;

            // In a real app, this link would go to a specialized join page
            const link = `${window.location.origin}/join?code=${code}`;
            setGeneratedLink(link);
            fetchInvites();
        } catch (err: any) {
            alert('Error creating invite: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRemoveStaff = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        try {
            const { error } = await supabase.from('restaurant_staff').delete().eq('id', id);
            if (error) throw error;
            fetchStaff();
        } catch (err: any) {
            alert('Error removing staff: ' + (err.message || 'Unknown error'));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Link copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-crimson" />
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Staff Management</h1>
                    <p className="text-text-secondary">Manage team members and their roles</p>
                </div>
                <Button
                    onClick={() => { setShowInviteModal(true); setGeneratedLink(''); }}
                    className="bg-brand-crimson hover:bg-brand-crimson-hover text-white"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Staff
                </Button>
            </div>

            {/* Active Staf List */}
            <div className="grid gap-4">
                <h3 className="font-bold text-lg text-text-primary mt-4">Active Staff</h3>
                {staff.map((member) => (
                    <Card key={member.id} className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-surface-200 flex items-center justify-center">
                                <span className="font-bold text-text-secondary">
                                    {member.role.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-medium text-text-primary">
                                    {member.user_id === user?.id ? "You" : `User ${member.user_id.slice(0, 8)}...`}
                                </h3>
                                <p className="text-sm text-text-tertiary flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide mr-4",
                                member.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            )}>
                                {member.is_active ? 'Active' : 'Inactive'}
                            </div>

                            {member.user_id !== user?.id && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-50"
                                    onClick={() => handleRemoveStaff(member.id)}
                                >
                                    <UserMinus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}

                {staff.length === 0 && !loading && (
                    <div className="text-center py-10 text-text-tertiary">
                        No staff found.
                    </div>
                )}
            </div>

            {/* Pending Invites List */}
            {invites.length > 0 && (
                <div className="grid gap-4 mt-8">
                    <h3 className="font-bold text-lg text-text-primary">Pending Invites</h3>
                    {invites.map((invite) => (
                        <Card key={invite.id} className="flex items-center justify-between p-4 border-dashed bg-surface-50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-surface-100 flex items-center justify-center">
                                    <LinkIcon className="h-5 w-5 text-text-tertiary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-text-primary">
                                        Invite for {invite.role}
                                    </h3>
                                    <p className="text-sm text-text-tertiary font-mono">
                                        Code: {invite.code}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => copyToClipboard(`${window.location.origin}/join?code=${invite.code}`)}
                            >
                                <Copy className="mr-2 h-3 w-3" />
                                Copy Link
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-4 top-4 h-8 w-8 p-0"
                            onClick={() => setShowInviteModal(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">Invite New Staff</h3>
                                <p className="text-text-secondary text-sm">Generate a unique link for them to join.</p>
                            </div>

                            {!generatedLink ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Role</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 focus:border-brand-crimson focus:outline-none"
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                        >
                                            <option value="manager">Manager</option>
                                            <option value="kitchen">Kitchen Staff</option>
                                            <option value="waiter">Waiter</option>
                                            <option value="bar">Bar Staff</option>
                                        </select>
                                    </div>
                                    <Button
                                        className="w-full bg-brand-crimson text-white hover:bg-brand-crimson-hover"
                                        onClick={handleCreateInvite}
                                    >
                                        Generate Invite Link
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-surface-50 border border-surface-200 rounded-lg break-all text-sm font-mono text-brand-crimson">
                                        {generatedLink}
                                    </div>
                                    <Button
                                        className="w-full bg-brand-crimson text-white hover:bg-brand-crimson-hover"
                                        onClick={() => copyToClipboard(generatedLink)}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Link
                                    </Button>
                                    <p className="text-xs text-center text-text-tertiary">
                                        Share this link with your staff member. It expires in 7 days.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
