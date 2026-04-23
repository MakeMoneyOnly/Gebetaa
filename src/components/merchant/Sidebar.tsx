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
import { useSidebar } from '@/contexts/SidebarContext';

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
        title: 'GROWTH',
        items: [{ label: 'Marketing', href: '/merchant/marketing', icon: Megaphone }],
    },
    {
        title: 'PLATFORM',
        items: [
            { label: 'Financial Products', href: '/merchant/financial', icon: Landmark },
            { label: 'Integrations', href: '/merchant/integrations', icon: Plug },
        ],
    },
];

const BOTTOM_LINKS = [
    { href: '/merchant/shop', icon: Store, label: 'Shop' },
    { href: '/merchant/help', icon: HelpCircle, label: 'Help & Support' },
    { href: '/merchant/setup', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed } = useSidebar();

    return (
        <aside
            className={cn(
                // Fixed, full-height, scrollable, hidden on mobile
                'no-scrollbar fixed top-0 left-0 z-50 hidden h-screen flex-col justify-between',
                'overflow-y-auto overflow-x-hidden',
                'border-r border-[#F1F1F1] bg-white',
                'shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]',
                // GPU-composited width transition — translateZ(0) promotes to own layer
                // cubic-bezier(0.4,0,0.2,1) = fast start, smooth deceleration (Material standard)
                'transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                'will-change-[width] [transform:translateZ(0)]',
                'md:flex',
                isCollapsed ? 'w-[72px] px-2 pb-4' : 'w-[280px] px-4 pb-6'
            )}
        >
            {/* ── Top section ── */}
            <div className="space-y-6">

                {/* Logo */}
                <div className="flex h-[88px] w-full items-center overflow-hidden">
                    {/*
                        We render both logo states and crossfade between them.
                        Using absolute positioning keeps the logo area height stable.
                    */}
                    <div className="relative flex w-full items-center">
                        {/* Full wordmark — visible when expanded */}
                        <div
                            className={cn(
                                'flex items-center pl-3 transition-[opacity] duration-300 ease-in-out',
                                isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            )}
                        >
                            <Image
                                src="/logo-black.svg"
                                alt="Lole"
                                width={110}
                                height={40}
                                className="h-20 w-auto object-contain"
                                style={{ width: 'auto' }}
                                priority
                            />
                        </div>

                        {/* Icon mark — visible when collapsed, absolutely overlaid */}
                        <div
                            className={cn(
                                'absolute left-1/2 -translate-x-1/2',
                                'flex items-center justify-center',
                                'transition-[opacity] duration-300 ease-in-out',
                                isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            )}
                        >
                            <Image
                                src="/logo-black.svg"
                                alt="Lole"
                                width={28}
                                height={28}
                                className="h-7 w-auto object-contain"
                                style={{ width: 'auto' }}
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-6 px-1">
                    {SECTIONS.map(section => (
                        <div key={section.title} className="space-y-1.5">
                            {/*
                                CRITICAL: opacity-only transition on section titles.
                                Never animate height/max-height here — doing so shifts
                                every icon's Y-coordinate during the animation.
                                whitespace-nowrap + overflow-hidden are equally critical:
                                without them, "PEOPLE & FINANCE" wraps to 2 lines at
                                intermediate sidebar widths, making the h3 taller and
                                pushing every icon below it down during the transition.
                            */}
                            <h3
                                className={cn(
                                    // Explicit 10px — pins to pre-Tailwind-v4-migration size
                                    // (text-micro was 10px in the old tailwind.config.ts; now 11px in v4 @theme)
                                    // leading-none removes extra line-height padding for a tight, compact look
                                    'text-[10px] leading-none px-4 font-bold tracking-[-0.04em] text-gray-400 uppercase',
                                    // Prevent wrapping at any sidebar width during transition
                                    'whitespace-nowrap overflow-hidden',
                                    // Fade only — height stays constant in both states
                                    // 150ms so labels fully disappear before sidebar finishes collapsing
                                    'transition-[opacity] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                                    isCollapsed ? 'opacity-0 select-none pointer-events-none' : 'opacity-100'
                                )}
                            >
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
                                            title={isCollapsed ? item.label : undefined}
                                            className={cn(
                                                // Fixed padding — icon is ALWAYS anchored at px-4 from left
                                                // This is what keeps icon X/Y stable during transition
                                                'group flex items-center px-4 py-2.5 rounded-xl',
                                                'transition-colors duration-200 ease-in-out',
                                                isActive
                                                    ? 'bg-gray-100 text-black'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                            )}
                                        >
                                            {/* Icon — never moves */}
                                            <Icon
                                                className={cn(
                                                    'h-[22px] w-[22px] shrink-0 transition-colors duration-200',
                                                    isActive
                                                        ? 'text-black'
                                                        : 'text-gray-400 group-hover:text-black'
                                                )}
                                                strokeWidth={isActive ? 2 : 1.5}
                                            />

                                            {/*
                                                Label — width+opacity collapse.
                                                margin-left is on the span so gap disappears with text.
                                                overflow-hidden clips during collapse cleanly.
                                            */}
                                            <span
                                                className={cn(
                                                    'block overflow-hidden whitespace-nowrap',
                                                    // 180ms — slightly faster than sidebar width so text is gone first
                                                    'transition-[max-width,opacity,margin-left] duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                                                    'text-sm tracking-[-0.04em]',
                                                    isActive
                                                        ? 'font-semibold text-black'
                                                        : 'font-medium text-gray-500 group-hover:text-black',
                                                    isCollapsed
                                                        ? 'max-w-0 opacity-0 ml-0'
                                                        : 'max-w-[180px] opacity-100 ml-3'
                                                )}
                                                aria-hidden={isCollapsed}
                                            >
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* ── Bottom section ── */}
            <div className="mt-auto space-y-1 border-t border-[#F1F1F1] pt-6">
                {BOTTOM_LINKS.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        title={isCollapsed ? link.label : undefined}
                        className={cn(
                            'group flex items-center px-4 py-2.5 rounded-xl',
                            'transition-colors duration-200 hover:bg-gray-50',
                            pathname === link.href ? 'bg-gray-100 text-black' : 'text-gray-500'
                        )}
                    >
                        <link.icon
                            className={cn(
                                'h-[22px] w-[22px] shrink-0 transition-colors duration-200',
                                pathname === link.href
                                    ? 'text-black'
                                    : 'text-gray-400 group-hover:text-black'
                            )}
                            strokeWidth={pathname === link.href ? 2 : 1.5}
                        />
                        <span
                            className={cn(
                                'block overflow-hidden whitespace-nowrap',
                                'transition-[max-width,opacity,margin-left] duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                                'text-sm font-medium tracking-[-0.04em]',
                                pathname === link.href
                                    ? 'font-semibold text-black'
                                    : 'text-gray-500 group-hover:text-black',
                                isCollapsed
                                    ? 'max-w-0 opacity-0 ml-0'
                                    : 'max-w-[180px] opacity-100 ml-3'
                            )}
                            aria-hidden={isCollapsed}
                        >
                            {link.label}
                        </span>
                    </Link>
                ))}

                {/* Logout */}
                <button
                    className={cn(
                        'group flex w-full items-center px-4 py-2.5 rounded-xl text-left',
                        'transition-colors duration-200 hover:bg-red-50'
                    )}
                    title={isCollapsed ? 'Logout' : undefined}
                    onClick={() => {
                        window.location.href = '/auth/login';
                    }}
                >
                    <User
                        className="h-[22px] w-[22px] shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-red-400"
                        strokeWidth={1.5}
                    />
                    <span
                        className={cn(
                            'block overflow-hidden whitespace-nowrap',
                            'transition-[max-width,opacity,margin-left] duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                            'text-sm font-medium tracking-[-0.04em] text-gray-500 group-hover:text-red-500',
                            isCollapsed
                                ? 'max-w-0 opacity-0 ml-0'
                                : 'max-w-[180px] opacity-100 ml-3'
                        )}
                        aria-hidden={isCollapsed}
                    >
                        Logout
                    </span>
                    {/* Logout arrow — fades with label */}
                    <LogOut
                        className={cn(
                            'h-[22px] w-[22px] shrink-0 text-red-500',
                            'transition-[opacity,max-width,margin-left] duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                            isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[22px] opacity-100 ml-auto'
                        )}
                        strokeWidth={1.5}
                    />
                </button>
            </div>
        </aside>
    );
}
