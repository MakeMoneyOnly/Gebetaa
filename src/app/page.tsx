import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
            {/* Header */}
            <header className="fixed top-0 right-0 left-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-red-600">Gebeta</span>
                        </div>
                        <nav className="flex items-center gap-4">
                            <Link
                                href="/auth/login"
                                className="font-medium text-gray-600 hover:text-gray-900"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                            >
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                        The Operating System for
                        <span className="mt-2 block text-red-600">African Restaurants</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600">
                        From order to payment, manage your entire restaurant operation with one
                        powerful platform. Built for the unique needs of African hospitality.
                    </p>
                    <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href="/auth/signup"
                            className="rounded-xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-red-600/25 transition-colors hover:bg-red-700"
                        >
                            Start Free Trial
                        </Link>
                        <Link
                            href="/auth/login"
                            className="rounded-xl border border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-colors hover:border-gray-300"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                        Everything you need to run your restaurant
                    </h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        <FeatureCard
                            icon="🍽️"
                            title="Smart Menu Management"
                            description="Create beautiful digital menus with QR codes. Update prices and availability in real-time."
                        />
                        <FeatureCard
                            icon="📱"
                            title="Guest Ordering"
                            description="Let guests browse, order, and pay from their phones. No app download required."
                        />
                        <FeatureCard
                            icon="👨‍🍳"
                            title="Kitchen Display"
                            description="Streamline your kitchen with real-time order tickets and status updates."
                        />
                        <FeatureCard
                            icon="📊"
                            title="Analytics Dashboard"
                            description="Track sales, popular items, and peak hours to make data-driven decisions."
                        />
                        <FeatureCard
                            icon="💳"
                            title="Local Payments"
                            description="Accept Telebirr, Chapa, and cash. Built for Ethiopian payment preferences."
                        />
                        <FeatureCard
                            icon="📶"
                            title="Offline-First"
                            description="Keep working even when the internet goes down. Syncs automatically when back online."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-red-600 px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
                        Ready to transform your restaurant?
                    </h2>
                    <p className="mb-8 text-xl font-semibold text-white">
                        Join hundreds of restaurants already using Gebeta to streamline their
                        operations.
                    </p>
                    <Link
                        href="/auth/signup"
                        className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-semibold text-red-600 transition-colors hover:bg-gray-100"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl text-center">
                    <p className="text-gray-400">
                        © {new Date().getFullYear()} Gebeta. The operating system for African
                        restaurants.
                    </p>
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl bg-gray-50 p-6 transition-colors hover:bg-gray-100">
            <div className="mb-4 text-4xl">{icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
