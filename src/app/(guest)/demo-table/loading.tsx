import { Skeleton } from '@/components/ui/Skeleton';

export default function DemoTableLoading() {
    return (
        <div className="bg-surface-0 pb-safe min-h-screen">
            {/* Header Skeleton */}
            <div className="p-4">
                <Skeleton className="h-8 w-32 rounded-xl" />
            </div>

            {/* Menu Skeleton */}
            <div className="px-4">
                {/* Category Tabs Skeleton */}
                <div className="flex gap-2 overflow-x-auto py-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 min-w-[80px] rounded-full" />
                    ))}
                </div>

                {/* Items Skeleton */}
                <div className="mt-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
                            <Skeleton className="h-20 w-20 rounded-xl" />
                            <div className="flex-1">
                                <Skeleton className="h-5 w-3/4 rounded-lg" />
                                <Skeleton className="mt-2 h-4 w-1/2 rounded-lg" />
                                <Skeleton className="mt-3 h-10 w-24 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
