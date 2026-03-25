'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatCurrencyCompact } from '@/lib/utils/monetary';

interface ChartDataPoint {
    label: string;
    income: number;
    previous: number;
}

interface RevenueChartContentProps {
    data: ChartDataPoint[];
}

// This component is lazy-loaded via Next.js dynamic import
// to reduce the initial bundle size by ~300KB (recharts library)
export const RevenueChartContent = ({ data }: RevenueChartContentProps) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CBD5E1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#CBD5E1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#10B981',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    itemStyle={{ color: '#10B981' }}
                    cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '3 3' }}
                    formatter={(value, name) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [
                            `${formatCurrencyCompact(numValue)} ETB`,
                            name === 'income' ? 'Current Period' : 'Previous Period',
                        ];
                    }}
                    labelStyle={{ color: '#94A3B8', marginBottom: '8px' }}
                />
                <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
                    domain={[0, 'auto']}
                    width={40}
                />
                {/* Previous Period Area (Subtle) */}
                <Area
                    type="monotone"
                    dataKey="previous"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="url(#colorPrevious)"
                    fillOpacity={1}
                    animationDuration={1500}
                />
                {/* Current Income Area (Prominent) */}
                <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={4}
                    fill="url(#colorIncome)"
                    fillOpacity={1}
                    activeDot={{ r: 8, fill: '#10B981', strokeWidth: 4, stroke: '#fff' }}
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
