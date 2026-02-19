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
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.next/',
                'src/**/*.d.ts',
                'src/**/*.test.ts',
                'src/**/*.test.tsx',
                'src/**/*.spec.ts',
                'src/**/*.spec.tsx',
                'src/types/**',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 70,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
