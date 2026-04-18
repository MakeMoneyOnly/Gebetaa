import React from 'react';

export default function ShopPage() {
    return (
        <div className="flex flex-col gap-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Shop</h1>
                <p className="mt-2 text-sm text-gray-500">
                    POS hardware and accessories shop in progress.
                </p>
            </div>

            <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                <div className="text-center">
                    <h3 className="text-sm font-semibold text-gray-900">Shop Under Construction</h3>
                    <p className="mt-1 text-xs text-gray-500">
                        Official lole POS hardware catalog coming soon.
                    </p>
                </div>
            </div>
        </div>
    );
}
