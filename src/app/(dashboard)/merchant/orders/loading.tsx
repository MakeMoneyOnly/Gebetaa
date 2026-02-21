import { Skeleton } from '@/components/ui/Skeleton';

export default function OrdersLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="mt-2 h-5 w-48 rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-full" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                </div>
            </div>

            {/* Kanban Board Skeleton */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-[2rem] bg-white p-4 shadow-sm">
                        {/* Column Header */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-2 w-2 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-lg" />
                            </div>
                            <Skeleton className="h-6 w-8 rounded-full" />
                        </div>

                        {/* Accent Bar */}
                        <Skeleton className="mb-4 h-0.5 w-full rounded-full" />

                        {/* Order Cards */}
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="rounded-2xl bg-gray-50 p-4">
                                    <Skeleton className="mb-2 h-4 w-20 rounded-lg" />
                                    <Skeleton className="mb-3 h-8 w-12 rounded-xl" />
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-16 rounded-lg" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
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
