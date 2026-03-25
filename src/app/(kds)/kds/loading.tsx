/**
 * Loading state for KDS Kitchen station
 * Displays skeleton order cards while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function KDSKitchenLoading() {
    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Header skeleton */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div>
                        <Skeleton className="h-5 w-32 rounded" />
                        <Skeleton className="mt-1 h-3 w-24 rounded" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            </div>

            {/* Order grid skeleton */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm"
                        >
                            {/* Order header */}
                            <div className="flex items-center justify-between border-b px-3 py-2">
                                <Skeleton className="h-5 w-16 rounded" />
                                <Skeleton className="h-4 w-12 rounded" />
                            </div>
                            {/* Order items */}
                            <div className="flex-1 space-y-2 p-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex items-start gap-2">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-full rounded" />
                                            <Skeleton className="mt-1 h-3 w-2/3 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Order footer */}
                            <div className="border-t px-3 py-2">
                                <Skeleton className="h-8 w-full rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
