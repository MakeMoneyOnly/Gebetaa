import { Skeleton } from '@/components/ui/Skeleton';

export default function TablesLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="mt-2 h-5 w-48 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-28 rounded-full" />
            </div>

            {/* Table Grid Skeleton */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="min-h-[240px] rounded-[2.5rem] bg-white p-6 shadow-sm">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <div className="mt-10 flex flex-col items-center">
                            <Skeleton className="mb-2 h-4 w-12 rounded-lg" />
                            <Skeleton className="h-16 w-20 rounded-xl" />
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
