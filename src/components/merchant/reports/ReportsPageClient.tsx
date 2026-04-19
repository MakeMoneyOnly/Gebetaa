'use client';

import React, { useState } from 'react';
import {
    TrendingUp,
    Users,
    Wallet,
    CreditCard,
    Receipt,
    Utensils,
    Heart,
    Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SalesTab } from './tabs/SalesTab';
import { LaborTab } from './tabs/LaborTab';
import { CashManagementTab } from './tabs/CashManagementTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { TaxTab } from './tabs/TaxTab';
import { MenuTab } from './tabs/MenuTab';
import { GuestTab } from './tabs/GuestTab';
import { ExportTab } from './tabs/ExportTab';

const TABS = [
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'labor', label: 'Labor', icon: Users },
    { id: 'cash', label: 'Cash Management', icon: Wallet },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'tax', label: 'Tax & Service Charges', icon: Receipt },
    { id: 'menu', label: 'Menu & Modifiers', icon: Utensils },
    { id: 'guest', label: 'Guest Data', icon: Heart },
    { id: 'export', label: 'Export Center', icon: Download },
];

export function ReportsPageClient() {
    const [activeTab, setActiveTab] = useState('sales');

    const titles: Record<string, { title: string; desc: string }> = {
        sales: { title: 'Sales Reports', desc: 'Comprehensive overview of business sales performance.' },
        labor: { title: 'Labor & Staffing', desc: 'Monitor labor costs, time entries, and overtime.' },
        cash: { title: 'Cash Management', desc: 'Track drawer balances, payouts, and Z-report summaries.' },
        payments: { title: 'Payments', desc: 'Payment method breakdowns and transaction histories.' },
        tax: { title: 'Tax & Service Charges', desc: 'VAT reports, MAT checks (🇪🇹), and service charge summaries.' },
        menu: { title: 'Menu & Modifiers', desc: 'Item performance and category revenue mix.' },
        guest: { title: 'Guest Data', desc: 'Visit frequency, return rates, and loyalty program performance.' },
        export: { title: 'Export Center', desc: 'Schedule automated reports or perform bulk data exports.' },
    };

    return (
        <div className="font-inter flex min-h-screen flex-col bg-white px-10 py-8 tracking-[-0.04em]">
            {/* Dynamic Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{titles[activeTab].title}</h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">{titles[activeTab].desc}</p>
                </div>
                <div className="flex items-center gap-0">
                    <div className="flex flex-col gap-1 pr-10">
                        <span className="text-[11px] font-medium text-gray-400">Date</span>
                        <span className="text-sm leading-none font-bold text-gray-900">Today</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-gray-200 pr-10 pl-10">
                        <span className="text-[11px] font-medium text-gray-400">Merchant ID</span>
                        <span className="text-sm leading-none font-bold text-gray-900">#EMP07</span>
                    </div>
                </div>
            </div>

            {/* 2. Navigation Tabs */}
            <div className="no-scrollbar mb-8 flex items-center gap-2 overflow-x-auto border-b border-gray-200">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'group relative flex items-center gap-2.5 px-4 py-4 text-sm font-medium whitespace-nowrap transition-all',
                            activeTab === tab.id
                                ? 'font-bold text-black after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-black'
                                : 'font-medium text-gray-400 hover:text-gray-600'
                        )}
                    >
                        <tab.icon
                            className={cn(
                                'h-4 w-4',
                                activeTab === tab.id
                                    ? 'text-black'
                                    : 'text-gray-400 group-hover:text-gray-600'
                            )}
                        />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. Content Area */}
            <div className="w-full pb-20">
                {activeTab === 'sales' && <SalesTab />}
                {activeTab === 'labor' && <LaborTab />}
                {activeTab === 'cash' && <CashManagementTab />}
                {activeTab === 'payments' && <PaymentsTab />}
                {activeTab === 'tax' && <TaxTab />}
                {activeTab === 'menu' && <MenuTab />}
                {activeTab === 'guest' && <GuestTab />}
                {activeTab === 'export' && <ExportTab />}
            </div>
        </div>
    );
}
