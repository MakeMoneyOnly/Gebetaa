'use client';

import React from 'react';
import { Printer, Tablet, Monitor, Plus, Settings2, Signal, WifiOff, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DevicesTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 pb-12 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Devices & Hardware</h2>
                    <p className="text-sm text-gray-500">
                        Manage Pos terminals, Kds screens, and network printers.
                    </p>
                </div>
            </div>

            {/* Hardware Status High-level */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                    {
                        label: 'Pos Terminals',
                        count: 4,
                        active: 3,
                        icon: Tablet,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                    },
                    {
                        label: 'Kds Screens',
                        count: 2,
                        active: 2,
                        icon: Monitor,
                        color: 'text-brand-accent-text',
                        bg: 'bg-brand-accent/30',
                    },
                    {
                        label: 'Receipt Printers',
                        count: 3,
                        active: 2,
                        icon: Printer,
                        color: 'text-black',
                        bg: 'bg-[#DDF853] text-black',
                    },
                ].map((hardware, i) => (
                    <div key={i} className="rounded-4xl border-b border-gray-100 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-xl',
                                    hardware.bg
                                )}
                            >
                                <hardware.icon className={cn('h-5 w-5', hardware.color)} />
                            </div>
                            <span
                                className={cn(
                                    'flex items-center gap-1.5 text-[10px] font-bold',
                                    hardware.active === hardware.count
                                        ? 'text-green-600'
                                        : 'text-amber-600'
                                )}
                            >
                                <div
                                    className={cn(
                                        'h-1.5 w-1.5 rounded-full',
                                        hardware.active === hardware.count
                                            ? 'bg-green-600'
                                            : 'bg-amber-600'
                                    )}
                                />
                                {hardware.active}/{hardware.count} Online
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">{hardware.label}</p>
                            <p className="text-xl font-bold text-gray-900">
                                {hardware.count} Devices Linked
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pos Terminals Section */}
            <div className="rounded-4xl border-b border-gray-100 bg-white p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <Tablet className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Pos Terminals</h3>
                    </div>
                    <button className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95">
                        <Plus className="h-4 w-4" />
                        Provision New Device
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                        {
                            name: 'Front Counter - 01',
                            type: 'Android Tablet',
                            rev: 'Main Dining',
                            status: 'Online',
                        },
                        { name: 'Bar Station', type: 'iPad Mini', rev: 'Bar', status: 'Online' },
                        {
                            name: 'Mobile Handheld 1',
                            type: 'Android Handheld',
                            rev: 'Patio',
                            status: 'Offline',
                        },
                        {
                            name: 'Expeditor Tablet',
                            type: 'Android Tablet',
                            rev: 'Kitchen',
                            status: 'Online',
                        },
                    ].map((pos, i) => (
                        <div
                            key={i}
                            className="relative flex items-center gap-4 rounded-xl border border-gray-50 bg-gray-50/20 px-6 py-5 transition-all hover:bg-gray-50"
                        >
                            <div
                                className={cn(
                                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-100',
                                    pos.status === 'Online' ? 'text-blue-500' : 'text-gray-300'
                                )}
                            >
                                {pos.status === 'Online' ? (
                                    <Signal className="h-6 w-6" />
                                ) : (
                                    <WifiOff className="h-6 w-6" />
                                )}
                            </div>
                            <div className="flex flex-1 flex-col truncate">
                                <div className="flex items-center gap-2">
                                    <h4 className="truncate text-sm font-bold text-gray-900">
                                        {pos.name}
                                    </h4>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[9px] font-medium',
                                            pos.status === 'Online'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-red-50 text-red-600'
                                        )}
                                    >
                                        {pos.status}
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium text-gray-500">
                                    {pos.type} • {pos.rev}
                                </p>
                            </div>
                            <button className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white hover:text-black">
                                <Settings2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Network Printers Section */}
            <div className="rounded-4xl border-b border-gray-100 bg-white p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <Printer className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Network Printers</h3>
                    </div>
                    <button className="text-[11px] font-bold text-blue-600 transition-colors hover:text-blue-700">
                        Test All Printers
                    </button>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            name: 'Clover Receipt Printer',
                            ip: '192.168.1.104',
                            assign: 'Customer Receipts',
                            type: 'Network (Lan)',
                        },
                        {
                            name: 'Kitchen Ticket Printer',
                            ip: '192.168.1.105',
                            assign: 'Prep Tickets',
                            type: 'Network (Lan)',
                        },
                    ].map((printer, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/20 px-6 py-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DDF853] text-black ring-1 ring-gray-100">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {printer.name}
                                        </h4>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                                            {printer.type}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-500">
                                        {printer.ip} •{' '}
                                        <span className="font-bold text-blue-600">
                                            {printer.assign}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="hover: rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-900 transition-all active:scale-95">
                                    Print Test
                                </button>
                                <button className="rounded-lg border border-gray-100 bg-white p-2 text-gray-400 transition-all hover:text-black">
                                    <Settings2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
