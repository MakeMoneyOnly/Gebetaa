'use client';

import React, { useState } from 'react';
import {
    Banknote,
    Bell,
    BookOpen,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Flame,
    Gift,
    Inbox,
    KeyRound,
    MessageSquare,
    PauseCircle,
    Pencil,
    Percent,
    Plus,
    Printer,
    RotateCcw,
    Search,
    Send,
    Split,
    Trash2,
    User,
    UserPlus,
    Users,
    X,
    CheckCircle2,
    ArrowRight,
    QrCode,
    Scan,
    Coins,
    Receipt,
    Handshake,
    ArrowLeftRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function WaiterPosPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFireMenu, setShowFireMenu] = useState(false);
    const [showSplitPayment, setShowSplitPayment] = useState(false);
    const [payFlow, setPayFlow] = useState<
        'MODE_SELECT' | 'SINGLE_QR' | 'SPLIT_AVATARS' | 'SPLIT_QR'
    >('MODE_SELECT');
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [activeGuestId, setActiveGuestId] = useState(1);
    const [guestList, setGuestList] = useState([
        { id: 1, name: 'Guest 1', color: 'bg-blue-100', paid: false },
        { id: 2, name: 'Guest 2', color: 'bg-emerald-100', paid: false },
    ]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#fbfbfb] text-[#000000] antialiased">
            {/* Main Wrapper */}
            <main className="flex min-w-0 flex-1 flex-col bg-[#fbfbfb]">
                {/* Top Bar */}
                <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-[#F1F1F1] bg-white px-8">
                    {/* Left Header */}
                    <div className="flex items-center gap-6">
                        <div className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 transition-colors hover:bg-gray-100">
                            <img
                                src="https://i.pravatar.cc/150?img=33"
                                alt="Store"
                                className="h-7 w-7 rounded-full object-cover"
                            />
                            <span className="text-sm font-semibold">Hadid's Food</span>
                        </div>

                        <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-sm transition-all hover:shadow-md">
                            <span className="text-sm font-semibold text-[#000000]">Open</span>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Right Header */}
                    <div className="flex items-center gap-6">
                        <div className="flex h-11 items-center gap-2.5 rounded-xl bg-gray-50 px-4 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                                Wednesday, 27 Mar 2024 at 9:48 AM.
                            </span>
                        </div>

                        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-all hover:shadow-md">
                            <Inbox className="h-4 w-4" />
                        </button>

                        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-all hover:shadow-md">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        </button>

                        <div className="flex h-11 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 shadow-sm transition-all hover:shadow-md">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold text-[#000000]">
                                Michael Olise
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="relative flex flex-1 overflow-hidden">
                    {/* Menu Grid Section */}
                    <div className="no-scrollbar relative flex flex-1 flex-col gap-6 overflow-y-auto p-8">
                        {/* Filters & Search - Operational Layout */}
                        <div className="flex flex-col gap-5">
                            {/* Line 1: Title & Filter Categories */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-[#000000]">
                                    <BookOpen className="h-5 w-5" />
                                    <h1 className="text-xl font-bold tracking-tight">Dish Menu</h1>
                                </div>

                                <div className="hidden h-6 w-px bg-[#F1F1F1] md:block"></div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-gray-600 shadow-sm transition-all active:shadow-md">
                                        <span className="text-[13px] font-bold">All</span>
                                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                            43
                                        </span>
                                    </button>
                                    <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-gray-600 shadow-sm transition-all active:shadow-md">
                                        <span className="text-[13px] font-bold">Beverages</span>
                                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                            11
                                        </span>
                                    </button>
                                    <button className="bg-brand-accent flex h-11 items-center gap-2 rounded-xl px-4 text-black shadow-md transition-all active:translate-y-0">
                                        <span className="text-[13px] font-bold">Main Course</span>
                                        <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-black">
                                            16
                                        </span>
                                    </button>
                                    <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-gray-600 shadow-sm transition-all active:shadow-md">
                                        <span className="text-[13px] font-bold">Dessert</span>
                                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                            8
                                        </span>
                                    </button>
                                    <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-gray-600 shadow-sm transition-all active:shadow-md">
                                        <span className="text-[13px] font-bold">Appetizer</span>
                                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                            8
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Line 2: Refresh & Search Bar (Full Width) */}
                            <div className="flex items-center gap-3">
                                <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 whitespace-nowrap text-[#000000] shadow-sm transition-all active:shadow-md">
                                    <RotateCcw className="h-4 w-4" />
                                    <span className="text-[13px] font-bold">Refresh</span>
                                </button>
                                <div className="group relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Search Menu..."
                                        className="h-11 w-full rounded-xl bg-white pr-4 pl-10 text-sm font-semibold shadow-sm transition-all placeholder:text-gray-400 focus:ring-1 focus:ring-black/10 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cards Grid - 5 cards per row, optimized for tablet touch */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {/* Card 1 */}
                            <div className="group active:border-brand-accent/50 relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200">
                                <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                    <img
                                        src="https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&amp;fit=crop&amp;q=80&amp;w=600"
                                        alt="Butter Chicken"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between pt-0.5">
                                        <h3 className="text-body truncate pr-1 leading-tight font-bold text-[#000000]">
                                            Butter Chicken
                                        </h3>
                                        <span className="shrink-0 text-[13px] font-bold text-[#000000]">
                                            450 Br.
                                        </span>
                                    </div>
                                    <button className="bg-brand-accent mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-black shadow-sm transition-all duration-200 active:brightness-105">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>

                            {/* Card 2 (In Cart) */}
                            <div className="group ring-brand-accent/30 active:ring-brand-accent/60 relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 transition-all duration-200">
                                <div className="bg-brand-accent absolute top-2 left-2 z-10 flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold text-black shadow-sm">
                                    x1 in Cart
                                </div>
                                <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                    <img
                                        src="https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&amp;fit=crop&amp;q=80&amp;w=600"
                                        alt="French Fries"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between pt-0.5">
                                        <h3 className="text-body truncate pr-1 leading-tight font-bold text-[#000000]">
                                            French Fries
                                        </h3>
                                        <span className="shrink-0 text-[13px] font-bold text-[#000000]">
                                            120 Br.
                                        </span>
                                    </div>
                                    <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-[13px] font-bold text-[#000000] transition-all duration-200 active:bg-gray-100">
                                        Add More ( 1 )
                                    </button>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="group active:border-brand-accent/50 relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-200">
                                <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                    <img
                                        src="https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&amp;fit=crop&amp;q=80&amp;w=600"
                                        alt="Roast Beef"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between pt-0.5">
                                        <h3 className="text-body truncate pr-1 leading-tight font-bold text-[#000000]">
                                            Roast Beef
                                        </h3>
                                        <span className="shrink-0 text-[13px] font-bold text-[#000000]">
                                            950 Br.
                                        </span>
                                    </div>
                                    <button className="bg-brand-accent mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-black shadow-sm transition-all duration-200 active:brightness-105">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>

                            {/* Card 4 */}
                            <div className="group active:border-brand-accent/50 relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200">
                                <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                    <img
                                        src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&amp;fit=crop&amp;q=80&amp;w=600"
                                        alt="Sauerkraut"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between pt-0.5">
                                        <h3 className="text-body truncate pr-1 leading-tight font-bold text-[#000000]">
                                            Sauerkraut
                                        </h3>
                                        <span className="shrink-0 text-[13px] font-bold text-[#000000]">
                                            220 Br.
                                        </span>
                                    </div>
                                    <button className="bg-brand-accent mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-black shadow-sm transition-all duration-200 active:brightness-105">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>

                            {/* Card 5 (Unavailable) */}
                            <div className="group relative flex cursor-not-allowed flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white opacity-[0.85] shadow-sm grayscale-[20%] transition-all duration-200">
                                <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                    <img
                                        src="https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&amp;fit=crop&amp;q=80&amp;w=600"
                                        alt="Beef Kebab"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between pt-0.5">
                                        <h3 className="text-body truncate pr-1 leading-tight font-bold text-gray-700">
                                            Beef Kebab
                                        </h3>
                                        <span className="shrink-0 text-[13px] font-bold text-gray-500 line-through">
                                            480 Br.
                                        </span>
                                    </div>
                                    <button className="mt-1 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 py-2.5 text-[13px] font-bold text-gray-500">
                                        <X className="h-3.5 w-3.5" />
                                        Not Available
                                    </button>
                                </div>
                            </div>

                            {/* Card 6 */}
                            <div className="group active:border-brand-accent/50 relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200">
                                <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                    <img
                                        src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg"
                                        alt="Fish and Chips"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between pt-0.5">
                                        <h3 className="text-body truncate pr-1 leading-tight font-bold text-[#000000]">
                                            Fish and Chips
                                        </h3>
                                        <span className="shrink-0 text-[13px] font-bold text-[#000000]">
                                            520 Br.
                                        </span>
                                    </div>
                                    <button className="bg-brand-accent mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-black shadow-sm transition-all duration-200 active:brightness-105">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Visual Tint Overlay for Payment Mode */}
                        {showSplitPayment && (
                            <div
                                className="animate-in fade-in absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-12 backdrop-blur-sm duration-500"
                                onClick={() => setShowSplitPayment(false)}
                            >
                                <div
                                    className="animate-in zoom-in-95 flex flex-col items-center gap-12 rounded-xl bg-white p-14 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] duration-500"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="rounded-xl bg-gray-50 p-8 shadow-inner">
                                        <QRCodeSVG
                                            value="https://gebeta.app/pay/B12309"
                                            size={320}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 text-center">
                                        <h3 className="text-3xl font-black tracking-tighter text-black uppercase">
                                            Scan to Pay
                                        </h3>
                                        <p className="px-4 text-xl font-bold text-gray-500">
                                            Order #B12309 •{' '}
                                            <span className="text-black">2,322.00 Br.</span>
                                        </p>
                                    </div>

                                    <div className="h-px w-full bg-gray-100" />

                                    <div className="flex items-center gap-4">
                                        <div className="bg-brand-accent/20 flex h-12 w-12 items-center justify-center rounded-xl">
                                            <QrCode className="h-6 w-6 text-black" />
                                        </div>
                                        <span className="text-base font-bold text-gray-400">
                                            Merchant POS ID: #GP-882
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Order Summary */}
                    <aside className="z-10 flex w-[450px] shrink-0 flex-col border-l border-[#F1F1F1] bg-white shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.05)]">
                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between bg-white px-6 py-7">
                            <h2 className="text-xl font-bold tracking-tight text-[#000000]">
                                Order Summary
                            </h2>
                            <span className="text-sm font-semibold text-gray-500">#B12309</span>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-3 border-b border-[#F1F1F1] px-6 pb-4">
                            <div className="text-body-sm flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-gray-200">
                                <span className="font-semibold text-gray-600">Order Type</span>
                                <div className="flex items-center gap-2 font-bold text-[#000000]">
                                    Dine-in
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            <div className="text-body-sm flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-gray-200">
                                <span className="font-semibold text-gray-600">Select Table</span>
                                <div className="flex items-center gap-2 font-bold text-[#000000]">
                                    A-12B
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Order Items - Grouped by Course */}
                        <div className="no-scrollbar bg-surface-50 flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-2">
                            {/* Section: Drinks */}
                            <div className="flex flex-col gap-4 pt-4">
                                <div className="flex items-center">
                                    <h3 className="text-base leading-tight font-bold text-[#000000]">
                                        Drinks
                                    </h3>
                                </div>
                                <div className="flex flex-col gap-6">
                                    {/* Item 1 */}
                                    <div className="group relative flex cursor-pointer items-start gap-4 border-b border-gray-100/50 pb-6 last:border-0">
                                        <div className="relative">
                                            <img
                                                src="https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&amp;fit=crop&amp;q=80&amp;w=200"
                                                alt="French Fries"
                                                className="h-[60px] w-[60px] shrink-0 rounded-[1rem] object-cover shadow-sm"
                                            />
                                            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-black text-[10px] font-bold text-white shadow-sm">
                                                1
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col py-0.5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base leading-tight font-bold text-[#000000]">
                                                    Iced Tea
                                                </h4>
                                                <span className="text-sm font-semibold text-gray-400">
                                                    x1
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-col gap-1">
                                                <p className="text-caption flex items-center gap-1.5 leading-tight font-semibold text-gray-500">
                                                    <MessageSquare className="h-3 w-3 text-gray-400" />
                                                    Notes: None
                                                </p>
                                                <p className="text-caption leading-tight font-semibold text-gray-400">
                                                    Size: None
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-2 flex shrink-0 flex-col items-end gap-3 pt-0.5">
                                            <div className="text-body font-bold text-[#000000]">
                                                120.00 Br.
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <button
                                                    className="text-gray-400 transition-colors active:text-black"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="text-gray-400 transition-colors active:text-red-500"
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Food */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center">
                                    <h3 className="text-base leading-tight font-bold text-[#000000]">
                                        Food
                                    </h3>
                                </div>
                                <div className="flex flex-col gap-6">
                                    {/* Item 2 */}
                                    <div className="group relative flex cursor-pointer items-start gap-4 border-b border-gray-100/50 pb-6 last:border-0">
                                        <div className="relative">
                                            <img
                                                src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&amp;fit=crop&amp;q=80&amp;w=200"
                                                alt="Wagyu Steak"
                                                className="h-[60px] w-[60px] shrink-0 rounded-[1rem] object-cover shadow-sm"
                                            />
                                            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-black text-[10px] font-bold text-white shadow-sm">
                                                2
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col py-0.5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base leading-tight font-bold text-[#000000]">
                                                    Wagyu Steak
                                                </h4>
                                                <span className="text-sm font-semibold text-gray-400">
                                                    x1
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-col gap-1">
                                                <p className="text-caption flex items-center gap-1.5 leading-tight font-bold text-red-600">
                                                    <MessageSquare className="h-3 w-3" />
                                                    Notes: ALLERGY - Peanuts
                                                </p>
                                                <p className="text-caption leading-tight font-semibold text-gray-400">
                                                    Size: Small
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-2 flex shrink-0 flex-col items-end gap-3 pt-0.5">
                                            <div className="text-body font-bold text-[#000000]">
                                                1,450.00 Br.
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <button
                                                    className="text-gray-400 transition-colors active:text-black"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="text-gray-400 transition-colors active:text-red-500"
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item 3 */}
                                    <div className="group relative flex cursor-pointer items-start gap-4 pb-4 last:border-0">
                                        <div className="relative">
                                            <img
                                                src="https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&amp;fit=crop&amp;q=80&amp;w=200"
                                                alt="Chicken Ramen"
                                                className="h-[60px] w-[60px] shrink-0 rounded-[1rem] object-cover shadow-sm"
                                            />
                                            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-black text-[10px] font-bold text-white shadow-sm">
                                                1
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col py-0.5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base leading-tight font-bold text-[#000000]">
                                                    Chicken Ramen
                                                </h4>
                                                <span className="text-sm font-semibold text-gray-400">
                                                    x1
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-col gap-1">
                                                <p className="text-caption flex items-center gap-1.5 leading-tight font-bold text-red-600">
                                                    <MessageSquare className="h-3 w-3" />
                                                    Notes: NO Green Onions
                                                </p>
                                                <p className="text-caption leading-tight font-semibold text-gray-400">
                                                    Size: Medium
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-2 flex shrink-0 flex-col items-end gap-3 pt-0.5">
                                            <div className="text-body font-bold text-[#000000]">
                                                580.00 Br.
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <button
                                                    className="text-gray-400 transition-colors active:text-black"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="text-gray-400 transition-colors active:text-red-500"
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Summary Area */}
                        <div className="z-10 mt-auto box-border flex w-full flex-col gap-4 border-t border-[#F1F1F1] bg-white p-6">
                            {/* Operational Flags: Hold, Stay, Send */}
                            <div className="mb-2 grid grid-cols-3 gap-2">
                                <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-100 transition-all active:bg-gray-200">
                                    <PauseCircle className="h-5 w-5 text-red-500" />
                                    <span className="text-[13px] font-bold text-gray-900">
                                        Hold
                                    </span>
                                </button>
                                <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-100 transition-all active:bg-gray-200">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    <span className="text-[13px] font-bold text-gray-900">
                                        Stay
                                    </span>
                                </button>
                                <div className="relative">
                                    {showFireMenu && (
                                        <div className="animate-in slide-in-from-bottom-3 absolute right-0 bottom-full left-0 z-50 mb-4 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl duration-300">
                                            <div className="p-1">
                                                <button
                                                    onClick={() => setShowFireMenu(false)}
                                                    className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-[13px] font-bold text-gray-900 transition-colors hover:bg-black/5"
                                                >
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                                                        <Flame className="h-4 w-4 fill-orange-600/10 text-orange-600" />
                                                    </div>
                                                    Fire All
                                                </button>
                                                <button
                                                    onClick={() => setShowFireMenu(false)}
                                                    className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-[13px] font-bold text-gray-900 transition-colors hover:bg-black/5"
                                                >
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                                                        <Flame className="h-4 w-4 fill-orange-600/10 text-orange-600" />
                                                    </div>
                                                    Fire Foods
                                                </button>
                                                <button
                                                    onClick={() => setShowFireMenu(false)}
                                                    className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-[13px] font-bold text-gray-900 transition-colors hover:bg-black/5"
                                                >
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                                                        <Flame className="h-4 w-4 fill-orange-600/10 text-orange-600" />
                                                    </div>
                                                    Fire Drinks
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setShowFireMenu(!showFireMenu)}
                                        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 ${showFireMenu ? 'bg-black text-white shadow-lg ring-2 ring-black/10' : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200/80'}`}
                                    >
                                        <Send
                                            className={`h-4 w-4 ${showFireMenu ? 'text-white' : 'text-amber-600'}`}
                                        />
                                        <span className="text-[13px]">Send</span>
                                    </button>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex flex-col gap-3">
                                <div className="text-body flex items-center justify-between">
                                    <span className="font-semibold text-gray-600">Subtotal</span>
                                    <span className="font-bold text-[#000000]">2,150.00 Br.</span>
                                </div>
                                <div className="text-body flex items-center justify-between">
                                    <span className="font-semibold text-gray-600">Taxes</span>
                                    <span className="font-bold text-[#000000]">322.00 Br.</span>
                                </div>
                                <div className="text-body flex items-center justify-between">
                                    <span className="font-semibold text-gray-600">Discount</span>
                                    <span className="font-bold text-emerald-600">-150.00 Br.</span>
                                </div>
                            </div>

                            {/* Action Buttons: Discount and Pay */}
                            <div className="mt-3 flex w-full gap-3">
                                <button className="text-body-sm h-14 flex-1 rounded-xl border-2 border-gray-200 font-bold text-gray-700 transition-all duration-300 active:bg-gray-50">
                                    Discount
                                </button>
                                <button
                                    onClick={() => setShowSplitPayment(true)}
                                    className="bg-brand-accent text-body-sm h-14 flex-1 rounded-xl font-bold text-black shadow-sm transition-all duration-200 active:brightness-105"
                                >
                                    Pay 2,322.00 Br.
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Premium Minimalist Success View */}
            {paymentStatus === 'PAID' && (
                <div className="animate-in fade-in fixed inset-0 z-[200] flex items-center justify-center duration-700">
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />

                    <div className="animate-in zoom-in-95 relative flex w-full max-w-lg flex-col items-center gap-12 duration-500">
                        {/* Aesthetic Checkmark Container */}
                        <div className="relative">
                            <div className="animate-in zoom-in-50 flex h-64 w-64 items-center justify-center rounded-[60px] bg-emerald-50 delay-100 duration-700">
                                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-emerald-100 ring-[24px] ring-emerald-50">
                                    <CheckCircle2
                                        className="animate-in slide-in-from-bottom-4 h-20 w-20 text-emerald-600 delay-300 duration-500"
                                        strokeWidth={3}
                                    />
                                </div>
                            </div>
                            {/* Accent particles or subtle glow can be added here */}
                        </div>

                        <div className="flex flex-col items-center gap-4 text-center">
                            <h2 className="text-5xl font-black tracking-tighter text-black">
                                Transaction Complete
                            </h2>
                            <p className="text-lg font-bold text-gray-500">
                                Order #B12309 has been marked as fully paid.
                            </p>
                        </div>

                        <div className="mt-4 grid w-full grid-cols-2 gap-4 px-6">
                            <button className="flex h-20 items-center justify-center gap-3 rounded-[30px] bg-black text-lg font-bold text-white shadow-2xl transition-all hover:bg-gray-900 active:scale-95">
                                <Printer className="text-brand-accent h-6 w-6" />
                                <span>Print Receipt</span>
                            </button>
                            <button
                                onClick={() => setPaymentStatus('PENDING')}
                                className="flex h-20 items-center justify-center rounded-[30px] bg-gray-100 text-lg font-bold text-black transition-all hover:bg-gray-200 active:scale-95"
                            >
                                Close POS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
