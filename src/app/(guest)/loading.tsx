/**
 * Loading state for guest routes
 * Displays skeleton components while content loads
 */
export default function GuestLoading() {
    return (
        <div className="min-h-screen animate-pulse bg-gray-50">
            {/* Header skeleton */}
            <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <div className="h-8 w-32 rounded-lg bg-gray-200" />
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100" />
                        <div className="h-10 w-24 rounded-lg bg-gray-200" />
                    </div>
                </div>
            </header>

            {/* Main content skeleton */}
            <main className="mx-auto max-w-7xl px-4 py-8">
                {/* Restaurant info skeleton */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-gray-200" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 rounded bg-gray-200" />
                        <div className="h-4 w-32 rounded bg-gray-100" />
                    </div>
                </div>

                {/* Category tabs skeleton */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 w-24 flex-shrink-0 rounded-full bg-gray-200" />
                    ))}
                </div>

                {/* Menu items grid skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                        >
                            {/* Image placeholder */}
                            <div className="aspect-video w-full bg-gray-100" />

                            {/* Content */}
                            <div className="p-4">
                                <div className="mb-2 flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-3/4 rounded bg-gray-200" />
                                        <div className="h-4 w-1/2 rounded bg-gray-100" />
                                    </div>
                                    <div className="h-6 w-16 rounded bg-gray-200" />
                                </div>
                                <div className="mt-3 space-y-2">
                                    <div className="h-3 w-full rounded bg-gray-50" />
                                    <div className="h-3 w-2/3 rounded bg-gray-50" />
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="h-5 w-20 rounded bg-gray-200" />
                                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Cart bar skeleton (mobile) */}
            <div className="fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white p-4 md:hidden">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                        <div className="h-3 w-16 rounded bg-gray-100" />
                    </div>
                    <div className="h-12 w-32 rounded-xl bg-gray-200" />
                </div>
            </div>
        </div>
    );
}
