'use client';

import React from 'react';
import {
    CreditCard,
    Smartphone,
    Banknote,
    Building,
    Download,
    ListFilter,
    PieChart,
} from 'lucide-react';
import { ModernSelect } from '../../ModernSelect';

export function PaymentsTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 pb-12 duration-500">
            {/* Payment Method Breakdown */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <PieChart className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Payment Breakdown</h3>
                    </div>
                    <div className="w-32">
                        <ModernSelect
                            options={[
                                { value: 'today', label: 'Today' },
                                { value: 'week', label: 'This Week' },
                                { value: 'month', label: 'This Month' },
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Cash', value: '14,650 ETB', count: '124 trans.', icon: Banknote },
                        { label: 'Telebirr', value: '22,400 ETB', count: '86 trans.', icon: Smartphone },
                        { label: 'CBE Birr', value: '18,200 ETB', count: '65 trans.', icon: Building },
                        { label: 'Credit/Debit Card', value: '5,000 ETB', count: '12 trans.', icon: CreditCard },
                    ].map((method, i) => (
                        <div key={i} className="flex flex-col gap-3 rounded-2xl bg-gray-50/50 p-5">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-gray-400">{method.label}</p>
                                <method.icon className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">{method.value}</p>
                                <p className="text-xs font-semibold text-gray-500">{method.count}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction Detail */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF853] text-black">
                            <ListFilter className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Transaction Detail</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <ModernSelect
                                options={[
                                    { value: 'all', label: 'All Methods' },
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'telebirr', label: 'Telebirr' },
                                    { value: 'cbe', label: 'CBE Birr' },
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
                                <th className="px-4 py-3">Date & Time</th>
                                <th className="px-4 py-3">Order #</th>
                                <th className="px-4 py-3">Method</th>
                                <th className="px-4 py-3">Amount (ETB)</th>
                                <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-900">
                            {[
                                { date: '24 Apr, 14:32', order: '#10045', method: 'Telebirr', amount: '850.00', status: 'Success', statusColor: 'bg-green-50 text-green-600' },
                                { date: '24 Apr, 14:28', order: '#10044', method: 'Cash', amount: '320.00', status: 'Success', statusColor: 'bg-green-50 text-green-600' },
                                { date: '24 Apr, 14:15', order: '#10043', method: 'CBE Birr', amount: '1,200.00', status: 'Failed', statusColor: 'bg-red-50 text-red-600' },
                                { date: '24 Apr, 13:50', order: '#10042', method: 'Telebirr', amount: '450.00', status: 'Refunded', statusColor: 'bg-yellow-50 text-yellow-600' },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-3 text-gray-500">{row.date}</td>
                                    <td className="px-4 py-3">{row.order}</td>
                                    <td className="px-4 py-3">{row.method}</td>
                                    <td className="px-4 py-3">{row.amount}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold ${row.statusColor}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
