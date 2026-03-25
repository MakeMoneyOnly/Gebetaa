/**
 * Loading state for KDS Dessert station
 * Displays skeleton order cards while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function KDSDessertLoading() {
    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Header skeleton */}
            <div className="flex items-center justify-between border-b bg-fuchsia-50 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg bg-fuchsia-200" />
                    <div>
                        <Skeleton className="h-5 w-32 rounded bg-fuchsia-200" />
                        <Skeleton className="mt-1 h-3 w-24 rounded bg-fuchsia-100" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded bg-fuchsia-200" />
                    <Skeleton className="h-8 w-8 rounded bg-fuchsia-200" />
                    <Skeleton className="h-8 w-24 rounded bg-fuchsia-200" />
                </div>
            </div>

            {/* Order grid skeleton */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col rounded-xl border border-fuchsia-100 bg-white shadow-sm"
                        >
                            {/* Order header */}
                            <div className="flex items-center justify-between border-b border-fuchsia-50 px-3 py-2">
                                <Skeleton className="h-5 w-16 rounded bg-fuchsia-100" />
                                <Skeleton className="h-4 w-12 rounded bg-fuchsia-100" />
                            </div>
                            {/* Order items */}
                            <div className="flex-1 space-y-2 p-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex items-start gap-2">
                                        <Skeleton className="h-4 w-4 rounded bg-fuchsia-100" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-full rounded bg-fuchsia-100" />
                                            <Skeleton className="mt-1 h-3 w-2/3 rounded bg-fuchsia-50" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Order footer */}
                            <div className="border-t border-fuchsia-50 px-3 py-2">
                                <Skeleton className="h-8 w-full rounded bg-fuchsia-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
