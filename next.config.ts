import type { NextConfig } from 'next';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
    enable: process.env.NODE_ENV === 'production',
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            // Cache the restaurant and menu data for offline browsing
            urlPattern: /^https:\/\/.*\/api\/(?:restaurant|menu)\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-data',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                },
                networkTimeoutSeconds: 5,
            },
        },
        {
            urlPattern:
                /^https:\/\/.*(?:unsplash\.com|supabase\.co)\/.*(?:png|jpg|jpeg|webp|svg|gif|avif).*$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'menu-images',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
        // Cache standard Google Fonts
        {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                },
            },
        },
        // Use Cache-First for local static assets
        {
            urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|webp|svg|gif)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-assets',
            },
        },
        // Fallback to NetworkFirst for everything else
        {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'offline-fallback',
                expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                },
                networkTimeoutSeconds: 10,
            },
        },
    ],
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    turbopack: {},
    
    // Performance: Enable experimental features for better optimization
    experimental: {
        // Optimize package imports to reduce bundle size
        optimizePackageImports: [
            'lucide-react',
            'recharts',
            'framer-motion',
            '@react-three/drei',
            '@react-three/fiber',
            'three',
        ],
    },
    
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [320, 420, 768, 1024, 1200],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'axuegixbqsvztdraenkz.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
                pathname: '/**',
            },
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'inline',
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    // Performance: Preconnect to critical external domains
                    {
                        key: 'Link',
                        value: [
                            '<https://fonts.googleapis.com>; rel=preconnect',
                            '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
                            '<https://images.unsplash.com>; rel=preconnect',
                            '<https://axuegixbqsvztdraenkz.supabase.co>; rel=preconnect',
                            '<https://api.dicebear.com>; rel=preconnect',
                        ].join(', '),
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: process.env.NODE_ENV === 'production'
                            ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'sha256-4BWJxWgPHEvzPzX0hVQ+YqV0o1zV0o3RlX+qV5mGkX='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co https://grainy-gradients.vercel.app https://i.pravatar.cc https://api.dicebear.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
                            : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co https://grainy-gradients.vercel.app https://i.pravatar.cc https://api.dicebear.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",

                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ];
    },
};

export default withPWA(nextConfig);
