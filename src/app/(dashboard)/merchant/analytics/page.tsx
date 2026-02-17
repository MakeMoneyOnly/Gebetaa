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
    ArrowDownRight,
    Search,
    Filter,
    MoreHorizontal,
    Star,
    Smile,
    Meh,
    Frown,
    Timer
} from 'lucide-react';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState('This Week');

    return (
        <div className="space-y-6 pb-20 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 font-medium">Detailed insights into your business performance.</p>
                </div>

                {/* Date Filter */}
                <div className="relative z-20">
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl text-sm font-bold text-gray-900 hover:bg-gray-50 transition-all shadow-sm border border-gray-100 min-w-[160px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{filterType}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${filterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {filterOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                            <div className="absolute right-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                {['This Week', 'This Month', 'This Year'].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setFilterType(option);
                                            setFilterOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-colors",
                                            filterType === option ? "bg-gray-50 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Card 1: Revenue - Replicating Dashboard Design */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +12.5%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">128.4k</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Total Revenue</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Gross Income</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 150k</span>
                            <span>Current: 128k</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 17;
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

                {/* Card 2: Orders */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +5.2%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">1,240</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Total Orders</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Order Volume</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 1.5k</span>
                            <span>Current: 1.2k</span>
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
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Card 3: Avg Value */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" /> -2.1%
                            </span>
                            <div className="flex items-baseline gap-1 mt-[20px]">
                                <h3 className="text-4xl font-bold text-gray-900 tracking-tight">350</h3>
                                <span className="text-sm font-bold text-gray-400">ETB</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Avg. Order Value</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Per Customer</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 400</span>
                            <span>Current: 350</span>
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
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-red-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Card 4: Customers */}
                <div className="md:col-span-1 bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +8.4%
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">842</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">Total Customers</h3>
                            <p className="text-gray-400 text-xs font-medium mb-3">Unique Visitors</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Goal: 1000</span>
                            <span>Current: 842</span>
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

            {/* Revenue Trends Chart - Full Width */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue Trends</h3>
                        <p className="text-gray-500 text-sm font-medium">Comparison with previous period</p>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    <RevenueChart />
                </div>
            </div>

            {/* Bottom Section: Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Customer Feedback/Satisfaction - 50% width */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-[500px]">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
                                <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse delay-75" />
                                <div className="h-2 w-2 rounded-full bg-gray-900 animate-pulse delay-150" />
                            </div>
                            <button className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                <span className="sr-only">Close</span>
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Review Rating</p>

                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-8">
                            How is your business management going?
                        </h3>

                        <div className="flex justify-between items-center gap-2 px-2">
                            {[
                                { icon: '😖', label: 'Terrible' },
                                { icon: 'bad', label: 'Bad' }, // using custom SVGs or icons below
                                { icon: 'meh', label: 'Okay' },
                                { icon: 'good', label: 'Good' },
                                { icon: 'love', label: 'Great' }
                            ].map((mood, i) => (
                                <button key={i} className="group flex flex-col items-center gap-2 transition-transform hover:scale-110 focus:outline-none">
                                    <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center text-2xl shadow-sm border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                        {i === 0 && <span className="grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">😡</span>}
                                        {i === 1 && <Frown className="h-6 w-6 text-gray-400 group-hover:text-red-500 transition-colors" />}
                                        {i === 2 && <Meh className="h-6 w-6 text-gray-400 group-hover:text-yellow-500 transition-colors" />}
                                        {i === 3 && <Smile className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />}
                                        {i === 4 && <span className="grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">😍</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mt-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-900">Total Reviews</span>
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">+24 this week</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h4 className="text-4xl font-black text-gray-900">4.8</h4>
                            <div className="flex text-yellow-400">
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-2">Based on 1,240 customer ratings</p>
                    </div>
                </div>

                {/* 2. Operational/Occupancy Mini-View - 50% width */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-[500px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Users className="h-48 w-48" />
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Live Activity</h3>
                        <p className="text-gray-500 text-sm font-medium mb-8">Current restaurant status</p>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <div className="h-3 w-3 rounded-full bg-green-500 animate-ping" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Occupancy</p>
                                        <p className="text-xs text-gray-500">85% Full</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-gray-900">42/50</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Active Orders</p>
                                        <p className="text-xs text-gray-500">Kitchen Queue</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-gray-900">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Waiting List</p>
                                        <p className="text-xs text-gray-500">Est. 15m wait</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-gray-900">4</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto">
                        <div className="bg-gray-900 rounded-2xl p-6 text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Pro Tip</p>
                                    <h4 className="font-bold text-lg mt-1">Dinner Rush Incoming</h4>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Expect a 40% value spike between 7 PM - 9 PM based on historical data. Prep accordingly.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
