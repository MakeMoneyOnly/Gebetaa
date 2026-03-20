import { Skeleton } from '@/components/ui/Skeleton';

export default function OrderTrackerLoading() {
    return (
        <div className="bg-surface-0 pb-safe min-h-screen">
            {/* Header Skeleton */}
            <div className="p-4">
                <Skeleton className="h-6 w-24 rounded-lg" />
            </div>

            {/* Order Status Skeleton */}
            <div className="px-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="mt-2 h-4 w-48 rounded-lg" />

                    {/* Status Steps Skeleton */}
                    <div className="mt-8 space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    {i < 3 && <Skeleton className="mt-2 h-8 w-0.5" />}
                                </div>
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-32 rounded-lg" />
                                    <Skeleton className="mt-1 h-4 w-48 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Order Items Skeleton */}
            <div className="mt-4 px-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 rounded-lg" />
                                    <Skeleton className="mt-1 h-3 w-16 rounded-lg" />
                                </div>
                                <Skeleton className="h-4 w-12 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Order Summary Skeleton */}
            <div className="mt-4 px-4 pb-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24 rounded-lg" />
                            <Skeleton className="h-4 w-16 rounded-lg" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-20 rounded-lg" />
                            <Skeleton className="h-4 w-16 rounded-lg" />
                        </div>
                        <Skeleton className="mt-2 h-0.5 w-full" />
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-16 rounded-lg" />
                            <Skeleton className="h-5 w-20 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
