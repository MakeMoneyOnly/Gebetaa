'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

const ChartSkeleton = () => (
    <div className="h-full w-full animate-pulse rounded-full bg-gray-50/50" />
);

const SalesPerformanceChartContent = dynamic(
    () => import('./SalesPerformanceChartContent').then(mod => mod.SalesPerformanceChartContent),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

interface SalesPerformanceChartProps {
    totalSales: number;
    averageSales: number;
}

export const SalesPerformanceChart = ({ totalSales, averageSales }: SalesPerformanceChartProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <ChartSkeleton />;

    return (
        <div className="h-full w-full">
            <SalesPerformanceChartContent data={{ totalSales, averageSales }} />
        </div>
    );
};
