'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    ChefHat,
    Loader2,
    MonitorSpeaker,
    Printer,
    QrCode,
    ShieldCheck,
    Store,
    TabletSmartphone,
} from 'lucide-react';
import { getDeviceProfileLabel } from '@/lib/devices/config';
import { getDeviceShellSummary } from '@/lib/devices/shell';
import {
    clearDeviceSession,
    clearPrinterSelection,
    getStoredDeviceSession,
    getStoredPrinterSelection,
    type StoredDeviceSession,
    type StoredPrinterSelection,
} from '@/lib/mobile/device-storage';

const PROFILE_ART = {
    cashier: {
        icon: Store,
        eyebrow: 'Cashier Terminal',
        blurb: 'Checkout, receipt printing, and front-counter settlement.',
    },
    waiter: {
        icon: TabletSmartphone,
        eyebrow: 'Waiter Flow',
        blurb: 'Tableside ordering, guest pacing, and service requests.',
    },
    kds: {
        icon: ChefHat,
        eyebrow: 'Kitchen Display',
        blurb: 'Active order grid, completion toggles, and kitchen handoff.',
    },
    kiosk: {
        icon: QrCode,
        eyebrow: 'Self-Service Kiosk',
        blurb: 'Guest-facing ordering and QR-led payment collection.',
    },
} as const;

export function ManagedDeviceShell() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<StoredDeviceSession | null>(null);
    const [printer, setPrinter] = useState<StoredPrinterSelection | null>(null);
    const [hasLaunched, setHasLaunched] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const [storedSession, storedPrinter] = await Promise.all([
                    getStoredDeviceSession(),
                    getStoredPrinterSelection(),
                ]);

                if (cancelled) {
                    return;
                }

                setSession(storedSession);
                setPrinter(storedPrinter);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const shellSummary = useMemo(() => {
        return session ? getDeviceShellSummary(session) : null;
    }, [session]);

    useEffect(() => {
        if (!shellSummary?.launchPath || hasLaunched) {
            return;
        }

        const timer = window.setTimeout(() => {
            setHasLaunched(true);
            router.replace(shellSummary.launchPath);
        }, 1200);

        return () => window.clearTimeout(timer);
    }, [hasLaunched, router, shellSummary]);

    const profileConfig =
        PROFILE_ART[
            (session?.device_profile as keyof typeof PROFILE_ART | undefined) ?? 'waiter'
        ] ?? PROFILE_ART.waiter;
    const ProfileIcon = profileConfig.icon;

    if (isLoading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-[var(--color-brand-canvas)] text-[var(--color-brand-ink)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(221,248,83,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(227,65,5,0.18),_transparent_28%),linear-gradient(135deg,_rgba(23,11,5,0.06),_transparent)]" />
                <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
                    <div className="rounded-[2rem] bg-white/80 px-8 py-7 shadow-[0_24px_80px_rgba(23,18,11,0.12)] backdrop-blur">
                        <div className="flex items-center gap-3 text-sm font-black tracking-[0.22em] text-[var(--color-brand-ember)] uppercase">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Preparing device shell
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || !shellSummary) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-[var(--color-brand-canvas)] text-[var(--color-brand-ink)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(221,248,83,0.25),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(227,65,5,0.2),_transparent_30%),linear-gradient(135deg,_rgba(23,11,5,0.06),_transparent)]" />
                <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
                    <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <section className="space-y-6">
                            <p className="text-[11px] font-black tracking-[0.28em] text-[var(--color-brand-ember)] uppercase">
                                Managed Hardware
                            </p>
                            <h1 className="max-w-xl text-5xl font-black tracking-[-0.05em] text-[var(--color-brand-ink-strong)] md:text-6xl">
                                This device still needs to be paired.
                            </h1>
                            <p className="max-w-2xl text-base leading-7 font-medium text-[var(--color-brand-neutral)] md:text-lg">
                                The shared shell is ready, but there is no stored device identity on
                                this tablet yet. Finish provisioning from the merchant dashboard and
                                return here to boot directly into the assigned mode.
                            </p>
                        </section>

                        <section className="rounded-[2rem] bg-white/82 p-7 shadow-[0_28px_100px_rgba(23,18,11,0.12)] backdrop-blur">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[var(--color-brand-accent)] text-[var(--color-brand-ink-strong)] shadow-[0_18px_40px_rgba(221,248,83,0.28)]">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <p className="mt-5 text-[11px] font-black tracking-[0.24em] text-[var(--color-brand-neutral)] uppercase">
                                Next Step
                            </p>
                            <p className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--color-brand-ink-strong)]">
                                Open the restaurant-specific setup link and enter the pairing code.
                            </p>
                            <p className="mt-3 text-sm leading-6 font-medium text-[var(--color-brand-neutral)]">
                                Once paired, this shell will remember the printer, role, and launch
                                path on every reboot.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--color-brand-canvas)] text-[var(--color-brand-ink)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(221,248,83,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(227,65,5,0.16),_transparent_28%),linear-gradient(135deg,_rgba(23,11,5,0.06),_transparent)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-black/10" />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-10 lg:px-10">
                <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[11px] font-black tracking-[0.24em] text-[var(--color-brand-ember)] uppercase shadow-[0_12px_30px_rgba(23,18,11,0.08)] backdrop-blur">
                            <ShieldCheck className="h-4 w-4" />
                            Shared Device Shell
                        </div>

                        <div className="space-y-4">
                            <p className="text-[11px] font-black tracking-[0.28em] text-[var(--color-brand-neutral)] uppercase">
                                {profileConfig.eyebrow}
                            </p>
                            <h1 className="max-w-2xl text-5xl font-black tracking-[-0.05em] text-[var(--color-brand-ink-strong)] md:text-6xl">
                                Launching {shellSummary.profileLabel} mode for{' '}
                                {shellSummary.deviceName}.
                            </h1>
                            <p className="max-w-2xl text-base leading-7 font-medium text-[var(--color-brand-neutral)] md:text-lg">
                                {profileConfig.blurb} The shell is reading the paired device state
                                and sending this hardware to the correct workspace automatically.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.65rem] bg-white/84 p-4 shadow-[0_18px_50px_rgba(23,18,11,0.08)] backdrop-blur">
                                <ProfileIcon className="h-5 w-5 text-[var(--color-brand-ember)]" />
                                <p className="mt-4 text-sm font-bold text-[var(--color-brand-ink-strong)]">
                                    {shellSummary.profileLabel}
                                </p>
                                <p className="mt-1 text-sm text-[var(--color-brand-neutral)]">
                                    {shellSummary.typeLabel}
                                </p>
                            </div>
                            <div className="rounded-[1.65rem] bg-white/84 p-4 shadow-[0_18px_50px_rgba(23,18,11,0.08)] backdrop-blur">
                                <Printer className="h-5 w-5 text-[var(--color-brand-ember)]" />
                                <p className="mt-4 text-sm font-bold text-[var(--color-brand-ink-strong)]">
                                    {printer?.device_name?.trim() || 'Printer memory ready'}
                                </p>
                                <p className="mt-1 text-sm text-[var(--color-brand-neutral)]">
                                    {printer?.connection_type
                                        ? `${printer.connection_type.toUpperCase()} auto-connect`
                                        : 'No printer selected yet'}
                                </p>
                            </div>
                            <div className="rounded-[1.65rem] bg-white/84 p-4 shadow-[0_18px_50px_rgba(23,18,11,0.08)] backdrop-blur">
                                <MonitorSpeaker className="h-5 w-5 text-[var(--color-brand-ember)]" />
                                <p className="mt-4 text-sm font-bold text-[var(--color-brand-ink-strong)]">
                                    {shellSummary.managedModeLabel}
                                </p>
                                <p className="mt-1 text-sm text-[var(--color-brand-neutral)]">
                                    Boot target {shellSummary.launchPath}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.95)),var(--background-image-brand-panel-dark)] p-6 shadow-[0_28px_100px_rgba(23,18,11,0.12)] backdrop-blur">
                        <div className="rounded-[1.8rem] bg-[var(--color-brand-surface-dark)] p-6 text-white shadow-[0_16px_60px_rgba(23,18,11,0.28)]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-black tracking-[0.24em] text-white/55 uppercase">
                                        Launch Queue
                                    </p>
                                    <p className="mt-2 text-2xl font-black tracking-[-0.03em]">
                                        Native handoff in progress
                                    </p>
                                </div>
                                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-accent)]" />
                            </div>

                            <div className="mt-6 space-y-3">
                                {(['cashier', 'waiter', 'kds', 'kiosk'] as const).map(profile => {
                                    const active = session.device_profile === profile;
                                    return (
                                        <div
                                            key={profile}
                                            className={`flex items-center justify-between rounded-[1.25rem] px-4 py-3 transition-all ${
                                                active
                                                    ? 'bg-white text-[var(--color-brand-ink-strong)]'
                                                    : 'bg-white/6 text-white/62'
                                            }`}
                                        >
                                            <span className="text-sm font-bold">
                                                {getDeviceProfileLabel(profile)}
                                            </span>
                                            <span className="text-xs font-black tracking-[0.2em] uppercase">
                                                {active ? 'Assigned' : 'Standby'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => router.replace(shellSummary.launchPath)}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--color-brand-accent)] px-5 py-4 text-sm font-black text-[var(--color-brand-ink-strong)] shadow-[0_20px_48px_rgba(221,248,83,0.22)] transition-transform hover:scale-[1.01]"
                            >
                                Launch Now
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link
                                href={shellSummary.launchPath}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black tracking-[0.2em] text-[var(--color-brand-ink-strong)] uppercase shadow-[0_10px_26px_rgba(23,18,11,0.08)]"
                            >
                                Open target route
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <button
                                onClick={async () => {
                                    await clearDeviceSession();
                                    await clearPrinterSelection();
                                    router.refresh();
                                }}
                                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-black tracking-[0.2em] text-[var(--color-brand-neutral)] uppercase shadow-[0_10px_26px_rgba(23,18,11,0.06)]"
                            >
                                Clear local pairing
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
