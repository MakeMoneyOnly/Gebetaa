import { Skeleton } from '@/components/ui/Skeleton';

export default function HelpLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
            </div>

            <Skeleton className="h-12 w-full max-w-md rounded-xl" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-48 rounded-[2rem]" />
                ))}
            </div>
        </div>
    );
}