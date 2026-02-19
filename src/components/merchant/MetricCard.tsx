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
        <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        {chip}
                    </span>
                    <div className="flex flex-col items-end mt-[14px]">
                        <h3 className="text-4xl font-bold text-gray-900 tracking-tight leading-none">{displayValue}</h3>
                        {isETB && <span className="text-xs font-bold text-gray-400 mt-1">ETB</span>}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
                <div className="mb-3">
                    <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">{label}</h3>
                    <p className="text-gray-400 text-xs font-medium">{subLabel}</p>
                </div>
                <div className="flex justify-between items-center gap-1">
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
