/**
 * Button Component Stories
 *
 * Example Storybook stories for the Button component.
 * Run `pnpm storybook` to view these stories.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * Button component for user interactions.
 *
 * Supports multiple variants, sizes, and states.
 */
const meta: Meta<typeof Button> = {
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'glass', 'ghost', 'danger'],
            description: 'Visual style variant',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Button size',
        },
        disabled: {
            control: 'boolean',
            description: 'Whether the button is disabled',
        },
        loading: {
            control: 'boolean',
            description: 'Whether the button is in a loading state',
        },
        children: {
            control: 'text',
            description: 'Button content',
        },
    },
    args: {
        children: 'Button',
        variant: 'primary',
        size: 'md',
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary button - default style for main actions
 */
export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary Button',
    },
};

/**
 * Secondary button - for less prominent actions
 */
export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary Button',
    },
};

/**
 * Glass button - with glass morphism effect
 */
export const Glass: Story = {
    args: {
        variant: 'glass',
        children: 'Glass Button',
    },
};

/**
 * Ghost button - minimal style, transparent background
 */
export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Ghost Button',
    },
};

/**
 * Danger button - for dangerous actions like delete
 */
export const Danger: Story = {
    args: {
        variant: 'danger',
        children: 'Delete',
    },
};

/**
 * Small size button
 */
export const Small: Story = {
    args: {
        size: 'sm',
        children: 'Small Button',
    },
};

/**
 * Large size button
 */
export const Large: Story = {
    args: {
        size: 'lg',
        children: 'Large Button',
    },
};

/**
 * Button in loading state
 */
export const Loading: Story = {
    args: {
        loading: true,
        children: 'Loading...',
    },
};

/**
 * Disabled button
 */
export const Disabled: Story = {
    args: {
        disabled: true,
        children: 'Disabled Button',
    },
};

/**
 * Button with icon
 */
export const WithIcon: Story = {
    args: {
        children: (
            <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                Add Item
            </>
        ),
    },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
    args: {
        className: 'w-full',
        children: 'Full Width Button',
    },
};

/**
 * All variants displayed together for comparison
 */
export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
        </div>
    ),
};

/**
 * All sizes displayed together for comparison
 */
export const AllSizes: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
        </div>
    ),
};
