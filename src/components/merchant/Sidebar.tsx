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
    User,
    Users,
    RadioTower,
    Settings,
    LogOut,
    HelpCircle,
    CreditCard,
    BarChart3,
    ChevronRight,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/merchant', icon: LayoutGrid },
    { label: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { label: 'Menu', href: '/merchant/menu', icon: UtensilsCrossed },
    { label: 'Tables & QR', href: '/merchant/tables', icon: QrCode },
    { label: 'Guests', href: '/merchant/guests', icon: User },
    { label: 'Channels', href: '/merchant/channels', icon: RadioTower },
    { label: 'Access & Devices', href: '/merchant/staff', icon: Users },
    { label: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="no-scrollbar fixed top-0 left-0 z-50 hidden h-screen w-[280px] flex-col justify-between overflow-y-auto border-r border-[#F1F1F1] bg-white px-4 py-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] md:flex">
            {/* Top Section */}
            <div className="space-y-8">
                {/* Logo */}
                <div className="flex w-full items-center justify-start px-2 pt-4 pb-2">
                    <div className="relative flex h-8 w-24 items-center justify-start pl-1">
                        <Image
                            src="/logo-black.svg"
                            alt="Lole"
                            width={96}
                            height={90}
                            className="pointer-events-none absolute top-1/2 left-0 h-[74px] w-auto max-w-none origin-left -translate-y-1/2 md:h-[90px]"
                            priority
                        />
                    </div>
                </div>

                {/* Search Placeholder */}
                <div className="group relative px-2">
                    <Search className="absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="text-body w-full rounded-xl border border-gray-100 bg-gray-50 py-3.5 pr-4 pl-12 font-medium transition-all placeholder:text-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none"
                    />
                </div>

                {/* Navigation */}
                <nav className="space-y-1.5 px-1">
                    {MENU_ITEMS.map(item => {
                        const isActive =
                            item.href === '/merchant'
                                ? pathname === '/merchant'
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <div key={item.label} className="space-y-1">
                                <div className="group relative">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 ease-out group-hover:scale-[1.02]',
                                            isActive
                                                ? 'bg-brand-accent text-black shadow-sm'
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
                                                    'text-body truncate tracking-tight transition-all',
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
                {/* Upgrade Card */}
                <div className="group relative mx-1 overflow-hidden rounded-4xl border border-blue-100/50 bg-linear-to-br from-blue-50 to-indigo-50/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50">
                    <div className="relative z-10 mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-50 bg-white text-blue-600 shadow-sm">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                            Pro
                        </span>
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-body mb-1 font-bold tracking-tight text-gray-900">
                            Upgrade Plan
                        </h4>
                        <p className="text-caption mb-4 leading-relaxed font-medium text-gray-500">
                            Get advanced analytics & unlimited staff.
                        </p>
                        <button className="bg-brand-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black shadow-lg shadow-black/10 transition-all group-hover:scale-[1.02] hover:brightness-105">
                            Upgrade Now
                            <ChevronRight className="h-4 w-4 opacity-50" />
                        </button>
                    </div>
                    {/* Decorative Background */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-100/50 blur-3xl transition-colors group-hover:bg-blue-200/50" />
                </div>

                {/* Footer Links */}
                <div className="space-y-1">
                    {[
                        { href: '/merchant/help', icon: HelpCircle, label: 'Help & Support' },
                        { href: '/merchant/settings', icon: Settings, label: 'Settings' },
                    ].map(link => (
                        <Link key={link.href} href={link.href} className="block w-full">
                            <div
                                className={cn(
                                    'group flex items-center gap-3.5 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-gray-50',
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
                                        'text-body-sm tracking-tight'
                                    )}
                                >
                                    {link.label}
                                </span>
                            </div>
                        </Link>
                    ))}

                    <button className="group mt-1 flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                        <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-body-sm font-semibold tracking-tight">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
