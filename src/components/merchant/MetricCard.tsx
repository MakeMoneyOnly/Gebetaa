import React, { ComponentType } from 'react';

interface MetricCardProps {
    icon: ComponentType<{ className?: string }>;
    chip: string;
    value: string | number;
    label: string;
    subLabel: string;
    tone: 'blue' | 'rose' | 'green' | 'purple' | 'amber'; // Added 'amber' just in case
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
    const toneMap = {
        blue: 'bg-blue-500',
        rose: 'bg-rose-500',
        green: 'bg-green-600',
        purple: 'bg-purple-500',
        amber: 'bg-amber-500',
    };

    const isETB = typeof value === 'string' && value.includes('ETB');
    const displayValue = isETB ? value.toString().replace('ETB', '').trim() : value;

    return (
        <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-2 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                        {chip}
                    </span>
                    <div className="mt-[14px] flex flex-col items-end">
                        <h3 className="text-4xl leading-none font-bold tracking-tight text-gray-900">
                            {displayValue}
                        </h3>
                        {isETB && <span className="mt-1 text-xs font-bold text-gray-400">ETB</span>}
                    </div>
                </div>
            </div>
            <div className="absolute right-5 bottom-5 left-5">
                <div className="mb-3">
                    <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">{label}</h3>
                    <p className="text-xs font-medium text-gray-400">{subLabel}</p>
                </div>
                <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const isActive = i < progress;
                        const opacity = isActive ? 0.3 + 0.7 * (i / Math.max(progress, 1)) : 1;
                        return (
                            <div
                                key={i}
                                style={{ opacity: isActive ? opacity : 1 }}
                                className={`h-[11px] w-[11px] rounded-full ${isActive ? toneMap[tone] || 'bg-gray-500' : 'bg-gray-100'}`}
                            />
                        );
                    })}
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-medium text-gray-400">
                    <span>{targetLabel}</span>
                    <span>{currentLabel}</span>
                </div>
            </div>
        </div>
    );
}
