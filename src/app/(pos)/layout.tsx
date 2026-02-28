// Force dynamic rendering for all POS pages to avoid build-time errors
export const dynamic = 'force-dynamic';

export default function PosLayout({ children }: { children: React.ReactNode }) {
    // This layout bypasses the main dashboard layout
    // No sidebar, no header. Just full screen PWA-style.
    return <div className="font-manrope min-h-screen bg-gray-50 text-gray-900">{children}</div>;
}

export const metadata = {
    title: 'Gebeta POS',
    description: 'Point of Sale Terminal',
    themeColor: '#000000',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
};
