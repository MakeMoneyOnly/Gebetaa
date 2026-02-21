'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid,
    ShoppingBag,
    UtensilsCrossed,
    QrCode,
    User,
    Users,
    RadioTower,
    Settings,
    LogOut,
    HelpCircle,
    CreditCard,
    Landmark,
    BarChart3,
    Boxes,
    ChevronRight,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/merchant', icon: LayoutGrid },
    { label: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { label: 'Menu', href: '/merchant/menu', icon: UtensilsCrossed },
    { label: 'Tables & QR', href: '/merchant/tables', icon: QrCode },
    { label: 'Guests', href: '/merchant/guests', icon: User },
    { label: 'Channels', href: '/merchant/channels', icon: RadioTower },
    { label: 'Staff', href: '/merchant/staff', icon: Users },
    { label: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
    { label: 'Inventory', href: '/merchant/inventory', icon: Boxes },
    { label: 'Finance', href: '/merchant/finance', icon: Landmark },
];

export function Sidebar() {
    const pathname = usePathname();
    const { role } = useRole(null);

    // Dynamic role-based filtering
    const filteredItems = React.useMemo(() => {
        if (!role) return []; // Or show minimal/skeleton?
        // Define access rules
        const rules: Record<string, string[]> = {
            owner: [
                'Dashboard',
                'Orders',
                'Menu',
                'Tables & QR',
                'Guests',
                'Channels',
                'Staff',
                'Analytics',
                'Inventory',
                'Finance',
            ],
            admin: [
                'Dashboard',
                'Orders',
                'Menu',
                'Tables & QR',
                'Guests',
                'Channels',
                'Staff',
                'Analytics',
                'Inventory',
                'Finance',
            ],
            manager: [
                'Dashboard',
                'Orders',
                'Menu',
                'Tables & QR',
                'Guests',
                'Staff',
                'Inventory',
                'Finance',
            ],
            kitchen: ['Orders', 'Menu', 'Inventory'],
            waiter: ['Orders', 'Tables & QR', 'Menu'],
            bar: ['Orders', 'Menu', 'Inventory', 'Finance'],
        };

        const allowed = rules[role] || [];
        // Always allow 'Help & Support' and 'Settings' (handled separately in footer)
        // This filters the main nav items
        return MENU_ITEMS.filter(item => allowed.includes(item.label));
    }, [role]);

    return (
        <aside className="no-scrollbar fixed top-0 left-0 z-50 hidden h-screen w-[280px] flex-col justify-between overflow-y-auto border-r border-[#F1F1F1] bg-white px-4 py-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] md:flex">
            {/* Top Section */}
            <div className="space-y-8">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 pt-4 pb-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-black shadow-lg ring-4 shadow-black/20 ring-gray-50/50 transition-transform duration-500 hover:rotate-6">
                        <div className="h-5 w-5 rounded-full bg-white opacity-90 shadow-inner" />
                    </div>
                    <span className="block text-2xl leading-none font-extrabold tracking-tighter text-black">
                        Gebeta
                    </span>
                </div>

                {/* Search Placeholder */}
                <div className="group relative px-2">
                    <Search className="absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3.5 pr-4 pl-12 text-[15px] font-medium transition-all placeholder:text-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none"
                    />
                </div>

                {/* Navigation */}
                <nav className="space-y-1.5 px-1">
                    {filteredItems.map(item => {
                        const isActive =
                            pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                            <div key={item.label} className="space-y-1">
                                <div className="group relative">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300 ease-out group-hover:scale-[1.02]',
                                            isActive
                                                ? 'border border-blue-100/50 bg-gradient-to-br from-blue-50 to-indigo-50/50 text-black shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Icon
                                                className={cn(
                                                    'h-[22px] w-[22px] transition-transform duration-300',
                                                    isActive
                                                        ? 'text-black'
                                                        : 'text-gray-400 group-hover:scale-110 group-hover:text-black'
                                                )}
                                                strokeWidth={2}
                                            />
                                            <span
                                                className={cn(
                                                    'truncate text-[15px] tracking-tight transition-all',
                                                    isActive
                                                        ? 'font-semibold text-black'
                                                        : 'font-semibold text-gray-500 group-hover:text-black'
                                                )}
                                            >
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
            <div className="space-y-4 border-t border-dashed border-gray-100 pt-6">
                {/* Upgrade Card - Only for Owner/Admin */}
                {(role === 'owner' || role === 'admin') && (
                    <div className="group relative mx-1 overflow-hidden rounded-[2rem] border border-blue-100/50 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50">
                        <div className="relative z-10 mb-3 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-blue-50 bg-white text-blue-600 shadow-sm">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <span className="rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                                Pro
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h4 className="mb-1 text-[15px] font-bold tracking-tight text-gray-900">
                                Upgrade Plan
                            </h4>
                            <p className="mb-4 text-[12px] leading-relaxed font-medium text-gray-500">
                                Get advanced analytics & unlimited staff.
                            </p>
                            <button className="bg-brand-crimson flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all group-hover:scale-[1.02] hover:bg-[#a0151e]">
                                Upgrade Now
                                <ChevronRight className="h-4 w-4 opacity-50" />
                            </button>
                        </div>
                        {/* Decorative Background */}
                        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-100/50 blur-3xl transition-colors group-hover:bg-blue-200/50" />
                    </div>
                )}

                {/* Footer Links */}
                <div className="space-y-1">
                    {[
                        { href: '/merchant/help', icon: HelpCircle, label: 'Help & Support' },
                        { href: '/merchant/settings', icon: Settings, label: 'Settings' },
                    ].map(link => (
                        <Link key={link.href} href={link.href} className="block w-full">
                            <div
                                className={cn(
                                    'group flex items-center gap-3.5 rounded-2xl px-4 py-3 transition-all duration-200 hover:bg-gray-50',
                                    pathname === link.href
                                        ? 'bg-gray-50 text-black'
                                        : 'text-gray-400'
                                )}
                            >
                                <link.icon
                                    className={cn(
                                        'h-5 w-5 transition-colors',
                                        pathname === link.href
                                            ? 'text-black'
                                            : 'text-gray-400 group-hover:text-black'
                                    )}
                                />
                                <span
                                    className={cn(
                                        'transition-colors',
                                        pathname === link.href
                                            ? 'font-semibold text-black'
                                            : 'font-semibold group-hover:text-black',
                                        'text-[14px] tracking-tight'
                                    )}
                                >
                                    {link.label}
                                </span>
                            </div>
                        </Link>
                    ))}

                    <button className="group mt-1 flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                        <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-[14px] font-semibold tracking-tight">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
