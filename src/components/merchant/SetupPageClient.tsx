'use client';

import React, { useState } from 'react';
import {
    Building2,
    Store,
    CreditCard,
    Globe,
    Zap,
    ShieldCheck,
    Smartphone,
    Printer,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessInfoTab } from './BusinessInfoTab';
import { RestaurantProfileTab } from './RestaurantProfileTab';
import { FinancialsTab } from './FinancialsTab';
import { LocationsTab } from './LocationsTab';
import { SecurityTab } from './SecurityTab';
import { DevicesTab } from './DevicesTab';
import { IntegrationsTab } from './IntegrationsTab';
import { ModulesTab } from './ModulesTab';
import { NotificationsTab } from './NotificationsTab';
import { Bell } from 'lucide-react';

const TABS = [
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'profile', label: 'Restaurant Profile', icon: Store },
    { id: 'financials', label: 'Financials', icon: CreditCard },
    { id: 'locations', label: 'Locations', icon: Globe },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'devices', label: 'Devices', icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'modules', label: 'Plan & Modules', icon: Smartphone },
];

export function SetupPageClient() {
    const [activeTab, setActiveTab] = useState('business');

    return (
        <div className="flex min-h-screen flex-col bg-white px-10 py-4 tracking-[-0.04em] font-inter">
            {/* 1. Header Section */}
            <div className="mb-2 flex items-center justify-between py-6 pl-[60px]">
                <div className="flex items-center gap-6">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 pr-10">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white ring-offset-2 ">
                             <div className="flex h-full w-full items-center justify-center rounded-full bg-[#DDF853] text-black border-2 border-white">
                                CL
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-xl font-bold  text-gray-900 leading-none">Cafe Lucia</h1>
                            <div className="flex items-center gap-1.5 py-1 text-[10px] font-bold text-gray-500 w-fit">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#DDF853] text-black shadow-[0_0_8px_rgba(221,248,83,0.8)]" />
                                Active
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-0">
                        <div className="flex flex-col gap-1 pr-10">
                            <span className="text-[11px] font-medium text-gray-400">Last sync</span>
                            <span className="text-sm font-bold text-gray-900 leading-none">A few seconds ago</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-gray-200 pl-10 pr-10">
                            <span className="text-[11px] font-medium text-gray-400">Merchant ID</span>
                            <span className="text-sm font-bold text-gray-900 leading-none">#EMP07</span>
                        </div>
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
                    </button>
                ))}
            </div>

            {/* 3. Content Area */}
            <div className="w-full pb-20">
                {activeTab === 'business' && <BusinessInfoTab />}
                {activeTab === 'profile' && <RestaurantProfileTab />}
                {activeTab === 'financials' && <FinancialsTab />}
                {activeTab === 'locations' && <LocationsTab />}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'devices' && <DevicesTab />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'integrations' && <IntegrationsTab />}
                {activeTab === 'modules' && <ModulesTab />}
            </div>
        </div>
    );
}
