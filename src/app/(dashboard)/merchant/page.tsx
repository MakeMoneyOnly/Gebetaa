'use client';

import React, { useEffect, useState } from 'react';
import {
    ShoppingBag,
    Clock,
    MoreHorizontal,
    PlayCircle,
    PauseCircle,
    CheckCircle,
    CalendarCheck,
    DollarSign,
    Users,
    ChevronDown,
    Timer,
    TrendingUp
} from 'lucide-react';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { Skeleton } from '@/components/ui/Skeleton';

// Active Orders Data
const activeOrders = [
    {
        id: 1,
        title: "Order #2045 (Table 5) • 3 items",
        status: "In preparation",
        statusColor: "text-orange-500",
        time: "15m",
        icon: PlayCircle,
        iconBg: "bg-blue-50 text-blue-500"
    },
    {
        id: 2,
        title: "Order #2044 (Takeaway) • 1 item",
        status: "Ready to serve",
        statusColor: "text-green-500",
        time: "8m",
        icon: CheckCircle,
        iconBg: "bg-green-50 text-green-500"
    },
    {
        id: 3,
        title: "Order #2043 (Table 12) • 5 items",
        status: "In preparation",
        statusColor: "text-orange-500",
        time: "22m",
        icon: PlayCircle,
        iconBg: "bg-blue-50 text-blue-500"
    },
    {
        id: 4,
        title: "Order #2042 (Table 2) • 2 items",
        status: "On hold",
        statusColor: "text-blue-500",
        time: "32m",
        icon: PauseCircle,
        iconBg: "bg-orange-50 text-orange-500"
    }
];

// Sparkline Data for Net Revenue
const sparkData = [
    { i: 1, v: 40 },
    { i: 2, v: 35 },
    { i: 3, v: 55 },
    { i: 4, v: 45 },
    { i: 5, v: 60 },
    { i: 6, v: 50 },
    { i: 7, v: 70 },
    { i: 8, v: 65 },
    { i: 9, v: 55 },
    { i: 10, v: 75 },
    { i: 11, v: 60 },
    { i: 12, v: 85 }
];

export default function MerchantDashboard() {
    // Client-side only mounting for Recharts to avoid hydration mismatch
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState('Week');

    useEffect(() => {
        setMounted(true);
        // Simulate data loading
        setTimeout(() => setLoading(false), 1500);
    }, []);

    if (loading || !mounted) {
        return (
            <div className="space-y-8 pb-10">
                {/* Header Skeleton */}
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </div>

                {/* Stats Grid Skeleton - Asymmetric */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex flex-col items-end gap-1">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-8 w-16 rounded-lg mt-[20px]" />
                                </div>
                            </div>
                            <div className="absolute bottom-5 left-5 right-5">
                                <div className="space-y-2 mb-3">
                                    <Skeleton className="h-5 w-32 rounded-lg" />
                                    <Skeleton className="h-3 w-24 rounded-lg" />
                                </div>
                                <div className="flex justify-between items-center gap-1">
                                    {Array.from({ length: 12 }).map((_, j) => (
                                        <Skeleton key={j} className="h-[15px] w-[15px] rounded-full" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Income Tracker Skeleton */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-start justify-between mb-8">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48 rounded-lg" />
                            <Skeleton className="h-4 w-64 rounded-lg" />
                        </div>
                        <Skeleton className="h-10 w-24 rounded-full" />
                    </div>
                    <div className="flex flex-col xl:flex-row items-center gap-12 h-full">
                        <div className="w-full xl:w-[20%] pl-[35px] flex flex-col justify-center h-full space-y-4">
                            <Skeleton className="h-16 w-32 rounded-xl" />
                            <Skeleton className="h-12 w-48 rounded-xl" />
                        </div>
                        <div className="flex-1 w-full h-[350px]">
                            <Skeleton className="h-full w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Active Orders Skeleton */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-32 rounded-lg" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl h-24 shadow-sm">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40 rounded-lg" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-3 w-3 rounded-full" />
                                            <Skeleton className="h-3 w-20 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <Skeleton className="h-8 w-24 rounded-lg" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Hello, Saba Grill</h1>
                    <p className="text-gray-500 font-medium">Here's your daily performance summary.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-black bg-gray-50 px-3 py-2 rounded-xl">
                        15 Feb, 2026
                    </span>
                    <button className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                        <CalendarCheck className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Visual Stats Row - Asymmetric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                {/* 1. Total Orders - Compact Dot/Activity Grid (25% Width) */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                +5 active
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">42</h3>
                        </div>
                    </div>

                    {/* Bottom Section - Absolute to prevent layout shift */}
                    {/* Bottom Section - Absolute to prevent layout shift */}
                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Total Daily Orders</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Today's Volume</p>
                        </div>

                        {/* Blue Dot Grid Visual with Gradient */}
                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 50</span>
                            <span>Current: 42</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 12;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;

                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. Table Turnover - Reverted to Clean Stat (25% Width) */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <Timer className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                Fast Service
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">45m</h3>
                        </div>
                    </div>

                    {/* Bottom Section - Absolute to prevent layout shift */}
                    {/* Bottom Section - Absolute to prevent layout shift */}
                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Table Turnover</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Real-time stats</p>
                        </div>

                        {/* Red Dot Grid Visual with Gradient */}
                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 40m</span>
                            <span>Current: 45m</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 15;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;

                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-[#E11D48]' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Avg Order Value - Adjusted to Standard Layout with Green Dots */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +5%
                            </span>
                            <div className="flex items-baseline gap-1 mt-[20px]">
                                <h3 className="text-4xl font-bold text-gray-900 tracking-tight">350</h3>
                                <span className="text-sm font-bold text-gray-400">ETB</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - Absolute to prevent layout shift */}
                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Avg. Order</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Per Customer</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 450</span>
                            <span>Current: 350</span>
                        </div>

                        {/* Green Dot Grid Visual with Gradient */}
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 15;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;

                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 4. Total Customers (New Card) */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                +18% new
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">128</h3>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Total Customers</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Unique Visitors</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 150</span>
                            <span>Current: 128</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 14;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;

                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-purple-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>

            {/* Income Tracker */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">

                {/* Header (Simplified) */}
                <div className="flex items-start justify-between mb-8">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Income Tracker</h2>
                        <p className="text-gray-500 font-medium text-sm">
                            Real-time analysis of your daily revenue streams.
                        </p>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            {filterType} <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {filterOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                {['Week', 'Month', 'Year'].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setFilterType(option);
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === option
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Container (Stats Left, Graph Right) */}
                <div className="flex flex-col xl:flex-row items-center gap-12 h-full">
                    {/* Left Side: Summary Stats */}
                    <div className="w-full xl:w-[20%] pl-[35px] flex flex-col justify-center h-full">
                        <div className="mb-3">
                            {/* The '+20%' must be huge and dark */}
                            <span className="text-[3.5rem] leading-none font-bold text-slate-900 tracking-tighter block">
                                +20%
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed text-wrap">
                            This week's income is higher than last week's
                        </p>
                    </div>

                    {/* Right Side: The Recharts Line Chart */}
                    <div className="flex-1 w-full overflow-hidden h-full min-h-[350px]">
                        <RevenueChart />
                    </div>
                </div>
            </div>

            {/* Active Orders Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-black">Active Orders</h2>
                        <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold">5 Pending</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {activeOrders.map((order) => (
                        <div key={order.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${order.iconBg} group-hover:scale-110 transition-transform`}>
                                    <order.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 mb-1">{order.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">{order.time} ago</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50">
                                    <div className={`h-2 w-2 rounded-full ${order.statusColor.replace('text-', 'bg-')}`} />
                                    <span className={`text-xs font-bold ${order.statusColor}`}>{order.status}</span>
                                </div>
                                <button className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-black">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
