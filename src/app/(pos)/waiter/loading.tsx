/**
 * Loading state for POS waiter page
 * Displays skeleton components while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function POSWaiterLoading() {
    return (
        <div className="flex h-screen flex-col bg-gray-100">
            {/* Header skeleton */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded" />
                </div>
            </div>

            {/* Main content skeleton */}
            <div className="flex flex-1 overflow-hidden">
                {/* Tables panel skeleton */}
                <div className="w-64 border-r bg-white p-4">
                    <Skeleton className="mb-4 h-8 w-full rounded" />
                    <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Menu panel skeleton */}
                <div className="flex-1 p-4">
                    {/* Category tabs */}
                    <div className="mb-4 flex gap-2 overflow-x-auto">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full" />
                        ))}
                    </div>

                    {/* Menu items grid */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="mt-2 h-4 w-3/4 rounded" />
                                <Skeleton className="mt-1 h-3 w-1/2 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart panel skeleton */}
                <div className="w-80 border-l bg-white p-4">
                    <Skeleton className="mb-4 h-6 w-24 rounded" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-lg bg-gray-50 p-2"
                            >
                                <Skeleton className="h-12 w-12 rounded" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-20 rounded" />
                                    <Skeleton className="mt-1 h-3 w-12 rounded" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
