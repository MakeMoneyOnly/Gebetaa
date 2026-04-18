import React from 'react';

export default function KitchenPage() {
    return (
        <div className="flex flex-col gap-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kitchen</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Toast-parity implementation in progress. Rebuilding from scratch...
                </p>
            </div>

            <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                <div className="text-center">
                    <h3 className="text-sm font-semibold text-gray-900">
                        Kitchen Module Under Construction
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                        This module is part of the lole Merchant Blueprint.
                    </p>
                </div>
            </div>
        </div>
    );
}
