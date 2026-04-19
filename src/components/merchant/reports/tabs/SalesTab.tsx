'use client';

import React from 'react';
import {
    TrendingUp,
    ListFilter,
    BarChart3,
    PieChart,
    Tag,
    XCircle,
    Store,
    Download,
} from 'lucide-react';
import { ModernSelect } from '../../ModernSelect';

export function SalesTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 pb-12 duration-500">
            {/* Summary Report */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Summary Report</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="rounded-xl border border-gray-200 bg-gray-50/30 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-[#DDF853] focus:ring-1 focus:ring-[#DDF853]"
                        />
                        <span className="text-sm text-gray-400">to</span>
                        <input
                            type="date"
                            className="rounded-xl border border-gray-200 bg-gray-50/30 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-[#DDF853] focus:ring-1 focus:ring-[#DDF853]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Net Sales (ETB)', value: '124,500' },
                        { label: 'Gross Sales (ETB)', value: '143,175' },
                        { label: 'Tax Collected (ETB)', value: '18,675' },
                        { label: 'Service Charges (ETB)', value: '5,000' },
                        { label: 'Discounts Applied (ETB)', value: '-2,500' },
                        { label: 'Voids (ETB)', value: '-800' },
                        { label: 'Refunds (ETB)', value: '-1,200' },
                        { label: 'Guest Count', value: '450' },
                        { label: 'Order Count', value: '312' },
                        { label: 'Avg Order Value (ETB)', value: '399.04' },
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

            {/* Itemized Sales */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <ListFilter className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Itemized Sales</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <ModernSelect
                                options={[
                                    { value: 'all', label: 'All Categories' },
                                    { value: 'food', label: 'Food' },
                                    { value: 'drinks', label: 'Drinks' },
                                ]}
                            />
                        </div>
                        <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-black active:scale-95">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Qty Sold</th>
                                <th className="px-4 py-3">Gross (ETB)</th>
                                <th className="px-4 py-3">Net (ETB)</th>
                                <th className="px-4 py-3">Tax (ETB)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-900">
                            {[
                                { item: 'Doro Wot', cat: 'Food', qty: 45, gross: '13,500', net: '11,739', tax: '1,761' },
                                { item: 'Shiro', cat: 'Food', qty: 62, gross: '6,200', net: '5,391', tax: '809' },
                                { item: 'St. George Beer', cat: 'Drinks', qty: 120, gross: '6,000', net: '5,217', tax: '783' },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-3">{row.item}</td>
                                    <td className="px-4 py-3">{row.cat}</td>
                                    <td className="px-4 py-3">{row.qty}</td>
                                    <td className="px-4 py-3">{row.gross}</td>
                                    <td className="px-4 py-3">{row.net}</td>
                                    <td className="px-4 py-3">{row.tax}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Other Sections Row */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Hourly Sales */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Hourly Sales</h3>
                    </div>
                    <div className="flex h-48 w-full items-end justify-between gap-2 pb-4">
                        {[10, 20, 30, 60, 100, 80, 40, 20, 50, 90, 70, 30].map((h, i) => (
                            <div key={i} className="group relative flex w-full flex-col justify-end">
                                <div className="bg-[#DDF853]/60 w-full rounded-t-sm hover:bg-[#DDF853]" style={{ height: `${h}%` }} />
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900">Peak Hour: <span className="text-[#98AD17]">1:00 PM - 2:00 PM</span></p>
                </div>

                {/* Product Mix */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <PieChart className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Product Mix</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-3 text-sm">
                            <span className="font-bold text-gray-900">Top Seller:</span>
                            <span className="font-semibold text-gray-500">St. George Beer</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-3 text-sm">
                            <span className="font-bold text-gray-900">Bottom Performer:</span>
                            <span className="font-semibold text-gray-500">Fruit Salad</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full w-[65%] bg-[#DDF853]"></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400">65% Food / 35% Drinks</p>
                    </div>
                </div>

                {/* Discounts Report */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                                <Tag className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Discounts</h3>
                        </div>
                        <div className="w-32">
                            <ModernSelect options={[{ value: 'all', label: 'All Types' }]} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between rounded-xl border border-gray-100 p-4 text-sm font-semibold">
                            <span className="text-gray-900">Staff Meal (100%)</span>
                            <span className="text-gray-500">12 Applied • 2,400 ETB</span>
                        </div>
                        <div className="flex justify-between rounded-xl border border-gray-100 p-4 text-sm font-semibold">
                            <span className="text-gray-900">Manager Comp</span>
                            <span className="text-gray-500">1 Applied • 100 ETB</span>
                        </div>
                    </div>
                </div>

                {/* Voids Report */}
                <div className="rounded-4xl border border-gray-100 bg-white p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                                <XCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Voids</h3>
                        </div>
                        <div className="w-32">
                            <ModernSelect options={[{ value: 'all', label: 'All Staff' }]} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between rounded-xl border border-gray-100 p-4 text-sm font-semibold">
                            <div className="space-y-1">
                                <p className="text-gray-900">Customer Changed Mind</p>
                                <p className="text-xs text-gray-400">By: Almaz</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-900">350 ETB</p>
                                <p className="text-xs text-gray-400">2 voids</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Source Report */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                        <Store className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Order Source Report</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        { src: 'Dine-in', val: '85,000 ETB', pct: '68%' },
                        { src: 'Takeout', val: '15,000 ETB', pct: '12%' },
                        { src: 'Delivery', val: '24,500 ETB', pct: '20%' },
                        { src: 'Online', val: '0 ETB', pct: '0%' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                            <p className="text-sm font-bold text-gray-400">{s.src}</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{s.val}</p>
                            <p className="mt-1 text-xs font-semibold text-[#98AD17]">{s.pct} of Total</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
