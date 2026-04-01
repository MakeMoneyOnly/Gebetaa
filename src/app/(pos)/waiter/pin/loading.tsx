/**
 * Loading state for POS waiter PIN entry page
 * Displays skeleton components while content loads
 */
import { Skeleton } from '@/components/ui/Skeleton';

export default function POSWaiterPinLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
                {/* Logo/Title skeleton */}
                <div className="mb-8 text-center">
                    <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
                    <Skeleton className="mx-auto mt-4 h-6 w-32 rounded" />
                    <Skeleton className="mx-auto mt-2 h-4 w-48 rounded" />
                </div>

                {/* PIN display skeleton */}
                <div className="mb-6 flex justify-center gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-12 rounded-lg" />
                    ))}
                </div>

                {/* Keypad skeleton */}
                <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                </div>

                {/* Action buttons skeleton */}
                <div className="mt-6 flex gap-3">
                    <Skeleton className="h-12 flex-1 rounded-lg" />
                    <Skeleton className="h-12 flex-1 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
