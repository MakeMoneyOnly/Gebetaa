/**
 * Loading state for restaurant info page
 * Displays skeleton components while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function RestaurantInfoLoading() {
    return (
        <div className="bg-surface-0 pb-safe min-h-screen">
            {/* Header skeleton */}
            <div className="relative h-48 bg-gray-200">
                <div className="absolute right-4 bottom-4 left-4">
                    <Skeleton className="h-8 w-40 rounded-xl" />
                    <Skeleton className="mt-2 h-4 w-56 rounded-lg" />
                </div>
            </div>

            {/* Tab bar skeleton */}
            <div className="flex gap-2 border-b bg-white px-4 py-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
            </div>

            {/* Content skeleton */}
            <div className="p-4">
                {/* Map/Location skeleton */}
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <div className="mt-4 flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="mt-1 h-3 w-1/2 rounded" />
                        </div>
                    </div>
                </div>

                {/* Info cards skeleton */}
                <div className="mt-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-24 rounded" />
                                    <Skeleton className="mt-1 h-3 w-32 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
