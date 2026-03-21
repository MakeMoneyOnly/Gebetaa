import type { Metadata, Viewport } from 'next';
import {
    Inter,
    Manrope,
    JetBrains_Mono,
    Instrument_Serif,
    Playfair_Display,
} from 'next/font/google';
import './globals.css';
import { LenisRoot } from '@/components/providers/LenisRoot';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerCleanup } from '@/components/providers/ServiceWorkerCleanup';
import { OfflineIndicator } from '@/components/providers/OfflineIndicator';
import { SkipLink } from '@/components/ui/SkipLink';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});
const instrumentSerif = Instrument_Serif({
    weight: '400',
    subsets: ['latin'],
    style: ['italic', 'normal'],
    variable: '--font-instrument',
    display: 'swap',
});
const playfair = Playfair_Display({
    subsets: ['latin'],
    style: ['italic', 'normal'],
    variable: '--font-playfair',
    display: 'swap',
});
const geist = Inter({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

export const metadata: Metadata = {
    title: 'Gebeta - Restaurant Infrastructure',
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
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${playfair.variable} ${geist.variable} text-Charcoal bg-Cream overscroll-none antialiased`}
            >
                <ServiceWorkerCleanup />
                <SkipLink href="#main-content">Skip to main content</SkipLink>
                <OfflineIndicator position="top" showSyncStatus={true} />
                <LenisRoot>
                    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                        <div className="fixed top-6 right-6 z-[100] hidden md:flex">
                            {/* Theme Switcher Logic */}
                        </div>
                        <div className="pointer-events-none fixed inset-0 z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                        <main id="main-content" tabIndex={-1}>
                            {children}
                        </main>
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
                    </ThemeProvider>
                </LenisRoot>
            </body>
        </html>
    );
}
