import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
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
      urlPattern: /^https:\/\/.*(?:unsplash\.com|supabase\.co)\/.*(?:png|jpg|jpeg|webp|svg|gif|avif).*$/i,
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
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
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
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://images.unsplash.com https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

export default withPWA(nextConfig);

