'use client';

import React from 'react';
import {
    Heart,
    Users,
    Star,
    Award,
    TrendingUp,
} from 'lucide-react';
import { ModernSelect } from '../../ModernSelect';

export function GuestTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 pb-12 duration-500">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Visit Frequency */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                                <Users className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Visit Frequency</h3>
                        </div>
                        <div className="w-32">
                            <ModernSelect
                                options={[
                                    { value: '30d', label: 'Last 30 Days' },
                                    { value: '7d', label: 'Last 7 Days' },
                                    { value: 'ytd', label: 'Year to Date' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="mb-8 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 text-center">
                            <p className="text-xs font-bold text-gray-400">New Guests</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">1,245</p>
                            <p className="mt-1 flex justify-center items-center gap-1 text-xs font-bold text-green-500">
                                <TrendingUp className="h-3 w-3" /> 12%
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-[#DDF853]/10 p-5 text-center">
                            <p className="text-xs font-bold text-gray-500">Returning</p>
                            <p className="mt-2 text-3xl font-bold text-black">856</p>
                            <p className="mt-1 flex justify-center items-center gap-1 text-xs font-bold text-green-600">
                                <TrendingUp className="h-3 w-3" /> 5%
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">Return Rate</span>
                            <span className="text-lg font-bold text-black">40.7%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full w-[40.7%] bg-[#DDF853]"></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-2">Industry average is 30%</p>
                    </div>
                </div>

                {/* Loyalty Report */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                                <Award className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Loyalty Report</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#DDF853] shadow-[0_0_8px_rgba(221,248,83,0.8)]"></div>
                            <span className="text-xs font-bold text-gray-500">Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-bold text-gray-400">Points Issued</p>
                                <Star className="h-4 w-4 text-[#DDF853] fill-[#DDF853]" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">125,400</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-bold text-gray-400">Points Redeemed</p>
                                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">45,200</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-4">
                            <span className="text-sm font-bold text-gray-400">Active Loyalty Members</span>
                            <span className="text-base font-bold text-gray-900">3,450</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#DDF853]/20 p-4">
                            <span className="text-sm font-bold text-gray-900">Redemption Rate</span>
                            <span className="text-lg font-bold text-black">36%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
