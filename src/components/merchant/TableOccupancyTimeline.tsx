'use client';

import React from 'react';

export type OccupancyTimelineBucket = {
    label: string;
    opens: number;
    closes: number;
};

interface TableOccupancyTimelineProps {
    buckets: OccupancyTimelineBucket[];
}

export function TableOccupancyTimeline({ buckets }: TableOccupancyTimelineProps) {
    if (buckets.length === 0) {
        return (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Occupancy Timeline</h3>
                <p className="mt-2 text-sm text-gray-500">No recent table-session events yet.</p>
            </div>
        );
    }

    const maxValue = Math.max(...buckets.map(bucket => Math.max(bucket.opens, bucket.closes)), 1);

    return (
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Occupancy Timeline</h3>
            <p className="mt-1 text-xs text-gray-500">Recent open vs close session flow</p>

            <div className="mt-5 grid gap-3">
                {buckets.map(bucket => {
                    const openWidth = Math.max(6, Math.round((bucket.opens / maxValue) * 100));
                    const closeWidth = Math.max(6, Math.round((bucket.closes / maxValue) * 100));
                    return (
                        <div
                            key={bucket.label}
                            className="grid grid-cols-[80px_1fr_1fr] items-center gap-3"
                        >
                            <span className="text-xs font-semibold text-gray-500">
                                {bucket.label}
                            </span>
                            <div className="flex h-7 items-center rounded-lg bg-emerald-50 px-2">
                                <div
                                    className="h-3 rounded bg-emerald-500"
                                    style={{ width: `${openWidth}%` }}
                                />
                                <span className="ml-2 text-[11px] font-semibold text-emerald-700">
                                    {bucket.opens}
                                </span>
                            </div>
                            <div className="flex h-7 items-center rounded-lg bg-gray-100 px-2">
                                <div
                                    className="h-3 rounded bg-gray-700"
                                    style={{ width: `${closeWidth}%` }}
                                />
                                <span className="ml-2 text-[11px] font-semibold text-gray-700">
                                    {bucket.closes}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
