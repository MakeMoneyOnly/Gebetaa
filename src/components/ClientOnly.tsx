'use client';

import { ReactNode, useState, useEffect } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * ClientOnly wrapper prevents hydration mismatches by only rendering
 * children after the component has mounted on the client.
 * This is useful for components that rely on browser APIs or dynamic content.
 */
export function ClientOnly({ children, fallback = null }: Props) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
