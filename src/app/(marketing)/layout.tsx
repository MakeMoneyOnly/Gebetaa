import React from 'react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-surface-0 flex min-h-screen flex-col">
            {/* Public Layout wrapper - could add Header/Footer here if needed */}
            {/* Currently acts as a pass-through but isolates public pages */}
            {children}

            {/* Example: A simple footer for public pages */}
            <footer className="text-text-tertiary py-6 text-center text-xs">
                <p>© 2026 Gebeta. All rights reserved.</p>
            </footer>
        </div>
    );
}
