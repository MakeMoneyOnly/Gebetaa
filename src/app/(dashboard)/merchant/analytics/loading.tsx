import { Skeleton } from '@/components/ui/Skeleton';

export default function AnalyticsLoading() {
    return (
        <div className="space-y-6 pb-20 min-h-screen">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-5 w-48 mt-2 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-36 rounded-full" />
            </div>

            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm">
                        <Skeleton className="h-4 w-16 rounded-lg" />
                        <Skeleton className="h-8 w-24 mt-3 rounded-xl" />
                        <Skeleton className="h-4 w-32 mt-2 rounded-lg" />
                        <Skeleton className="h-1.5 w-full mt-4 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
                <Skeleton className="h-8 w-40 rounded-xl" />
                <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
                <div className="h-[360px] mt-6 flex items-center justify-center">
                    <Skeleton className="h-full w-full rounded-3xl" />
                </div>
            </div>

            {/* Activity Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm min-h-[500px]">
                        <Skeleton className="h-8 w-40 rounded-xl" />
                        <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
                        <div className="mt-8 space-y-4">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <Skeleton key={j} className="h-12 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}