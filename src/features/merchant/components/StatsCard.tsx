import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    icon?: LucideIcon;
    mainValue: string;
    secondaryValue?: string;
    trendLabel?: string;
    trendDirection?: 'up' | 'down';
    variant?: 'default' | 'highlight' | 'glass';
    className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    icon: Icon,
    mainValue,
    secondaryValue,
    trendLabel,
    trendDirection = 'up',
    variant = 'default',
    className,
}) => {
    return (
        <Card
            variant={variant === 'glass' ? 'glass' : 'default'}
            className={cn(
                'relative overflow-hidden transition-all duration-300 hover:-translate-y-1',
                variant === 'default' && 'border-none',
                variant === 'highlight' &&
                    'from-brand-accent shadow-glow-crimson bg-gradient-to-br to-red-600 text-white',
                className
            )}
        >
            <div className="mb-6 flex items-start justify-between">
                <h3
                    className={cn(
                        'text-sm font-bold tracking-wider uppercase',
                        variant === 'highlight'
                            ? 'text-white/80'
                            : 'text-zinc-500 dark:text-zinc-400'
                    )}
                >
                    {title}
                </h3>
                {Icon && (
                    <div
                        className={cn(
                            'rounded-xl p-2.5 backdrop-blur-sm',
                            variant === 'highlight'
                                ? 'bg-white/20 text-white'
                                : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                    <h2
                        className={cn(
                            'text-4xl font-black tracking-tight',
                            variant === 'highlight' ? 'text-white' : 'text-zinc-900 dark:text-white'
                        )}
                    >
                        {mainValue}
                    </h2>
                    {secondaryValue && (
                        <span
                            className={cn(
                                'text-sm font-bold',
                                variant === 'highlight' ? 'text-white/70' : 'text-zinc-400'
                            )}
                        >
                            {secondaryValue}
                        </span>
                    )}
                </div>

                {trendLabel && (
                    <div
                        className={cn(
                            'mt-2 flex items-center gap-1 text-xs font-semibold',
                            // Trend logic
                            trendDirection === 'up' &&
                                (variant === 'highlight' ? 'text-white' : 'text-green-600'),
                            trendDirection === 'down' &&
                                (variant === 'highlight' ? 'text-white' : 'text-red-600')
                        )}
                    >
                        <span>{trendDirection === 'up' ? '↗' : '↘'}</span>
                        <span>{trendLabel}</span>
                    </div>
                )}
            </div>

            {/* Decorative Background Element for Premium feel */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl" />
        </Card>
    );
};
