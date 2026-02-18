'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// Chart skeleton loader for better UX during lazy loading
const ChartSkeleton = () => (
    <div className="h-[300px] w-full bg-gray-50/50 rounded-3xl animate-pulse" />
);

// Lazy load the entire chart component to reduce initial bundle by ~300KB
// This uses Next.js dynamic import which handles code splitting automatically
const RevenueChartContent = dynamic(
    () => import('./RevenueChartContent').then((mod) => mod.RevenueChartContent),
    {
        loading: () => <ChartSkeleton />,
        ssr: false, // Chart doesn't need SSR - saves server resources
    }
);

const chartData = [
    { day: 'Mon', income: 4500, previous: 3200 },
    { day: 'Tue', income: 6800, previous: 4500 },
    { day: 'Wed', income: 5200, previous: 4100 },
    { day: 'Thu', income: 7900, previous: 5600 },
    { day: 'Fri', income: 9500, previous: 7200 },
    { day: 'Sat', income: 12500, previous: 8900 },
    { day: 'Sun', income: 10800, previous: 8100 },
];

export const RevenueChart = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Prevent hydration mismatch and show skeleton during initial mount
    if (!mounted) return <ChartSkeleton />;

    return (
        <div className="w-full h-[350px] select-none">
            <RevenueChartContent data={chartData} />
        </div>
    );
};