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
    CreditCard,
    BarChart3,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/merchant', icon: LayoutGrid },
    { label: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { label: 'Menu', href: '/merchant/menu', icon: UtensilsCrossed },
    { label: 'Tables & QR', href: '/merchant/tables', icon: QrCode },
    { label: 'Staff', href: '/merchant/staff', icon: Users },
    { label: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-[280px] bg-white border-r border-[#F1F1F1] flex-col justify-between py-6 px-4 overflow-y-auto no-scrollbar shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
            {/* Top Section */}
            <div className="space-y-8">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 pt-4 pb-2">
                    <div className="h-10 w-10 bg-black rounded-[0.85rem] flex items-center justify-center shadow-lg shadow-black/20 ring-4 ring-gray-50/50">
                        <div className="h-4 w-4 bg-white rounded-full opacity-90 shadow-inner" />
                    </div>
                    <span className="block text-xl font-bold tracking-tight text-black leading-none">Gebeta</span>
                </div>

                {/* Search Placeholder */}
                <div className="px-2 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-gray-200 focus:bg-white transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Navigation */}
                <nav className="space-y-1.5 px-1">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <div key={item.label} className="space-y-1">
                                <div className="relative group">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out group-hover:scale-[1.02]",
                                            isActive
                                                ? "bg-gradient-to-br from-blue-50 to-indigo-50/50 shadow-sm border border-blue-100/50 text-black"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Icon
                                                className={cn("h-5 w-5 transition-transform duration-300", isActive ? "text-black" : "text-gray-400 group-hover:text-black group-hover:scale-110")}
                                                strokeWidth={2}
                                            />
                                            <span className={cn("text-[13px] tracking-wide transition-all", isActive ? "font-medium" : "font-medium")}>
                                                {item.label}
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
                {/* Upgrade Card */}
                <div className="mx-1 p-5 rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50/50 relative overflow-hidden group border border-blue-100/50 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="h-10 w-10 bg-white rounded-[1rem] flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            Pro
                        </span>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-gray-900 text-sm tracking-tight mb-1">Upgrade Plan</h4>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">
                            Get advanced analytics & unlimited staff.
                        </p>
                        <button className="w-full py-2.5 bg-black text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                            Upgrade Now
                            <ChevronRight className="h-3 w-3 opacity-50" />
                        </button>
                    </div>
                    {/* Decorative Background */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl group-hover:bg-blue-200/50 transition-colors" />
                </div>

                {/* Footer Links */}
                <div className="space-y-1">
                    {[
                        { href: '/merchant/help', icon: HelpCircle, label: 'Help & Support' },
                        { href: '/merchant/settings', icon: Settings, label: 'Settings' }
                    ].map((link) => (
                        <Link key={link.href} href={link.href} className="block w-full">
                            <div className={cn(
                                "group flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 hover:bg-gray-50",
                                pathname === link.href ? "text-black bg-gray-50" : "text-gray-400"
                            )}>
                                <link.icon className={cn("h-4 w-4 transition-colors", pathname === link.href ? "text-black" : "text-gray-400 group-hover:text-black")} />
                                <span className={cn("transition-colors", pathname === link.href ? "font-medium text-black" : "font-medium group-hover:text-black", "text-[13px]")}>
                                    {link.label}
                                </span>
                            </div>
                        </Link>
                    ))}

                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-red-500 transition-colors rounded-2xl hover:bg-red-50 group mt-1">
                        <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="font-medium text-xs">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
