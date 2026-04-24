'use client';

import React, { useState } from 'react';
import {
    LayoutList,
    Layers,
    ListChecks,
    Settings,
    UploadCloud,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuManagerTab } from './MenuManagerTab';
import { ModifierGroupsTab } from './ModifierGroupsTab';
import { MenuBulkEditTab } from './MenuBulkEditTab';
import { MenuConfigurationTab } from './MenuConfigurationTab';
import { PublishChangesTab } from './PublishChangesTab';

const TABS = [
    { id: 'manager', label: 'Menu Manager', icon: LayoutList },
    { id: 'modifiers', label: 'Modifier Groups', icon: Layers },
    { id: 'bulk-edit', label: 'Bulk Edit', icon: ListChecks },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'publish', label: 'Publish Changes', icon: UploadCloud, badge: 3 },
];

export function MenusPageClient({ initialData }: { initialData?: any }) {
    const [activeTab, setActiveTab] = useState('manager');

    return (
        <div className="flex min-h-screen flex-col bg-white px-10 py-4 tracking-[-0.04em] font-inter">
            {/* 1. Header Section */}
            <div className="mb-2 flex items-center justify-between py-6 pl-[60px]">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-gray-900 leading-none">Menus</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Manage categories, items, and pricing
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 rounded-xl bg-brand-accent px-6 h-11 text-sm font-bold text-black shadow-brand-accent/10 transition-all hover:brightness-105 hover: active:scale-95">
                        <Save className="h-4 w-4" />
                        Save changes
                    </button>
                </div>
            </div>

            {/* 2. Navigation Tabs */}
            <div className="mb-6 flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2.5 whitespace-nowrap px-4 py-4 text-sm font-medium transition-all relative group",
                            activeTab === tab.id
                                ? "text-black after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-black font-bold"
                                : "text-gray-400 hover:text-gray-600 font-medium"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-black" : "text-gray-400 group-hover:text-gray-600")} />
                        {tab.label}
                        {tab.badge && (
                            <span className="ml-1 rounded-full bg-[#DDF853] px-2 py-0.5 text-[10px] font-bold text-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* 3. Content Area */}
            <div className="w-full pb-20">
                {activeTab === 'manager' && <MenuManagerTab initialData={initialData} />}
                {activeTab === 'modifiers' && <ModifierGroupsTab />}
                {activeTab === 'bulk-edit' && <MenuBulkEditTab initialData={initialData} />}
                {activeTab === 'config' && <MenuConfigurationTab />}
                {activeTab === 'publish' && <PublishChangesTab />}
            </div>
        </div>
    );
}
