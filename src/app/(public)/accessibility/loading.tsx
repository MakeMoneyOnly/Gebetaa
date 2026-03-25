/**
 * Loading state for public accessibility page
 * Displays skeleton components while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function AccessibilityLoading() {
    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-3xl">
                {/* Header skeleton */}
                <div className="mb-8 text-center">
                    <Skeleton className="mx-auto h-10 w-64 rounded-lg" />
                    <Skeleton className="mx-auto mt-4 h-5 w-96 rounded" />
                </div>

                {/* Content sections skeleton */}
                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
                            <Skeleton className="mb-4 h-6 w-48 rounded" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full rounded" />
                                <Skeleton className="h-4 w-full rounded" />
                                <Skeleton className="h-4 w-3/4 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
