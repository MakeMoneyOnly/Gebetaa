/**
 * Loading state for marketing routes
 * Displays skeleton components while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function MarketingLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-md px-4">
                {/* Logo skeleton */}
                <div className="mb-8 text-center">
                    <Skeleton className="mx-auto h-16 w-16 rounded-2xl" />
                    <Skeleton className="mx-auto mt-4 h-8 w-32 rounded-lg" />
                </div>

                {/* Form card skeleton */}
                <div className="rounded-2xl bg-white p-8 shadow-xl">
                    <div className="space-y-4">
                        <div>
                            <Skeleton className="mb-2 h-4 w-20 rounded" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                        <div>
                            <Skeleton className="mb-2 h-4 w-24 rounded" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>

                    <div className="mt-6 text-center">
                        <Skeleton className="mx-auto h-4 w-40 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
