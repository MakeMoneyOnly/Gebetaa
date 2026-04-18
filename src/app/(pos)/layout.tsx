// Force dynamic rendering for all POS pages to avoid build-time errors
export const dynamic = 'force-dynamic';

import { CartProvider } from '@/context/CartContext';

export default function PosLayout({ children }: { children: React.ReactNode }) {
    // This layout bypasses the main dashboard layout
    // No sidebar, no header. Just full screen PWA-style.
    return (
        <CartProvider>
            <div className="font-manrope min-h-screen bg-gray-50 text-gray-900">{children}</div>
        </CartProvider>
    );
}

export const metadata = {
    title: 'lole POS',
    description: 'Point of Sale Terminal',
    themeColor: '#000000',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
};
