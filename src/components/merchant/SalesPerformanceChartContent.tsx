'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SalesPerformanceChartContentProps {
    data: {
        totalSales: number;
        averageSales: number;
    };
}

const SalesPerformanceChartContent = ({ data }: SalesPerformanceChartContentProps) => {
    // We create gauge segments.
    // Total Sales arc
    const totalSalesData = [
        { value: data.totalSales, color: '#D9FF43' }, // Active part
        { value: 100 - data.totalSales, color: '#F8FAFC' }, // Background part
    ];

    // Average Sales arc (inner)
    const averageSalesData = [
        { value: data.averageSales, color: '#D9FF4366' }, // Active part (faded)
        { value: 100 - data.averageSales, color: '#F8FAFC' }, // Background part
    ];

    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                {/* Outer Arc (Total Sales) */}
                <Pie
                    data={totalSalesData}
                    cx="50%"
                    cy="65%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="75%"
                    outerRadius="95%"
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                    animationDuration={1500}
                >
                    {totalSalesData.map((entry, index) => (
                        <Cell key={`cell-total-${index}`} fill={entry.color} />
                    ))}
                </Pie>

                {/* Inner Arc (Average Sales) */}
                <Pie
                    data={averageSalesData}
                    cx="50%"
                    cy="65%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="50%"
                    outerRadius="70%"
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                    animationDuration={1500}
                >
                    {averageSalesData.map((entry, index) => (
                        <Cell key={`cell-avg-${index}`} fill={entry.color} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
};

export default SalesPerformanceChartContent;
