import { Skeleton } from '@/components/ui/Skeleton';

export default function GuestMenuLoading() {
    return (
        <div className="bg-surface-0 pb-safe min-h-screen">
            {/* Hero Skeleton */}
            <div className="relative h-48 bg-gray-200">
                <div className="absolute right-4 bottom-4 left-4">
                    <Skeleton className="h-8 w-32 rounded-xl" />
                    <Skeleton className="mt-2 h-4 w-48 rounded-lg" />
                </div>
            </div>

            {/* Category Rail Skeleton */}
            <div className="flex gap-3 overflow-x-auto p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 min-w-[80px] rounded-full" />
                ))}
            </div>

            {/* Menu Grid Skeleton */}
            <div className="px-4 pb-20">
                <Skeleton className="mb-4 h-6 w-24 rounded-lg" />

                <div className="flex gap-3">
                    {/* Left Column */}
                    <div className="flex-1 space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="mt-3 h-5 w-3/4 rounded-lg" />
                                <Skeleton className="mt-2 h-4 w-1/4 rounded-lg" />
                                <Skeleton className="mt-3 h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                    {/* Right Column */}
                    <div className="flex-1 space-y-3 pt-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="mt-3 h-5 w-3/4 rounded-lg" />
                                <Skeleton className="mt-2 h-4 w-1/4 rounded-lg" />
                                <Skeleton className="mt-3 h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
