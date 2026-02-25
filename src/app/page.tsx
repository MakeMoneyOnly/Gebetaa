import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-red-600">Gebeta</span>
                        </div>
                        <nav className="flex items-center gap-4">
                            <Link
                                href="/auth/login"
                                className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight">
                        The Operating System for
                        <span className="text-red-600 block mt-2">African Restaurants</span>
                    </h1>
                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                        From order to payment, manage your entire restaurant operation with one powerful platform. 
                        Built for the unique needs of African hospitality.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/signup"
                            className="bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25"
                        >
                            Start Free Trial
                        </Link>
                        <Link
                            href="/auth/login"
                            className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
                        Everything you need to run your restaurant
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
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
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-red-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to transform your restaurant?
                    </h2>
                    <p className="text-xl text-red-100 mb-8">
                        Join hundreds of restaurants already using Gebeta to streamline their operations.
                    </p>
                    <Link
                        href="/auth/signup"
                        className="inline-block bg-white text-red-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-gray-400">
                        © {new Date().getFullYear()} Gebeta. The operating system for African restaurants.
                    </p>
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}