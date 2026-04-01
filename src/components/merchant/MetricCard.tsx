import React, { ComponentType } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    icon: ComponentType<{ className?: string }>;
    chip: string | number;
    value: string | number;
    label: string;
    subLabel: string;
    tone: 'blue' | 'rose' | 'green' | 'purple' | 'amber' | 'neutral';
    progress?: number;
    targetLabel?: string;
    currentLabel?: string;
}

export function MetricCard({
    icon: Icon,
    chip,
    value,
    label,
    subLabel,
    tone,
    progress = 0,
    targetLabel = 'Target: N/A',
    currentLabel = 'Current: -',
}: MetricCardProps) {
    const colors: Record<string, { text: string; bg: string; light: string; chipText?: string }> = {
        blue: { text: 'text-blue-600', bg: 'bg-blue-500', light: 'bg-blue-50' },
        rose: { text: 'text-rose-600', bg: 'bg-rose-500', light: 'bg-rose-50' },
        green: { text: 'text-green-600', bg: 'bg-green-500', light: 'bg-green-50' },
        purple: { text: 'text-purple-600', bg: 'bg-purple-500', light: 'bg-purple-50' },
        amber: { text: 'text-orange-600', bg: 'bg-orange-500', light: 'bg-orange-50' },
        neutral: {
            text: 'text-gray-900',
            bg: 'bg-gray-800',
            light: 'bg-gray-100',
            chipText: 'text-gray-600',
        },
    };

    const color = colors[tone] || colors.blue;

    const isETB = typeof value === 'string' && value.includes('ETB');
    let displayValue = value;
    if (isETB && typeof value === 'string') {
        displayValue = value.replace('ETB', '').trim();
    } else if (typeof value === 'number') {
        displayValue = new Intl.NumberFormat('en', {
            notation: 'compact',
            compactDisplay: 'short',
        }).format(value);
    }

    return (
        <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-4xl border-b border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-2 flex items-start justify-between">
                <div
                    className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm',
                        tone === 'neutral' ? 'text-gray-900' : color.text
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span
                        className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase',
                            color.light,
                            color.chipText || color.text
                        )}
                    >
                        {chip}
                    </span>
                    <h3 className="mt-5 text-4xl font-bold tracking-tight text-gray-900">
                        {displayValue}
                    </h3>
                </div>
            </div>

            <div className="absolute right-5 bottom-5 left-5">
                <div className="mb-3">
                    <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">{label}</h3>
                    <p className="text-xs font-medium text-gray-400">{subLabel}</p>
                </div>

                <div className="mb-2 flex justify-between text-[10px] font-medium text-gray-400">
                    <span>{targetLabel}</span>
                    <span>{currentLabel}</span>
                </div>

                <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const isActive = i < progress;
                        const opacity = isActive ? 0.3 + 0.7 * (i / Math.max(progress, 1)) : 1;

                        return (
                            <div
                                key={i}
                                style={{ opacity: isActive ? opacity : 1 }}
                                className={cn(
                                    'h-[15px] w-[15px] rounded-full',
                                    isActive ? color.bg : 'bg-gray-100'
                                )}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
