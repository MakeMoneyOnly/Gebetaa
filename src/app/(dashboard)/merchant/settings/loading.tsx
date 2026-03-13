import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 rounded-[2rem]" />
                    <Skeleton className="h-48 rounded-[2rem]" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-48 rounded-[2rem]" />
                    <Skeleton className="h-32 rounded-[2rem]" />
                </div>
            </div>
        </div>
    );
}