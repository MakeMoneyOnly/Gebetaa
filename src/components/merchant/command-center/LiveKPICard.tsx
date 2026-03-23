import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface LiveKPICardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    tone: 'blue' | 'green' | 'amber' | 'rose';
    loading?: boolean;
    error?: string | null;
}

const toneStyles: Record<LiveKPICardProps['tone'], string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
};

export function LiveKPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    tone,
    loading = false,
    error = null,
}: LiveKPICardProps) {
    if (loading) {
        return (
            <div className="card-shadow rounded-4xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="mb-2 h-8 w-24 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="card-shadow rounded-4xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-xl border px-2.5 py-2 ${toneStyles[tone]}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Live
                </span>
            </div>
            <p className="mb-1 text-3xl font-bold tracking-tight text-gray-900">
                {error ? '--' : value}
            </p>
            <p className="text-xs font-medium text-gray-500">
                {title}
                <span className="block pt-1 text-[11px] text-gray-400">
                    {error ? 'Unavailable' : subtitle}
                </span>
            </p>
        </div>
    );
}
