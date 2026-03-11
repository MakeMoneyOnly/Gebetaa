import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
        exclude: ['node_modules/', '.next/'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                '.next/',
                'src/**/*.d.ts',
                'src/**/*.test.ts',
                'src/**/*.test.tsx',
                'src/**/*.spec.ts',
                'src/**/*.spec.tsx',
                'src/types/**',
                // API routes require integration/e2e tests, not unit tests
                'src/app/api/**',
                // Next.js page/layout entry files (not unit-testable)
                'src/app/**/page.tsx',
                'src/app/**/layout.tsx',
                'src/app/**/loading.tsx',
                'src/app/**/error.tsx',
                'src/app/**/not-found.tsx',
                // Config and build-time scripts
                'src/lib/config/**',
                'src/scripts/**',
            ],
            // Thresholds apply only to testable (non-excluded) units
            // Phase 2 target (after API tests): 70%
            // Phase 3 target (full audit compliance): 80%
            thresholds: {
                lines: 60,
                functions: 60,
                statements: 60,
                branches: 45,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
