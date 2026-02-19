/**
 * Storybook Main Configuration
 * 
 * Addresses PLATFORM_AUDIT finding CODE-2: No component storybook
 * 
 * This configuration sets up Storybook for the Gebeta Restaurant OS project
 * with Next.js, Tailwind CSS, and TypeScript support.
 */

import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
    stories: [
        '../src/**/*.mdx',
        '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    ],
    addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-onboarding',
        '@storybook/addon-interactions',
        '@chromatic-com/storybook',
    ],
    framework: {
        name: '@storybook/nextjs',
        options: {},
    },
    staticDirs: ['../public'],
    docs: {
        autodocs: 'tag',
    },
    typescript: {
        check: true,
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: (prop) => 
                prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
        },
    },
    env: (config) => ({
        ...config,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    }),
    webpackFinal: async (config) => {
        // Add any custom webpack configuration here
        return config;
    },
};

export default config;