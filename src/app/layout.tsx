
import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { LenisRoot } from '@/components/providers/LenisRoot';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerCleanup } from '@/components/providers/ServiceWorkerCleanup';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

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
            <body className={`${inter.variable} ${manrope.variable} overscroll-none antialiased`}>
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
