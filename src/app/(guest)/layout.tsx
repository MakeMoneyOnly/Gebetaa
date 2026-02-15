import React from 'react';

export default function GuestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Guest Layout - Focused on the dining/ordering experience */}
            {/* Minimal chrome to avoid distractions */}
            {children}
        </div>
    );
}
