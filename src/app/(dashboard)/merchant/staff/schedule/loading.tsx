import { Skeleton } from '@/components/ui/Skeleton';

export default function ScheduleLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Skeleton key={i} className="h-10 w-20 flex-shrink-0 rounded-full" />
                ))}
            </div>

            <Skeleton className="h-[500px] rounded-[2.5rem]" />
        </div>
    );
}