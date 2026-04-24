'use client';

import React from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

export function PublishChangesTab() {
    return (
        <div className="max-w-4xl flex flex-col gap-8">
            {/* Header Banner */}
            <div className="bg-[#DDF853]/20 border border-[#DDF853] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#DDF853] flex items-center justify-center shrink-0">
                        <UploadCloud className="h-6 w-6 text-black" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">3 Unpublished Changes</h2>
                        <p className="text-sm font-medium text-gray-700">Review your changes before publishing to devices and online ordering.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button className="px-5 py-2.5 bg-[#DDF853] text-black rounded-xl text-sm font-bold hover:brightness-105 transition-all">
                        Publish All
                    </button>
                </div>
            </div>

            {/* Changes List */}
            <div className="bg-white rounded-[2rem] border-b border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Pending Edits</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    <div className="p-6 flex gap-4 hover:bg-gray-50 transition-colors">
                        <div className="mt-1">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-bold text-gray-900">Price Update: Doro Wat</h4>
                            <p className="text-xs font-medium text-gray-500">Changed price from 400 ETB to 450 ETB in Main Courses category.</p>
                        </div>
                        <div className="text-xs font-bold text-gray-400">2 hrs ago</div>
                    </div>
                    <div className="p-6 flex gap-4 hover:bg-gray-50 transition-colors">
                        <div className="mt-1">
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-bold text-gray-900">Availability: Tibs</h4>
                            <p className="text-xs font-medium text-gray-500">Marked as Sold Out for POS and Online Ordering.</p>
                        </div>
                        <div className="text-xs font-bold text-gray-400">Yesterday</div>
                    </div>
                    <div className="p-6 flex gap-4 hover:bg-gray-50 transition-colors">
                        <div className="mt-1">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-bold text-gray-900">New Item: Avocado Juice</h4>
                            <p className="text-xs font-medium text-gray-500">Added to Beverages category with price 120 ETB.</p>
                        </div>
                        <div className="text-xs font-bold text-gray-400">Yesterday</div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-6 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Publish Targets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-gray-900">POS Terminals</div>
                            <div className="text-xs font-medium text-gray-500">Updates 3 devices</div>
                        </div>
                        <div className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md">Online</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-gray-900">Online Ordering</div>
                            <div className="text-xs font-medium text-gray-500">Delivery partners</div>
                        </div>
                        <div className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md">Connected</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
