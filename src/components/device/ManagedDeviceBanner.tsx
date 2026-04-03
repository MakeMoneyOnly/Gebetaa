'use client';

import { Cpu, Route, ShieldCheck } from 'lucide-react';
import { getDeviceShellSummary } from '@/lib/devices/shell';
import type { StoredDeviceSession } from '@/lib/mobile/device-storage';

export function ManagedDeviceBanner(args: {
    session: StoredDeviceSession | null;
    routeLabel: string;
    className?: string;
}) {
    if (!args.session) {
        return null;
    }

    const summary = getDeviceShellSummary(args.session);

    return (
        <div
            className={`overflow-hidden rounded-[1.75rem] border border-black/5 bg-white/88 p-4 shadow-[0_18px_50px_rgba(23,18,11,0.08)] backdrop-blur ${args.className ?? ''}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-3 py-1 text-[10px] font-black tracking-[0.22em] text-[var(--color-brand-ink-strong)] uppercase">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Managed Device
                    </div>
                    <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-[var(--color-brand-ink-strong)]">
                        {summary.deviceName}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-[var(--color-brand-neutral)]">
                        {summary.profileLabel} mode is active for {args.routeLabel}.
                    </p>
                </div>

                <div className="grid min-w-[240px] gap-2 text-sm text-[var(--color-brand-neutral)] sm:grid-cols-2">
                    <div className="rounded-[1.2rem] bg-[var(--color-brand-canvas)] px-3 py-2">
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.22em] uppercase">
                            <Cpu className="h-3.5 w-3.5 text-[var(--color-brand-ember)]" />
                            Profile
                        </div>
                        <p className="mt-2 font-bold text-[var(--color-brand-ink-strong)]">
                            {summary.typeLabel}
                        </p>
                    </div>
                    <div className="rounded-[1.2rem] bg-[var(--color-brand-canvas)] px-3 py-2">
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.22em] uppercase">
                            <Route className="h-3.5 w-3.5 text-[var(--color-brand-ember)]" />
                            Launch Path
                        </div>
                        <p className="mt-2 font-bold text-[var(--color-brand-ink-strong)]">
                            {summary.launchPath}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
