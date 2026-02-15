'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'dropdown';
    themes?: string[];
    showLabel?: boolean;
    className?: string;
}

export function Theme({
    size = 'md',
    variant = 'dropdown',
    themes = ['light', 'dark', 'system'],
    showLabel = false,
    className,
}: ThemeProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn('h-10 w-10', className)} />;
    }

    const currentTheme = themes.includes(theme || '') ? theme : 'system';

    const icons = {
        light: <Sun className="h-full w-full" />,
        dark: <Moon className="h-full w-full" />,
        system: <Laptop className="h-full w-full" />,
    };

    const labels = {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
    };

    const sizeClasses = {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
    };

    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    return (
        <div className={cn('relative inline-block', className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-2 rounded-full bg-white dark:bg-black p-2 md:px-4 md:py-2 backdrop-blur-md transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 shadow-lg shadow-black/5 dark:shadow-none',
                    'text-foreground dark:text-white',
                    sizeClasses[size]
                )}
            >
                <div className={cn(iconSizes[size])}>
                    {icons[currentTheme as keyof typeof icons] || icons.system}
                </div>
                {showLabel && (
                    <span className="font-bold tracking-tight">
                        {labels[currentTheme as keyof typeof labels] || 'System'}
                    </span>
                )}
                <ChevronDown className={cn('opacity-60 dark:opacity-40 transition-transform', isOpen && 'rotate-180', 'h-3 w-3')} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 z-[101] min-w-[140px] overflow-hidden rounded-2xl bg-white dark:bg-black p-1 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95">
                        {themes.map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setTheme(t);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all hover:bg-black/5 dark:hover:bg-white/10',
                                    theme === t
                                        ? 'text-foreground dark:text-white bg-black/5 dark:bg-white/5'
                                        : 'text-foreground/50 dark:text-white/40'
                                )}
                            >
                                <div className="h-4 w-4">
                                    {icons[t as keyof typeof icons]}
                                </div>
                                {labels[t as keyof typeof labels]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
