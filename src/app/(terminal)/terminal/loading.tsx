/**
 * Loading state for Terminal page
 * Displays skeleton components while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function TerminalLoading() {
    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Header skeleton */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-28 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            </div>

            {/* Main content skeleton */}
            <div className="flex-1 overflow-hidden p-4">
                {/* Tables grid skeleton */}
                <div className="mb-6">
                    <Skeleton className="mb-3 h-6 w-32 rounded" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-8 rounded" />
                                    <Skeleton className="h-4 w-16 rounded" />
                                </div>
                                <Skeleton className="mt-2 h-3 w-20 rounded" />
                                <Skeleton className="mt-3 h-8 w-full rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active orders skeleton */}
                <div>
                    <Skeleton className="mb-3 h-6 w-28 rounded" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-16 rounded" />
                                    <Skeleton className="h-4 w-12 rounded" />
                                </div>
                                <div className="mt-3 space-y-2">
                                    <Skeleton className="h-3 w-full rounded" />
                                    <Skeleton className="h-3 w-3/4 rounded" />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Skeleton className="h-8 flex-1 rounded" />
                                    <Skeleton className="h-8 flex-1 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
