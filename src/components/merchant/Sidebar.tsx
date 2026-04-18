'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    BarChart3,
    Megaphone,
    ChefHat,
    Plug,
    Wallet,
    CreditCard,
    Landmark,
    Store,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
    {
        title: 'OVERVIEW',
        items: [
            { label: 'Home', href: '/merchant', icon: LayoutGrid },
            { label: 'Reports', href: '/merchant/reports', icon: BarChart3 },
        ],
    },
    {
        title: 'OPERATIONS',
        items: [
            { label: 'Menus', href: '/merchant/menus', icon: UtensilsCrossed },
            { label: 'Takeout & Delivery', href: '/merchant/takeout', icon: ShoppingBag },
            { label: 'Front of House', href: '/merchant/foh', icon: QrCode },
            { label: 'Kitchen', href: '/merchant/kitchen', icon: ChefHat },
        ],
    },
    {
        title: 'PEOPLE & FINANCE',
        items: [
            { label: 'Employees', href: '/merchant/employees', icon: Users },
            { label: 'Payroll', href: '/merchant/payroll', icon: Wallet },
            { label: 'Payments', href: '/merchant/payments', icon: CreditCard },
        ],
    },
    {
        title: 'GROWTH & PLATFORM',
        items: [
            { label: 'Marketing', href: '/merchant/marketing', icon: Megaphone },
            { label: 'Financial Products', href: '/merchant/financial', icon: Landmark },
            { label: 'Integrations', href: '/merchant/integrations', icon: Plug },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="no-scrollbar fixed top-0 left-0 z-50 hidden h-screen w-[280px] flex-col justify-between overflow-y-auto border-r border-[#F1F1F1] bg-white px-4 pb-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] md:flex">
            {/* Top Section */}
            <div className="space-y-6">
                {/* Logo Area */}
                <div className="flex h-[88px] w-full items-center justify-start px-3">
                    <div className="relative flex h-10 w-32 items-center justify-start pl-1">
                        <Image
                            src="/logo-black.svg"
                            alt="Lole"
                            width={110}
                            height={100}
                            className="pointer-events-none absolute top-1/2 left-0 h-20 w-auto max-w-none origin-left -translate-y-1/2"
                            style={{ width: 'auto' }}
                            priority
                        />
                    </div>
                </div>

                {/* Search Bar Moved to Header */}

                {/* Navigation */}
                <nav className="space-y-6 px-1">
                    {SECTIONS.map(section => (
                        <div key={section.title} className="space-y-1.5">
                            <h3 className="text-micro px-4 font-bold tracking-[-0.04em] text-gray-400 uppercase">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    const isActive =
                                        item.href === '/merchant'
                                            ? pathname === '/merchant'
                                            : pathname.startsWith(item.href);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={cn(
                                                'group flex items-center justify-between rounded-xl px-4 py-2.5 transition-all duration-200 ease-in-out',
                                                isActive
                                                    ? 'bg-gray-100 text-black shadow-none'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon
                                                    className={cn(
                                                        'h-[22px] w-[22px] transition-colors',
                                                        isActive
                                                            ? 'text-black'
                                                            : 'text-gray-400 group-hover:text-black'
                                                    )}
                                                    strokeWidth={isActive ? 2 : 1.5}
                                                />
                                                <span
                                                    className={cn(
                                                        'truncate text-sm tracking-[-0.04em] transition-colors',
                                                        isActive
                                                            ? 'font-semibold text-black'
                                                            : 'font-medium text-gray-500 group-hover:text-black'
                                                    )}
                                                >
                                                    {item.label}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto space-y-1 border-t border-[#F1F1F1] pt-6">
                {[
                    { href: '/merchant/shop', icon: Store, label: 'Shop' },
                    { href: '/merchant/help', icon: HelpCircle, label: 'Help & Support' },
                    { href: '/merchant/setup', icon: Settings, label: 'Settings' },
                ].map(link => (
                    <Link key={link.href} href={link.href} className="block w-full">
                        <div
                            className={cn(
                                'group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 hover:bg-gray-50',
                                pathname === link.href ? 'bg-gray-100 text-black' : 'text-gray-500'
                            )}
                        >
                            <link.icon
                                className={cn(
                                    'h-[22px] w-[22px] transition-colors',
                                    pathname === link.href
                                        ? 'text-black'
                                        : 'text-gray-400 group-hover:text-black'
                                )}
                                strokeWidth={pathname === link.href ? 2 : 1.5}
                            />
                            <span
                                className={cn(
                                    'text-sm font-medium tracking-[-0.04em] transition-colors',
                                    pathname === link.href
                                        ? 'font-semibold text-black'
                                        : 'text-gray-500 group-hover:text-black'
                                )}
                            >
                                {link.label}
                            </span>
                        </div>
                    </Link>
                ))}

                {/* Logout row */}
                <button
                    className="group flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-all duration-200 hover:bg-red-50"
                    onClick={() => {
                        window.location.href = '/auth/login';
                    }}
                >
                    <div className="flex items-center gap-3">
                        <User
                            className="h-[22px] w-[22px] shrink-0 text-gray-400 transition-colors group-hover:text-red-400"
                            strokeWidth={1.5}
                        />
                        <span className="text-sm font-medium tracking-[-0.04em] text-gray-500 transition-colors group-hover:text-red-500">
                            Logout
                        </span>
                    </div>
                    <LogOut className="h-[22px] w-[22px] shrink-0 text-red-500" strokeWidth={1.5} />
                </button>
            </div>
        </aside>
    );
}
