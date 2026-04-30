import { Skeleton } from '@/components/ui/Skeleton';

export default function KDSGrillLoading() {
    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <div className="flex items-center justify-between border-b bg-orange-50 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg bg-orange-200" />
                    <div>
                        <Skeleton className="h-5 w-32 rounded bg-orange-200" />
                        <Skeleton className="mt-1 h-3 w-24 rounded bg-orange-100" />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
                <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col rounded-xl border border-orange-100 bg-white shadow-sm"
                        >
                            <div className="flex items-center justify-between border-b border-orange-50 px-3 py-2">
                                <Skeleton className="h-5 w-16 rounded bg-orange-100" />
                                <Skeleton className="h-4 w-12 rounded bg-orange-100" />
                            </div>
                            <div className="flex-1 space-y-2 p-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex items-start gap-2">
                                        <Skeleton className="h-4 w-4 rounded bg-orange-100" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-full rounded bg-orange-100" />
                                            <Skeleton className="mt-1 h-3 w-2/3 rounded bg-orange-50" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-orange-50 px-3 py-2">
                                <Skeleton className="h-8 w-full rounded bg-orange-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
