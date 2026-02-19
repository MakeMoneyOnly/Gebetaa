'use client';

import React from 'react';
import { MoreHorizontal, User, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StaffMember, ROLE_BADGE } from '@/hooks/useStaff';
import { ViewProps } from './StaffGrid'; // Shared type

export function StaffTable({ staff, onEditRole, onToggleActive, updatingId }: ViewProps) {
    if (staff.length === 0) return null;

    return (
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left align-middle">
                    <thead className="bg-gray-50/50">
                        <tr className="border-b border-gray-100 text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staff.map((member) => (
                            <tr
                                key={member.id}
                                className="group hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {member.is_active !== false ? (
                                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm ring-4 ring-emerald-50" />
                                        ) : (
                                            <div className="h-2.5 w-2.5 rounded-full bg-gray-300 shadow-sm ring-4 ring-gray-50" />
                                        )}
                                        <span
                                            className={cn(
                                                'text-xs font-bold uppercase tracking-wide',
                                                member.is_active !== false ? 'text-emerald-700' : 'text-gray-400'
                                            )}
                                        >
                                            {member.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm ring-2 ring-white shadow-sm">
                                            {(member.full_name || member.email || member.user_id).slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">
                                                {member.full_name
                                                    ? member.full_name
                                                    : member.first_name
                                                        ? `${member.first_name} ${member.last_name ?? ''}`.trim()
                                                        : member.email
                                                            ? member.email.split('@')[0]
                                                            : `User ${member.user_id.slice(0, 6)}`}
                                            </div>
                                            <div className="text-xs text-gray-400 font-medium">
                                                {member.email ?? member.user_id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={cn(
                                            'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
                                            ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'
                                        )}
                                    >
                                        <Shield className="mr-1.5 h-3 w-3 opacity-60" />
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                    {member.created_at
                                        ? new Date(member.created_at).toLocaleDateString(undefined, {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric',
                                          })
                                        : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {member.role === 'owner' ? (
                                            <span className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-lg">
                                                Owner
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onEditRole(member)}
                                                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                                                >
                                                    Edit Role
                                                </button>
                                                <button
                                                    disabled={updatingId === member.id}
                                                    onClick={() => onToggleActive(member)}
                                                    className={cn(
                                                        'inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-bold transition-all shadow-sm',
                                                        member.is_active === false
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600'
                                                    )}
                                                >
                                                    {updatingId === member.id ? (
                                                        <span className="animate-pulse">...</span>
                                                    ) : member.is_active === false ? (
                                                        <>Activate</>
                                                    ) : (
                                                        <>Deactivate</>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
