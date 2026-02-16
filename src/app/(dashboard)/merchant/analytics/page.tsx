'use client';

import React, { useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    ChevronDown,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

// Mock Data for Top Items
const topItems = [
    { id: 1, name: "Spicy Beef Tibs", orders: 145, revenue: "45,200", growth: "+12%" },
    { id: 2, name: "Veggie Combo", orders: 120, revenue: "32,500", growth: "+8%" },
    { id: 3, name: "Kitfo Special", orders: 98, revenue: "28,900", growth: "-2%" },
    { id: 4, name: "Shiro Wot", orders: 85, revenue: "15,400", growth: "+15%" },
];

export default function AnalyticsPage() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState('This Week');

    return (
        <div className="space-y-8 pb-20 min-h-screen">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 font-medium">Detailed insights into your business performance.</p>
                </div>

                {/* Date Filter */}
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
                    >
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {filterType}
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {filterOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            {['This Week', 'This Month', 'This Year'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setFilterType(option);
                                        setFilterOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 text-sm font-bold rounded-xl transition-colors",
                                        filterType === option ? "bg-gray-50 text-black" : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Total Revenue */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +12.5%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">128.4k</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Total Revenue</h3>
                            <p className="text-gray-400 text-xs font-medium">Gross Income</p>
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
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +5.2%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">1,240</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Total Orders</h3>
                            <p className="text-gray-400 text-xs font-medium">Order Volume</p>
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

                {/* Avg Order Value */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" /> -2.1%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">350<span className="text-sm font-bold text-gray-400 ml-1">ETB</span></h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Avg. Value</h3>
                            <p className="text-gray-400 text-xs font-medium">Per Order</p>
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

                {/* Active Customers - New Card */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +8.4%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">842</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Customers</h3>
                            <p className="text-gray-400 text-xs font-medium">Unique Visitors</p>
                        </div>

                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 16;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-orange-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Revenue Chart (2/3 width) */}
                <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue Trends</h3>
                            <p className="text-gray-500 text-sm font-medium">Comparison with previous period</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <RevenueChart />
                    </div>
                </div>

                {/* Top Items (1/3 width) */}
                <div className="xl:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col h-[460px]">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Top Items</h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {topItems.map((item, index) => (
                            <div key={item.id} className="flex items-center justify-between group cursor-pointer p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 font-bold text-sm shadow-sm">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{item.orders} orders</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-sm">{item.revenue}</p>
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        item.growth.startsWith('+') ? "text-green-600" : "text-red-500"
                                    )}>
                                        {item.growth}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 py-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                        View Full Report
                    </button>
                </div>
            </div>
        </div>
    );
}
