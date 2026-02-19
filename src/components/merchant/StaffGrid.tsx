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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {staff.map((member) => (
                <div
                    key={member.id}
                    className="bg-white p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col gap-6 relative overflow-hidden"
                >
                    <div className="flex items-start justify-between">
                        <div className="h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-xl font-bold shadow-sm bg-gray-50 text-gray-700 ring-4 ring-white">
                            {(member.full_name || member.email || member.user_id).slice(0, 2).toUpperCase()}
                        </div>
                        <button
                            onClick={() => onEditRole(member)}
                            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-gray-900 tracking-tight">
                            {member.full_name
                                ? member.full_name
                                : member.first_name
                                    ? `${member.first_name} ${member.last_name ?? ''}`.trim()
                                    : member.email
                                        ? member.email.split('@')[0]
                                        : `User ${member.user_id.slice(0, 6)}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span
                                className={cn(
                                    'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                                    ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'
                                )}
                            >
                                {member.role}
                            </span>
                            <span
                                className={cn(
                                    'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                                    member.is_active === false
                                        ? 'bg-gray-100 text-gray-600'
                                        : 'bg-emerald-50 text-emerald-700'
                                )}
                            >
                                {member.is_active === false ? 'inactive' : 'active'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-3">
                            Joined {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-dashed border-gray-100 flex items-center justify-between gap-2 transition-opacity duration-200">
                        {member.role === 'owner' ? (
                            <div className="w-full flex justify-center">
                                <span className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-lg">
                                    Owner Account (Protected)
                                </span>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onEditRole(member)}
                                    className="h-9 px-3 rounded-xl bg-gray-50 text-xs font-bold text-gray-700 hover:bg-gray-100 flex-1 shadow-sm"
                                >
                                    Edit Role
                                </button>
                                <button
                                    type="button"
                                    disabled={updatingId === member.id}
                                    onClick={() => onToggleActive(member)}
                                    className={cn(
                                        'h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-50 flex-1 transition-colors shadow-sm',
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
