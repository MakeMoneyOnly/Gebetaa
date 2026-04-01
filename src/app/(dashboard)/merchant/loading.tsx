import { Skeleton } from '@/components/ui/Skeleton';

export default function MerchantDashboardLoading() {
    return (
        <div className="min-h-screen space-y-6 p-6">
            {/* Header Skeleton */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="mt-2 h-5 w-64 rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-full" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
                        <Skeleton className="h-4 w-24 rounded-lg" />
                        <Skeleton className="mt-3 h-8 w-16 rounded-xl" />
                        <Skeleton className="mt-2 h-3 w-20 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Charts/Content Skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="mt-4 h-48 w-full rounded-xl" />
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="mt-4 h-48 w-full rounded-xl" />
                </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <div className="mt-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-48 rounded-lg" />
                                <Skeleton className="mt-1 h-3 w-32 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
