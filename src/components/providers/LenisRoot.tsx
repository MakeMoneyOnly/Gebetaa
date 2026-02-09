'use client';

import { ReactNode } from 'react';
import { ReactLenis } from 'lenis/react';

export function LenisRoot({ children }: { children: ReactNode }) {
    return (
        <ReactLenis root>
            {children}
        </ReactLenis>
    );
}
