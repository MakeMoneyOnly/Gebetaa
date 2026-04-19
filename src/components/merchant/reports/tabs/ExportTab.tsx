'use client';

import React from 'react';
import {
    Download,
    Mail,
    FileSpreadsheet,
    CalendarClock,
} from 'lucide-react';
import { ModernSelect } from '../../ModernSelect';

export function ExportTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 pb-12 duration-500">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Schedule Report */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                                <CalendarClock className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Schedule Report</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Report Type</label>
                            <ModernSelect
                                options={[
                                    { value: 'z_report', label: 'Z-Report (End-of-Day)' },
                                    { value: 'sales', label: 'Summary Sales Report' },
                                    { value: 'labor', label: 'Labor Summary' },
                                    { value: 'tax', label: 'VAT Collected Report' },
                                ]}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Frequency</label>
                            <ModernSelect
                                options={[
                                    { value: 'daily', label: 'Daily (End of Day)' },
                                    { value: 'weekly', label: 'Weekly (Mondays)' },
                                    { value: 'monthly', label: 'Monthly (1st)' },
                                ]}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Recipients (comma-separated emails)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/30 py-3 pl-10 pr-4 text-sm font-semibold text-gray-900 transition-all outline-none focus:border-[#DDF853] focus:ring-1 focus:ring-[#DDF853]"
                                    placeholder="manager@restaurant.com, owner@restaurant.com"
                                />
                            </div>
                        </div>

                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DDF853] px-6 py-3.5 text-sm font-bold text-black transition-all hover:brightness-105 active:scale-95">
                            <CalendarClock className="h-4 w-4" />
                            Save Schedule
                        </button>
                    </div>
                </div>

                {/* Bulk Exports */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                                <Download className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Bulk Exports</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 mb-6">
                            Export all historical data across modules. Large exports may take a few minutes to process.
                        </p>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Date Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="w-1/2 rounded-xl border border-gray-200 bg-gray-50/30 px-3 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#DDF853] focus:ring-1 focus:ring-[#DDF853]"
                                />
                                <span className="text-sm text-gray-400">to</span>
                                <input
                                    type="date"
                                    className="w-1/2 rounded-xl border border-gray-200 bg-gray-50/30 px-3 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#DDF853] focus:ring-1 focus:ring-[#DDF853]"
                                />
                            </div>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 transition-all hover:bg-gray-50 active:scale-95">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                Export as Excel
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 transition-all hover:bg-gray-50 active:scale-95">
                                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                Export as CSV
                            </button>
                        </div>
                        
                        <div className="mt-8 rounded-xl bg-gray-50/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-gray-900">System Status</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Export queue is currently empty. Jobs will process immediately.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
