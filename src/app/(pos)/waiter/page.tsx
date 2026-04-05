'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    Banknote,
    Bell,
    BookOpen,
    Calendar,
    ChevronDown,
    Clock,
    Flame,
    Inbox,
    MessageSquare,
    PauseCircle,
    Pencil,
    Plus,
    Printer,
    RotateCcw,
    Search,
    Send,
    Trash2,
    User,
    Sun,
    Moon,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useManagedDeviceSession } from '@/hooks/useManagedDeviceSession';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

import { useCart, type CartItem } from '@/context/CartContext';

type RestaurantData = Database['public']['Tables']['restaurants']['Row'];
type CategoryData = Database['public']['Tables']['categories']['Row'];
type MenuItemData = Database['public']['Tables']['menu_items']['Row'];

export default function WaiterPosPage() {
    const router = useRouter();
    const managedDevice = useManagedDeviceSession({
        route: '/waiter',
        expectedProfiles: ['waiter'],
    });

    const [staffSession, setStaffSession] = useState<{ id: string; name: string; role: string; user_id: string } | null>(null);
    const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
    const headerDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target as Node)) {
                setIsHeaderDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Enforce Staff PIN Session Guard
    useEffect(() => {
        const ctxStr = sessionStorage.getItem('gebata_waiter_context');
        if (ctxStr) {
            try {
                setStaffSession(JSON.parse(ctxStr));
            } catch (e) {
                console.error('Invalid staff session structure, requiring PIN relogin.', e);
                router.replace(`/waiter/pin?restaurantId=${managedDevice.session?.restaurant_id || ''}`);
            }
        } else if (managedDevice.session?.restaurant_id) {
            // Once device knows the restaurant but no staff session exists, lock the terminal.
            router.replace(`/waiter/pin?restaurantId=${managedDevice.session.restaurant_id}`);
        }
    }, [router, managedDevice.session?.restaurant_id]);

    const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);

    // Menu Data State
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
    const [tables, setTables] = useState<Database['public']['Tables']['tables']['Row'][]>([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(false);

    const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway' | 'Delivery'>('Dine-in');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
    const [showTableDropdown, setShowTableDropdown] = useState(false);

    const cart = useCart();

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch restaurant and menu data when session is available
    useEffect(() => {
        const restaurantId = managedDevice.session?.restaurant_id;
        if (!restaurantId) return;

        async function fetchData() {
            setIsLoadingRestaurant(true);
            setIsLoadingMenu(true);
            try {
                const supabase = getSupabaseClient();

                // 1. Fetch Restaurant
                const { data: restData, error: restError } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', restaurantId as string)
                    .single();

                if (restData && !restError) {
                    setRestaurant(restData);
                }

                // 2. Fetch Categories
                const { data: catsData, error: catsError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('restaurant_id', restaurantId as string)
                    .order('order_index', { ascending: true });

                if (catsData && !catsError) {
                    setCategories(catsData);

                    // 3. Fetch Items for these categories
                    if (catsData.length > 0) {
                        const { data: itemsData, error: itemsError } = await supabase
                            .from('menu_items')
                            .select('*')
                            .in(
                                'category_id',
                                catsData.map(c => c.id)
                            );

                        if (itemsData && !itemsError) {
                            setMenuItems(itemsData);
                        }
                    }

                    // 4. Fetch Tables
                    const { data: tablesData, error: tablesError } = await supabase
                        .from('tables')
                        .select('*')
                        .eq('restaurant_id', restaurantId as string);

                    if (tablesData && !tablesError) {
                        setTables(tablesData);
                        if (tablesData.length > 0 && !selectedTableId) {
                            setSelectedTableId(tablesData[0].id);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching data for POS:', err);
            } finally {
                setIsLoadingRestaurant(false);
                setIsLoadingMenu(false);
            }
        }

        void fetchData();
    }, [managedDevice.session?.restaurant_id]);

    const formattedDate = useMemo(() => {
        return format(currentTime, "EEEE, d MMM yyyy 'at' p.");
    }, [currentTime]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showFireMenu, setShowFireMenu] = useState(false);
    const [showSplitPayment, setShowSplitPayment] = useState(false);
    const [_payFlow, _setPayFlow] = useState<
        'MODE_SELECT' | 'SINGLE_QR' | 'SPLIT_AVATARS' | 'SPLIT_QR'
    >('MODE_SELECT');
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
    const [_isGuestMode, _setIsGuestMode] = useState(false);
    const [activeGuestId, setActiveGuestId] = useState(1);
    const [_guestList, _setGuestList] = useState([
        { id: 1, name: 'Guest 1', color: 'bg-blue-100', paid: false },
        { id: 2, name: 'Guest 2', color: 'bg-emerald-100', paid: false },
    ]);
    const [splitMode, setSplitMode] = useState<'full' | 'split'>('full');
    const [splitCount, setSplitCount] = useState(2);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesCategory =
                selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menuItems, selectedCategoryId, searchTerm]);

    const groupedCartItems = useMemo(() => {
        const groups: Record<string, CartItem[]> = {};
        cart.items.forEach(item => {
            const course = item.course || 'Food';
            if (!groups[course]) groups[course] = [];
            groups[course].push(item);
        });
        return groups;
    }, [cart.items]);

    const totalWithTax = cart.total * 1.15;

    if (managedDevice.hasProfileMismatch) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-red-300" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        Wrong device role
                    </h1>
                    <p className="mt-2 text-[15px] text-gray-600">
                        This tablet is paired for a different workspace. Re-provision it as a waiter
                        device to keep the tableside flow on this screen.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#fbfbfb] text-[#000000] antialiased">
            {/* Main Wrapper */}
            <main className="flex min-w-0 flex-1 flex-col bg-[#fbfbfb]">
                {/* Top Bar */}
                <header className="z-40 flex h-20 shrink-0 items-center justify-between border-b border-[#F1F1F1] bg-white px-8 relative">
                    {/* Left Header */}
                    <div className="flex items-center gap-6">
                        <div className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 transition-colors hover:bg-gray-100">
                            {restaurant?.logo_url ? (
                                <Image
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
                                    {restaurant?.name?.charAt(0) || 'R'}
                                </div>
                            )}
                            <span className="text-sm font-semibold">
                                {isLoadingRestaurant
                                    ? 'Loading...'
                                    : restaurant?.name || "Hadid's Food"}
                            </span>
                        </div>

                        <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-sm transition-all hover:shadow-md">
                            <span className="text-sm font-semibold text-[#000000]">Open</span>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Right Header */}
                    <div className="flex items-center gap-6">
                        <div className="flex h-11 items-center gap-2.5 rounded-xl bg-emerald-50 px-4 text-emerald-600">
                            <Banknote className="h-4 w-4" />
                            <span className="text-sm font-semibold">0.00 Br. Tips</span>
                        </div>

                        <div className="flex h-11 items-center gap-2.5 rounded-xl bg-gray-50 px-4 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-semibold">{formattedDate}</span>
                        </div>

                        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-all hover:shadow-md">
                            <Inbox className="h-4 w-4" />
                        </button>

                        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-all hover:shadow-md">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        </button>

                        <div className="relative" ref={headerDropdownRef}>
                            <button 
                                onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                                className="flex h-11 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 shadow-sm transition-all hover:shadow-md text-left"
                            >
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-[#000000]">
                                    {staffSession?.name || 'Waitstaff'}
                                </span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isHeaderDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isHeaderDropdownOpen && (
                                <div className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-100 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex w-full items-center justify-between px-3 py-3 mb-1">
                                        <span className="text-sm font-bold text-gray-700">Theme</span>
                                        <div className="flex items-center gap-1 rounded-lg bg-gray-50 p-1 border border-gray-100">
                                            <button className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm border border-gray-100 text-amber-500">
                                                <Sun className="h-4 w-4" />
                                            </button>
                                            <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 transition-colors">
                                                <Moon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="border-b border-gray-50"></div>
                                    <button 
                                        onClick={() => {
                                            sessionStorage.removeItem('gebata_waiter_context');
                                            setIsHeaderDropdownOpen(false);
                                            router.replace(`/waiter/pin?restaurantId=${managedDevice.session?.restaurant_id || ''}`);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-lg mt-1 px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="relative flex flex-1 overflow-hidden">
                    {/* Menu Grid Section */}
                    <div className="relative flex flex-1 flex-col gap-6 overflow-y-auto p-8">
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
                                    <button
                                        onClick={() => setSelectedCategoryId('all')}
                                        className={`flex h-11 items-center gap-2 rounded-xl px-4 transition-all active:shadow-md ${selectedCategoryId === 'all' ? 'bg-brand-accent text-black shadow-md' : 'bg-white text-gray-600 shadow-sm'}`}
                                    >
                                        <span className="text-[13px] font-bold">All</span>
                                        <span
                                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${selectedCategoryId === 'all' ? 'bg-black/10 text-black' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {menuItems.length}
                                        </span>
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`flex h-11 items-center gap-2 rounded-xl px-4 transition-all active:shadow-md ${selectedCategoryId === cat.id ? 'bg-brand-accent text-black shadow-md' : 'bg-white text-gray-600 shadow-sm'}`}
                                        >
                                            <span className="text-[13px] font-bold">
                                                {cat.name}
                                            </span>
                                            <span
                                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${selectedCategoryId === cat.id ? 'bg-black/10 text-black' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {
                                                    menuItems.filter(i => i.category_id === cat.id)
                                                        .length
                                                }
                                            </span>
                                        </button>
                                    ))}
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
                            {isLoadingMenu ? (
                                <div className="col-span-full flex h-64 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="col-span-full flex h-64 flex-col items-center justify-center gap-2 text-center text-gray-400">
                                    <Inbox className="h-12 w-12" />
                                    <p className="font-bold">No dishes found</p>
                                </div>
                            ) : (
                                filteredItems.map(item => {
                                    const inCart = cart.items.find(i => i.menuItemId === item.id);
                                    const quantity = inCart?.quantity || 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200 ${quantity > 0 ? 'ring-brand-accent/30 shadow-md ring-1' : 'border border-gray-100 shadow-sm'}`}
                                        >
                                            {quantity > 0 && (
                                                <div className="bg-brand-accent absolute top-2 left-2 z-10 flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold text-black shadow-sm">
                                                    x{quantity} in Cart
                                                </div>
                                            )}
                                            <div className="relative h-32 w-full shrink-0 bg-gray-50">
                                                <Image
                                                    src={
                                                        item.image_url ||
                                                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
                                                    }
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent"></div>
                                            </div>
                                            <div className="flex flex-col gap-2 p-3">
                                                <div className="flex items-start justify-between pt-0.5">
                                                    <h3 className="text-body truncate pr-1 leading-tight font-bold text-[#000000]">
                                                        {item.name}
                                                    </h3>
                                                    <span className="shrink-0 text-[13px] font-bold text-[#000000]">
                                                        {(item.price / 100).toLocaleString()} Br.
                                                    </span>
                                                </div>
                                                {!item.is_available ? (
                                                    <button className="mt-1 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 py-2.5 text-[13px] font-bold text-gray-500">
                                                        <X className="h-3.5 w-3.5" />
                                                        Not Available
                                                    </button>
                                                ) : quantity > 0 ? (
                                                    <button
                                                        onClick={() =>
                                                            cart.addToCart({
                                                                menuItemId: item.id,
                                                                title: item.name,
                                                                price: item.price / 100,
                                                                quantity: 1,
                                                                image: item.image_url || undefined,
                                                                course: item.course || 'Food',
                                                            })
                                                        }
                                                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-[13px] font-bold text-[#000000] transition-all duration-200 active:bg-gray-100"
                                                    >
                                                        Add More ( {quantity} )
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            cart.addToCart({
                                                                menuItemId: item.id,
                                                                title: item.name,
                                                                price: item.price / 100,
                                                                quantity: 1,
                                                                image: item.image_url || undefined,
                                                                course: item.course || 'Food',
                                                            })
                                                        }
                                                        className="bg-brand-accent mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-black shadow-sm transition-all duration-200 active:brightness-105"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Add to Cart
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {/* Concentrated POS Terminal (Outer card removed, layout structure restored) */}
                        {showSplitPayment && (
                            <div
                                className="animate-in fade-in absolute inset-0 z-100 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm duration-300"
                                onClick={() => setShowSplitPayment(false)}
                            >
                                {/* Layout Wrapper - Max Width stays the same but no bg card */}
                                <div
                                    className="relative flex w-full max-w-[850px] flex-col items-center justify-center overflow-visible text-black"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Central Interaction Card */}
                                    <div
                                        className={`relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-black/5 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] transition-all duration-300 ${splitMode === 'split' ? 'max-w-[760px] p-10 pt-11' : 'max-w-[640px] px-10 py-11'}`}
                                    >
                                        {/* Icon & Label */}
                                        <div className="mb-5 flex flex-col items-center gap-3 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                                                <Banknote className="h-7 w-7" />
                                            </div>
                                            <h3 className="text-2xl font-bold tracking-tight text-black/80">
                                                {splitMode === 'full'
                                                    ? 'ORDER #B12309'
                                                    : 'ORDER #B12309 | Split Payment'}
                                            </h3>
                                        </div>

                                        {/* Mode Select Tabs - Scaled & Brand Aligned */}
                                        <div
                                            className={`mb-8 flex w-full gap-1.5 rounded-[1.2rem] border border-black/3 bg-gray-50/80 p-1.5 transition-all ${splitMode === 'split' ? 'max-w-[500px]' : 'max-w-[420px]'}`}
                                        >
                                            <button
                                                onClick={() => setSplitMode('full')}
                                                className={`flex-1 rounded-[0.9rem] py-3 text-base font-bold transition-all duration-300 ${
                                                    splitMode === 'full'
                                                        ? 'bg-brand-accent text-black shadow-md'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                Pay in Full
                                            </button>
                                            <button
                                                onClick={() => setSplitMode('split')}
                                                className={`flex-1 rounded-[0.9rem] py-3 text-base font-bold transition-all duration-300 ${
                                                    splitMode === 'split'
                                                        ? 'bg-brand-accent text-black shadow-md'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                Split Bill
                                            </button>
                                        </div>

                                        {splitMode === 'full' ? (
                                            <>
                                                {/* QR Area - Compact & Refined */}
                                                <div className="mb-2 flex flex-col items-center gap-5">
                                                    <div className="relative p-1.5">
                                                        {/* Ambient Glow */}
                                                        <div className="absolute inset-0 rounded-[2rem] bg-black/3 blur-[40px]" />
                                                        <div className="relative rounded-[1.5rem] border border-black/3 bg-white p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]">
                                                            <QRCodeSVG
                                                                value={`https://gebeta.app/pay/B12309?mode=full`}
                                                                size={240}
                                                                level="H"
                                                                includeMargin={false}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-base font-semibold text-gray-400">
                                                        Scan to pay
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setPaymentStatus('PAID')}
                                                    className="mt-6 h-12 w-full max-w-[300px] rounded-[0.8rem] border border-emerald-500/20 bg-emerald-500/10 text-base font-bold text-emerald-600 transition-all hover:bg-emerald-500/20"
                                                >
                                                    Mark as Paid
                                                </button>
                                            </>
                                        ) : (
                                            <div className="mt-2 flex w-full items-stretch gap-10">
                                                {/* Left Column: Configuration */}
                                                <div className="flex flex-1 flex-col items-center justify-between border-r border-black/5 py-4 pr-10">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <span className="text-sm font-bold tracking-tight whitespace-nowrap text-gray-400">
                                                            Number of Guests
                                                        </span>

                                                        {/* Precision Stepper Controls */}
                                                        <div className="flex items-center gap-5">
                                                            <button
                                                                onClick={() => {
                                                                    const newCount = Math.max(
                                                                        2,
                                                                        splitCount - 1
                                                                    );
                                                                    setSplitCount(newCount);
                                                                    if (activeGuestId > newCount)
                                                                        setActiveGuestId(newCount);
                                                                }}
                                                                className="border-brand-accent bg-brand-accent/5 hover:bg-brand-accent/20 flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black text-black transition-all active:scale-95"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-16 text-center text-4xl font-black text-black tabular-nums">
                                                                {splitCount}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    setSplitCount(
                                                                        Math.min(12, splitCount + 1)
                                                                    )
                                                                }
                                                                className="border-brand-accent bg-brand-accent/5 hover:bg-brand-accent/20 flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black text-black transition-all active:scale-95"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setPaymentStatus('PAID')}
                                                        className="mt-8 h-14 w-full rounded-[0.8rem] border border-emerald-500/20 bg-emerald-500/10 text-base font-bold text-emerald-600 transition-all hover:bg-emerald-500/20"
                                                    >
                                                        Mark as Paid (All)
                                                    </button>
                                                </div>

                                                {/* Right Column: QR & Context */}
                                                <div className="flex flex-1 flex-col items-center">
                                                    <h4 className="mb-5 text-center text-xl font-bold tracking-tight text-black/90">
                                                        Scan for Guest {activeGuestId} <br />
                                                        <span className="text-base font-semibold text-gray-500">
                                                            (
                                                            {(2322.0 / splitCount).toLocaleString(
                                                                'en-US',
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                }
                                                            )}{' '}
                                                            Br.)
                                                        </span>
                                                    </h4>

                                                    <div className="relative mb-6 p-1.5">
                                                        <div className="absolute inset-0 rounded-4xl bg-black/3 blur-2xl" />
                                                        <div className="relative rounded-[1.5rem] border border-black/3 bg-white p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]">
                                                            <QRCodeSVG
                                                                value={`https://gebeta.app/pay/B12309?mode=split&count=${splitCount}&guest=${activeGuestId}`}
                                                                size={200}
                                                                level="H"
                                                                includeMargin={false}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Context Avatars */}
                                                    <div className="no-scrollbar flex w-full max-w-[300px] items-center justify-center gap-3 overflow-x-auto p-2 px-2">
                                                        {Array.from({ length: splitCount }).map(
                                                            (_, i) => (
                                                                <button
                                                                    key={i + 1}
                                                                    onClick={() =>
                                                                        setActiveGuestId(i + 1)
                                                                    }
                                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all ${
                                                                        activeGuestId === i + 1
                                                                            ? 'ring-brand-accent bg-black text-white ring-[3px] ring-offset-[3px]'
                                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                    }`}
                                                                >
                                                                    {i + 1}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                            <div className="relative">
                                <div
                                    onClick={() => {
                                        setShowOrderTypeDropdown(!showOrderTypeDropdown);
                                        setShowTableDropdown(false);
                                    }}
                                    className="text-body-sm flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-gray-200"
                                >
                                    <span className="font-semibold text-gray-600">Order Type</span>
                                    <div className="flex items-center gap-2 font-bold text-[#000000]">
                                        {orderType}
                                        <ChevronDown
                                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showOrderTypeDropdown ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </div>
                                {showOrderTypeDropdown && (
                                    <div className="animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                        {['Dine-in', 'Takeaway', 'Delivery'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setOrderType(type as 'Dine-in' | 'Takeaway' | 'Delivery');
                                                    setShowOrderTypeDropdown(false);
                                                }}
                                                className="flex w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <div
                                    onClick={() => {
                                        setShowTableDropdown(!showTableDropdown);
                                        setShowOrderTypeDropdown(false);
                                    }}
                                    className="text-body-sm flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-gray-200"
                                >
                                    <span className="font-semibold text-gray-600">Select Table</span>
                                    <div className="flex items-center gap-2 font-bold text-[#000000]">
                                        {tables.find(t => t.id === selectedTableId)?.table_number ||
                                            'A-12B'}
                                        <ChevronDown
                                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showTableDropdown ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </div>
                                {showTableDropdown && (
                                    <div className="animate-in fade-in slide-in-from-top-1 no-scrollbar absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                                        {tables.length > 0 ? (
                                            tables.map(table => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => {
                                                        setSelectedTableId(table.id);
                                                        setShowTableDropdown(false);
                                                    }}
                                                    className="flex w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                                >
                                                    Table {table.table_number}{' '}
                                                    {table.zone ? `(${table.zone})` : ''}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-400">
                                                No tables found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items - Grouped by Course */}
                        <div className="bg-surface-50 flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-2">
                            {Object.entries(groupedCartItems).map(([course, items]) => (
                                <div key={course} className="flex flex-col gap-2 pt-2">
                                    <div className="flex items-center">
                                        <h3 className="text-base leading-tight font-bold text-[#000000]">
                                            {course}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {items.map(item => (
                                            <div
                                                key={item.uniqueId}
                                                className="group relative flex cursor-pointer items-start gap-4 border-b border-gray-100/50 pb-4 last:border-0"
                                            >
                                                {/* Fixed image wrapper - Fixes "messed up" issue */}
                                                <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-[1rem] shadow-sm">
                                                    <Image
                                                        src={
                                                            item.image ||
                                                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'
                                                        }
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-black text-[10px] font-bold text-white shadow-sm">
                                                        {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex flex-1 flex-col py-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-base leading-tight font-bold text-[#000000]">
                                                            {item.title}
                                                        </h4>
                                                        <span className="text-sm font-semibold text-gray-400">
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex flex-col gap-1">
                                                        <p
                                                            className={`text-caption flex items-center gap-1.5 leading-tight font-bold ${item.instructions ? 'text-red-600' : 'text-gray-500'}`}
                                                        >
                                                            <MessageSquare className="h-3 w-3" />
                                                            Notes: {item.instructions || 'None'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="ml-2 flex shrink-0 flex-col items-end gap-3 pt-0.5">
                                                    <div className="text-body font-bold text-[#000000]">
                                                        {(
                                                            item.price * item.quantity
                                                        ).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                        })}{' '}
                                                        Br.
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-400">
                                                        <button
                                                            onClick={() => {}}
                                                            className="text-gray-400 transition-colors active:text-black"
                                                            aria-label="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                cart.removeFromCart(item.uniqueId)
                                                            }
                                                            className="text-gray-400 transition-colors active:text-red-500"
                                                            aria-label="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {cart.items.length === 0 && (
                                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center opacity-30">
                                    <BookOpen className="h-16 w-16" />
                                    <p className="text-lg font-bold">Your cart is empty</p>
                                </div>
                            )}
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
                                    <span className="font-bold text-[#000000]">
                                        {cart.total.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}{' '}
                                        Br.
                                    </span>
                                </div>
                                <div className="text-body flex items-center justify-between">
                                    <span className="font-semibold text-gray-600">Taxes (15%)</span>
                                    <span className="font-bold text-[#000000]">
                                        {(cart.total * 0.15).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}{' '}
                                        Br.
                                    </span>
                                </div>
                                <div className="text-body flex items-center justify-between">
                                    <span className="font-semibold text-gray-600">Total</span>
                                    <span className="text-xl font-black text-[#000000]">
                                        {totalWithTax.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}{' '}
                                        Br.
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons: Discount and Pay */}
                            <div className="mt-3 flex w-full gap-3">
                                <button
                                    onClick={() => {}}
                                    className="text-body-sm h-14 flex-1 rounded-xl border-2 border-gray-200 font-bold text-gray-700 transition-all duration-300 active:bg-gray-50"
                                >
                                    Discount
                                </button>
                                <button
                                    onClick={() =>
                                        cart.items.length > 0 && setShowSplitPayment(true)
                                    }
                                    disabled={cart.items.length === 0}
                                    className={`text-body-sm h-14 flex-1 rounded-xl font-bold transition-all duration-200 ${cart.items.length > 0 ? 'bg-brand-accent text-black shadow-sm active:brightness-105' : 'cursor-not-allowed bg-gray-100 text-gray-400'}`}
                                >
                                    Pay{' '}
                                    {totalWithTax.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}{' '}
                                    Br.
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
                                <span> Print Receipt</span>
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
