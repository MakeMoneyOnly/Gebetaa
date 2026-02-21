import { Skeleton } from '@/components/ui/Skeleton';

export default function AnalyticsLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="mt-2 h-5 w-48 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-36 rounded-full" />
            </div>

            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-[2rem] bg-white p-6 shadow-sm">
                        <Skeleton className="h-4 w-16 rounded-lg" />
                        <Skeleton className="mt-3 h-8 w-24 rounded-xl" />
                        <Skeleton className="mt-2 h-4 w-32 rounded-lg" />
                        <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="rounded-[2.5rem] bg-white p-8 shadow-sm">
                <Skeleton className="h-8 w-40 rounded-xl" />
                <Skeleton className="mt-2 h-4 w-64 rounded-lg" />
                <div className="mt-6 flex h-[360px] items-center justify-center">
                    <Skeleton className="h-full w-full rounded-3xl" />
                </div>
            </div>

            {/* Activity Cards Skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="min-h-[500px] rounded-[2.5rem] bg-white p-8 shadow-sm">
                        <Skeleton className="h-8 w-40 rounded-xl" />
                        <Skeleton className="mt-2 h-4 w-64 rounded-lg" />
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
