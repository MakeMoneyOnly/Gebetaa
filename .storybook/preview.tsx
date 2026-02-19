/**
 * Storybook Preview Configuration
 * 
 * Configures the global decorators, theme, and styling for Storybook.
 */

import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        nextjs: {
            appDirectory: true,
        },
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#ffffff' },
                { name: 'gray', value: '#f3f4f6' },
                { name: 'dark', value: '#1f2937' },
                { name: 'primary', value: '#16a34a' }, // Ethiopian green
            ],
        },
        themes: {
            default: 'light',
            list: [
                { name: 'light', class: '', color: '#ffffff' },
                { name: 'dark', class: 'dark', color: '#1f2937' },
            ],
        },
    },
    decorators: [
        (Story) => (
            <div className="p-4">
                <Story />
            </div>
        ),
    ],
};

export default preview;