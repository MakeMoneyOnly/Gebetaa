'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, List, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'grid';

interface StaffHeaderProps {
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    onInvite?: () => void;
}

const TABS = [
    { label: 'Directory', href: '/merchant/staff' },
    { label: 'Schedule', href: '/merchant/staff/schedule' },
    { label: 'Time Clock', href: '/merchant/staff/time-entries' },
];

export function StaffHeader({ viewMode, onViewModeChange, onInvite }: StaffHeaderProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 font-medium">Manage your team, schedules, and payroll.</p>
                </div>
                {onInvite && (
                    <button
                        onClick={onInvite}
                        className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm md:w-auto w-full justify-center"
                    >
                        <Plus className="h-4 w-4" />
                        Add Member
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-1">
                {/* Navigation Tabs */}
                <nav className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-xl">
                    {TABS.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                                    isActive
                                        ? 'bg-white text-black shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                                )}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Controls (Search & View Toggle) */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group text-gray-400 focus-within:text-black transition-colors flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Find staff..."
                            className="bg-gray-50 border-none rounded-xl py-2 pl-9 pr-4 text-sm font-bold w-full md:w-64 placeholder:font-medium focus:ring-1 focus:ring-gray-200 focus:bg-white transition-all"
                        />
                    </div>

                    {/* View Switcher (Only show if props are provided, usually only on Directory page) */}
                    {viewMode && onViewModeChange && (
                        <div className="flex items-center bg-gray-50 p-1 rounded-xl shrink-0">
                            <button
                                onClick={() => onViewModeChange('table')}
                                className={cn(
                                    'h-8 w-8 flex items-center justify-center rounded-lg transition-all',
                                    viewMode === 'table'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                                title="Table View"
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onViewModeChange('grid')}
                                className={cn(
                                    'h-8 w-8 flex items-center justify-center rounded-lg transition-all',
                                    viewMode === 'grid'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                                title="Card Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
