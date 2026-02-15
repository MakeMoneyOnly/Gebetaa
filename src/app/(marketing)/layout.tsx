import React from 'react';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-surface-0 flex flex-col">
            {/* Public Layout wrapper - could add Header/Footer here if needed */}
            {/* Currently acts as a pass-through but isolates public pages */}
            {children}

            {/* Example: A simple footer for public pages */}
            <footer className="py-6 text-center text-xs text-text-tertiary">
                <p>© 2026 Gebeta. All rights reserved.</p>
            </footer>
        </div>
    );
}
