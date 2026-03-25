/**
 * Loading state for dashboard routes
 * Displays skeleton components while content loads
 */
export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6 p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 rounded-lg bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-100" />
                </div>
                <div className="h-10 w-32 rounded-lg bg-gray-200" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-20 rounded bg-gray-100" />
                                <div className="h-6 w-16 rounded bg-gray-200" />
                            </div>
                            <div className="h-12 w-12 rounded-full bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content area skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main content */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="h-12 w-full rounded-lg bg-gray-100" />
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-gray-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 rounded bg-gray-100" />
                                        <div className="h-3 w-1/2 rounded bg-gray-50" />
                                    </div>
                                    <div className="h-8 w-20 rounded bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="space-y-4">
                            <div className="h-5 w-24 rounded bg-gray-200" />
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-3 w-20 rounded bg-gray-100" />
                                        <div className="h-2 w-16 rounded bg-gray-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
