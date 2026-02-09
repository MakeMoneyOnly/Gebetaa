'use client';

import React from 'react';

export function MenuSkeleton() {
    return (
        <div className="w-full animate-pulse px-4">
            <div className="flex gap-3 mt-8">
                {/* Left Column */}
                <div className="flex-1 space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-[32px] overflow-hidden">
                            <div className="h-[220px] bg-gray-200" />
                            <div className="mt-3 px-1">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Right Column */}
                <div className="flex-1 space-y-6 pt-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-[32px] overflow-hidden">
                            <div className="h-[220px] bg-gray-200" />
                            <div className="mt-3 px-1">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
