import { Skeleton } from '@/components/ui/Skeleton';

export default function FinanceLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
            </div>

            <Skeleton className="h-16 rounded-2xl" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 rounded-[2rem]" />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Skeleton className="h-[400px] rounded-[2.5rem]" />
                <Skeleton className="h-[400px] rounded-[2.5rem]" />
            </div>

            <Skeleton className="h-[300px] rounded-[2.5rem]" />
        </div>
    );
}