import type { Metadata, Viewport } from 'next';
import {
    Inter,
    Plus_Jakarta_Sans,
    Playfair_Display,
    JetBrains_Mono,
    Manrope,
    Geist,
    Instrument_Serif,
} from 'next/font/google';
import './globals.css';
import { LenisRoot } from '@/components/providers/LenisRoot';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerCleanup } from '@/components/providers/ServiceWorkerCleanup';

// Force dynamic rendering to prevent build-time errors with environment variables
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
    display: 'swap',
});
const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    style: ['normal', 'italic'],
    display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const instrumentSerif = Instrument_Serif({
    subsets: ['latin'],
    weight: '400',
    style: ['italic'],
    variable: '--font-instrument',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Gebeta - Restaurant Infrastructure',
    description: 'The operating system for restaurants in emerging markets.',
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#A81818',
    interactiveWidget: 'overlays-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.variable} ${manrope.variable} ${plusJakartaSans.variable} ${playfair.variable} ${jetbrainsMono.variable} ${geist.variable} ${instrumentSerif.variable} text-Charcoal bg-Cream overscroll-none antialiased`}
            >
                <ServiceWorkerCleanup />
                <LenisRoot>
                    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                        <div className="fixed top-6 right-6 z-[100] hidden md:flex">
                            {/* Theme Switcher Logic */}
                        </div>
                        <div className="pointer-events-none fixed inset-0 z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
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
                    </ThemeProvider>
                </LenisRoot>
            </body>
        </html>
    );
}
