'use client';

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StaffMember, ROLE_BADGE } from '@/hooks/useStaff';

export interface ViewProps {
    staff: StaffMember[];
    onEditRole: (member: StaffMember) => void;
    onToggleActive: (member: StaffMember) => void;
    updatingId: string | null;
}

export function StaffGrid({ staff, onEditRole, onToggleActive, updatingId }: ViewProps) {
    if (staff.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {staff.map(member => (
                <div
                    key={member.id}
                    className="group relative flex flex-col gap-6 overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gray-50 text-xl font-bold text-gray-700 shadow-sm ring-4 ring-white">
                            {(member.full_name || member.name || member.email || member.id || 'US')
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <button
                            onClick={() => onEditRole(member)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-black"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-gray-900">
                            {member.full_name
                                ? member.full_name
                                : member.first_name
                                  ? `${member.first_name} ${member.last_name ?? ''}`.trim()
                                  : member.email
                                    ? member.email.split('@')[0]
                                    : `Staff ${member.id?.slice(0, 6)}`}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                            <span
                                className={cn(
                                    'rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                                    ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'
                                )}
                            >
                                {member.role}
                            </span>
                            <span
                                className={cn(
                                    'rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                                    member.is_active === false
                                        ? 'bg-gray-100 text-gray-600'
                                        : 'bg-emerald-50 text-emerald-700'
                                )}
                            >
                                {member.is_active === false ? 'inactive' : 'active'}
                            </span>
                        </div>
                        <p className="mt-3 text-xs font-medium text-gray-400">
                            Joined{' '}
                            {member.created_at
                                ? new Date(member.created_at).toLocaleDateString()
                                : 'N/A'}
                        </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-gray-100 pt-4 transition-opacity duration-200">
                        {member.role === 'owner' ? (
                            <div className="flex w-full justify-center">
                                <span className="rounded-lg bg-gray-50 px-3 py-1 text-xs font-bold text-gray-400">
                                    Owner Account (Protected)
                                </span>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onEditRole(member)}
                                    className="h-9 flex-1 rounded-xl bg-gray-50 px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-100"
                                >
                                    Edit Role
                                </button>
                                <button
                                    type="button"
                                    disabled={updatingId === member.id}
                                    onClick={() => onToggleActive(member)}
                                    className={cn(
                                        'h-9 flex-1 rounded-xl px-3 text-xs font-bold shadow-sm transition-colors disabled:opacity-50',
                                        member.is_active === false
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600'
                                    )}
                                >
                                    {updatingId === member.id
                                        ? '...'
                                        : member.is_active === false
                                          ? 'Activate'
                                          : 'Deactivate'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
