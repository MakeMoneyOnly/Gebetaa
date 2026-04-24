'use client';

import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export function MenuConfigurationTab() {
    return (
        <div className="flex gap-8 max-w-6xl">
            {/* Left Column: Forms */}
            <div className="flex-1 space-y-8">
                {/* Pricing Rules */}
                <div className="bg-white rounded-[2rem] border-b border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Pricing Rules & Happy Hour</h3>
                                <p className="text-sm font-medium text-gray-500">Configure time-based price adjustments</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="w-5 h-5 rounded text-black focus:ring-black border-gray-300" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">Enable Time-based Pricing</span>
                                <span className="text-xs font-medium text-gray-500">Automatically adjust prices during specific hours</span>
                            </div>
                        </label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700">Start Time</label>
                                <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700">End Time</label>
                                <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">Price Adjustment</label>
                            <div className="flex items-center gap-3">
                                <select className="w-1/3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black">
                                    <option>Decrease by %</option>
                                    <option>Decrease by amount</option>
                                </select>
                                <input type="number" placeholder="10" className="w-2/3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Online Ordering Sync */}
                <div className="bg-white rounded-[2rem] border-b border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <RefreshCw className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Online Ordering Menu Sync</h3>
                                <p className="text-sm font-medium text-gray-500">Keep POS and online menus in sync</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">Auto-sync POS menu</span>
                                <span className="text-xs font-medium text-gray-500">Automatically push changes to delivery partners</span>
                            </div>
                            <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 bg-black">
                                <span aria-hidden="true" className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                            </div>
                        </label>
                        <p className="text-xs font-medium text-gray-500 text-right">
                            Last synced: Today at 09:42 AM
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Context/Info */}
            <div className="w-80 shrink-0 space-y-4">
                <div className="bg-gray-50 p-5 rounded-[2rem] border-b border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">How Pricing Rules Work</h4>
                    <p className="text-xs font-medium text-gray-600 leading-relaxed">
                        Pricing rules allow you to automatically change the cost of items based on the time of day. This is commonly used for Happy Hour specials or late-night menus. 
                    </p>
                </div>
            </div>
        </div>
    );
}
