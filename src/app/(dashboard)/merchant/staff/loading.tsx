import { Skeleton } from '@/components/ui/Skeleton';

export default function StaffLoading() {
    return (
        <div className="min-h-screen space-y-8 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-12 w-32 rounded-xl" />
                    <Skeleton className="h-12 w-32 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-40 rounded-[2rem]" />
                ))}
            </div>

            <div className="flex gap-2">
                <Skeleton className="h-12 w-32 rounded-xl" />
                <Skeleton className="h-12 w-32 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-80 rounded-[2.5rem]" />
                ))}
            </div>
        </div>
    );
}
