import { Skeleton } from '@/components/ui/Skeleton';

export default function SetupLoading() {
    return (
        <div className="bg-surface-0 flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header Skeleton */}
                <div className="text-center">
                    <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                    <Skeleton className="mx-auto mt-4 h-8 w-48 rounded-lg" />
                    <Skeleton className="mx-auto mt-2 h-4 w-64 rounded-lg" />
                </div>

                {/* Form Skeleton */}
                <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
