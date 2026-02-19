import { Skeleton } from '@/components/ui/Skeleton';

export default function OrdersLoading() {
    return (
        <div className="space-y-6 pb-20 min-h-screen">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-5 w-48 mt-2 rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-full" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                </div>
            </div>

            {/* Kanban Board Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-[2rem] bg-white p-4 shadow-sm">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-2 w-2 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-lg" />
                            </div>
                            <Skeleton className="h-6 w-8 rounded-full" />
                        </div>

                        {/* Accent Bar */}
                        <Skeleton className="h-0.5 w-full rounded-full mb-4" />

                        {/* Order Cards */}
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="rounded-2xl bg-gray-50 p-4">
                                    <Skeleton className="h-4 w-20 rounded-lg mb-2" />
                                    <Skeleton className="h-8 w-12 rounded-xl mb-3" />
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-16 rounded-lg" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <Skeleton className="h-9 rounded-xl" />
                                        <Skeleton className="h-9 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}