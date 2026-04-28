import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerCleanup } from '@/components/providers/ServiceWorkerCleanup';
import { SkipLink } from '@/components/ui/SkipLink';
import { PowerSyncProvider } from '@/lib/sync/usePowerSync';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Lole - Restaurant Infrastructure',
    description: 'The operating system for restaurants in emerging markets.',
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: '#A81818',
    interactiveWidget: 'overlays-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className="h-full">
            <body
                className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} font-inter text-brand-ink bg-brand-canvas antialiased`}
                suppressHydrationWarning
            >
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    <ServiceWorkerCleanup />
                    <SkipLink href="#main-content">Skip to main content</SkipLink>
                    <PowerSyncProvider>
                        <QueryProvider>
                            {children}
                            <Toaster
                                position="top-center"
                                toastOptions={{
                                    style: {
                                        background: '#333',
                                        color: '#fff',
                                        borderRadius: '9999px',
                                    },
                                    success: {
                                        iconTheme: {
                                            primary: '#22c55e',
                                            secondary: '#fff',
                                        },
                                    },
                                }}
                            />
                        </QueryProvider>
                    </PowerSyncProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
