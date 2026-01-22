import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
            <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-white/60 mb-6">
                    You don't have permission to access the agency admin panel.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
}
