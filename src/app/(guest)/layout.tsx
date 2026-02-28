import React from 'react';

// Force dynamic rendering for all guest pages to avoid build-time errors
export const dynamic = 'force-dynamic';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-[var(--background)]">
            {/* Guest Layout - Focused on the dining/ordering experience */}
            {/* Minimal chrome to avoid distractions */}
            {children}
        </div>
    );
}
