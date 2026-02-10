'use client';

import React from 'react';

export function MenuSkeleton() {
    return (
        <div className="w-full animate-pulse px-4">
            <div className="mt-8 flex gap-3">
                {/* Left Column */}
                <div className="flex-1 space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="overflow-hidden rounded-[32px]">
                            <div className="h-[220px] bg-gray-200" />
                            <div className="mt-3 px-1">
                                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                                <div className="h-4 w-1/2 rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Right Column */}
                <div className="flex-1 space-y-6 pt-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="overflow-hidden rounded-[32px]">
                            <div className="h-[220px] bg-gray-200" />
                            <div className="mt-3 px-1">
                                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                                <div className="h-4 w-1/2 rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
