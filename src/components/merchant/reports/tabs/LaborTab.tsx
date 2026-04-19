'use client';

import React from 'react';
import {
    Clock,
    AlertTriangle,
    Banknote,
    Download,
    ListFilter,
} from 'lucide-react';
import { ModernSelect } from '../../ModernSelect';

export function LaborTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 pb-12 duration-500">
            {/* Labor Summary */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <Clock className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Labor Summary</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Total Hours Worked', value: '342.5' },
                        { label: 'Total Labor Cost (ETB)', value: '18,500' },
                        { label: 'Labor Cost % of Sales', value: '14.8%' },
                        { label: 'Overtime Hours', value: '12.5' },
                    ].map((metric, i) => (
                        <div key={i} className="rounded-2xl bg-gray-50/50 p-4">
                            <p className="text-xs font-bold text-gray-400">
                                {metric.label}
                            </p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{metric.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Entries Table */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <ListFilter className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Time Entries</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="rounded-xl border border-gray-200 bg-gray-50/30 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-[#DDF853] focus:ring-1 focus:ring-[#DDF853]"
                            />
                        </div>
                        <div className="w-48">
                            <ModernSelect
                                options={[
                                    { value: 'all', label: 'All Employees' },
                                    { value: 'almaz', label: 'Almaz T.' },
                                    { value: 'dawit', label: 'Dawit M.' },
                                ]}
                            />
                        </div>
                        <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-black active:scale-95">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Job</th>
                                <th className="px-4 py-3">Clock In</th>
                                <th className="px-4 py-3">Clock Out</th>
                                <th className="px-4 py-3">Hours</th>
                                <th className="px-4 py-3">Wage (ETB)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-900">
                            {[
                                { emp: 'Almaz T.', job: 'Server', in: '08:00 AM', out: '04:30 PM', hrs: '8.5', wage: '425.00' },
                                { emp: 'Dawit M.', job: 'Line Cook', in: '07:30 AM', out: '03:30 PM', hrs: '8.0', wage: '600.00' },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-3">{row.emp}</td>
                                    <td className="px-4 py-3">{row.job}</td>
                                    <td className="px-4 py-3">{row.in}</td>
                                    <td className="px-4 py-3">{row.out}</td>
                                    <td className="px-4 py-3">{row.hrs}</td>
                                    <td className="px-4 py-3">{row.wage}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Overtime Alerts */}
                <div className="rounded-4xl border border-red-100 bg-white p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Overtime Alerts</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl border border-red-50 bg-red-50/30 p-4 font-semibold">
                            <div>
                                <p className="text-sm text-gray-900">Dawit M.</p>
                                <p className="text-xs text-red-500">Approaching 48h limit</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">46.5 hours</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 font-semibold">
                            <div>
                                <p className="text-sm text-gray-900">Almaz T.</p>
                                <p className="text-xs text-gray-400">Normal</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">38.0 hours</span>
                        </div>
                    </div>
                </div>

                {/* Tip Summary */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <Banknote className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tip Summary</h3>
                    </div>
                    
                    <div className="mb-6 rounded-2xl bg-gray-50/50 p-4 text-center">
                        <p className="text-xs font-bold text-gray-400">Total Tips Collected</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">4,250 ETB</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between rounded-xl border border-gray-100 p-4 text-sm font-semibold">
                            <span className="text-gray-900">Almaz T.</span>
                            <span className="text-gray-500">1,200 ETB</span>
                        </div>
                        <div className="flex justify-between rounded-xl border border-gray-100 p-4 text-sm font-semibold">
                            <span className="text-gray-900">Tip Pool (BOH)</span>
                            <span className="text-gray-500">800 ETB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
