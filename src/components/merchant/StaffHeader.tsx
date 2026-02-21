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

const TABS = [{ label: 'Access Directory', href: '/merchant/staff' }];

export function StaffHeader({ viewMode, onViewModeChange, onInvite }: StaffHeaderProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        Access & Devices
                    </h1>
                    <p className="font-medium text-gray-500">
                        Provision device access keys and role permissions.
                    </p>
                </div>
                {onInvite && (
                    <button
                        onClick={onInvite}
                        className="bg-brand-crimson flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#a0151e] md:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Provision Link
                    </button>
                )}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-1 md:flex-row md:items-center">
                {/* Navigation Tabs */}
                <nav className="flex items-center gap-1 rounded-xl bg-gray-50/50 p-1">
                    {TABS.map(tab => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200',
                                    isActive
                                        ? 'bg-white text-black shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-900'
                                )}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Controls (Search & View Toggle) */}
                <div className="flex w-full items-center gap-2 md:w-auto">
                    <div className="group relative flex-1 text-gray-400 transition-colors focus-within:text-black md:flex-none">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Find access profile..."
                            className="w-full rounded-xl border-none bg-gray-50 py-2 pr-4 pl-9 text-sm font-bold transition-all placeholder:font-medium focus:bg-white focus:ring-1 focus:ring-gray-200 md:w-64"
                        />
                    </div>

                    {/* View Switcher (Only show if props are provided, usually only on Directory page) */}
                    {viewMode && onViewModeChange && (
                        <div className="flex shrink-0 items-center rounded-xl bg-gray-50 p-1">
                            <button
                                onClick={() => onViewModeChange('table')}
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
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
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
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
