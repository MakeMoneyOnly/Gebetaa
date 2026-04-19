import React from 'react';

export default function PaymentsPage() {
    return (
        <div className="flex flex-col gap-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Telebirr, CBE Birr, and Card processing configuration in progress. Rebuilding from scratch...
                </p>
            </div>

            <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                <div className="text-center">
                    <h3 className="text-sm font-semibold text-gray-900">Payments Module Under Construction</h3>
                    <p className="mt-1 text-xs text-gray-500">Integrating local Ethiopian payment gateways and tax rule management.</p>
                </div>
            </div>
        </div>
    );
}
