import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { ClientOnly } from "@/components/ClientOnly";
import { LanguageProvider } from "@/context/LanguageContext";
import { FastingProvider } from "@/context/FastingContext";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saba Menu - Digital Menu Platform",
  description: "Modern digital menu system for restaurants. Scan, browse, and order.",
  manifest: "/manifest.json",
  other: {
    "google": "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${manrope.variable} ${inter.variable} notranslate`} 
      translate="no"
    >
      <body suppressHydrationWarning>
        <ClientOnly
          fallback={
            <div 
              className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
              style={{ background: 'var(--brand-color, #FF6B35)' }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span 
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: '#000' }}
                >
                  Sabà
                </span>
                <div 
                  className="px-2.5 py-1 rounded-lg"
                  style={{ background: '#000' }}
                >
                  <span 
                    className="text-3xl font-bold tracking-tight"
                    style={{ color: 'var(--brand-color, #FF6B35)' }}
                  >
                    Menu
                  </span>
                </div>
              </div>
              <div 
                className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#000', borderTopColor: 'transparent' }}
              />
            </div>
          }
        >
          <LanguageProvider>
            <FastingProvider>
              {children}
            </FastingProvider>
          </LanguageProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
