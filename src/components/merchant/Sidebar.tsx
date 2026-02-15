'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid,
    ShoppingBag,
    UtensilsCrossed,
    QrCode,
    Users,
    Settings,
    LogOut,
    HelpCircle,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/merchant', icon: LayoutGrid },
    { label: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { label: 'Menu', href: '/merchant/menu', icon: UtensilsCrossed },
    { label: 'Tables & QR', href: '/merchant/tables', icon: QrCode },
    { label: 'Staff', href: '/merchant/staff', icon: Users },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] bg-white border-r border-[#F1F1F1] flex flex-col justify-between py-8 px-6 overflow-y-auto no-scrollbar">
            {/* Top Section */}
            <div>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
                        <div className="h-4 w-4 bg-white rounded-full opacity-80" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-black">Gebeta</span>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href} className="block group">
                                <div
                                    className={cn(
                                        'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200',
                                        isActive
                                            ? 'text-black font-bold'
                                            : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                    )}
                                >
                                    <Icon
                                        className={cn("h-5 w-5", isActive ? "text-black" : "text-gray-400 group-hover:text-black")}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    <span>{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>



            {/* Bottom Section */}
            <div className="space-y-6">
                {/* Upgrade Card */}
                <div className="p-5 rounded-[2rem] bg-gray-50 text-center space-y-4 relative overflow-hidden group border border-gray-100/50">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-12 w-12 mx-auto bg-blue-50/80 rounded-full flex items-center justify-center text-blue-600 mb-2 ring-4 ring-white">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-black text-sm">Upgrade to Pro</h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            Get 1 month free and unlock all features
                        </p>
                    </div>
                    <button className="w-full py-3 bg-[#BFDBFE] text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-300 transition-colors shadow-sm shadow-blue-100/50">
                        Upgrade
                    </button>
                </div>

                {/* Footer Links with Settings In-Between */}
                <div className="space-y-1 pt-2 border-t border-gray-50">
                    <button className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-black transition-colors rounded-xl hover:bg-gray-50">
                        <HelpCircle className="h-5 w-5" />
                        <span className="font-medium text-sm">Help & Information</span>
                    </button>

                    {/* Settings (Moved here) */}
                    <Link href="/merchant/settings" className="block w-full">
                        <button className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-black transition-colors rounded-xl hover:bg-gray-50">
                            <Settings className="h-5 w-5" />
                            <span className="font-medium text-sm">Settings</span>
                        </button>
                    </Link>

                    <button className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50">
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium text-sm">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
