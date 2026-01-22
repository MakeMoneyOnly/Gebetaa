'use client';

import { ReactNode, useEffect } from 'react';
import { CartProvider, useCart } from '@/context/CartContext';
import type { RestaurantWithMenu } from '@/types/database';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { ServiceRequestButton } from '@/components/service/ServiceRequestButton';

interface Props {
    restaurant: RestaurantWithMenu;
    children: ReactNode;
}

/**
 * Applies restaurant-specific theme tokens to the document
 */
function applyRestaurantTheme(restaurant: RestaurantWithMenu) {
    const root = document.documentElement;
    const brandColor = restaurant.brand_color || '#4ADE80'; // Default to Green
    
    // Set primary brand color
    root.style.setProperty('--brand-color', brandColor);
    
    // Generate light variant (for hover states)
    root.style.setProperty('--brand-color-light', adjustColor(brandColor, 20));
    
    // Generate dark variant (for active states)
    root.style.setProperty('--brand-color-dark', adjustColor(brandColor, -20));
    
    // Update shadow color to match brand
    const rgb = hexToRgb(brandColor);
    if (rgb) {
        root.style.setProperty('--shadow-brand', `0 4px 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
    }
}

/**
 * Adjusts a hex color by a percentage
 * Positive = lighter, Negative = darker
 */
function adjustColor(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const adjust = (value: number) => {
        const adjusted = value + (255 - value) * (percent / 100);
        return Math.min(255, Math.max(0, Math.round(adjusted)));
    };
    
    if (percent < 0) {
        // Darken
        const factor = 1 + percent / 100;
        return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)})`;
    }
    
    return `rgb(${adjust(rgb.r)}, ${adjust(rgb.g)}, ${adjust(rgb.b)})`;
}

/**
 * Converts hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

function RestaurantContent({ restaurant, children }: Props) {
    const { setRestaurantId, setRestaurantSlug, setTableNumber } = useCart();

    // Set restaurant context
    useEffect(() => {
        setRestaurantId(restaurant.id);
        setRestaurantSlug(restaurant.slug);
    }, [restaurant.id, restaurant.slug, setRestaurantId, setRestaurantSlug]);

    // Read table from URL on client side only
    useEffect(() => {
        const urlTableNumber = new URLSearchParams(window.location.search).get('table');
        if (urlTableNumber) {
            setTableNumber(urlTableNumber);
        }
    }, [setTableNumber]);

    // Apply restaurant theme
    useEffect(() => {
        applyRestaurantTheme(restaurant);
        
        // Cleanup on unmount (restore defaults)
        return () => {
            const root = document.documentElement;
            root.style.setProperty('--brand-color', '#4ADE80');
            root.style.setProperty('--brand-color-light', '#86EFAC');
            root.style.setProperty('--brand-color-dark', '#22C55E');
        };
    }, [restaurant.brand_color]);

    return (
        <div 
            className="min-h-screen"
            style={{ background: 'var(--surface-1)' }}
        >
            {children}
            
            {/* Service Dock: Waiter Bell (Left) + Cart (Right) */}
            <ServiceRequestButton />
            <FloatingCartButton />
            
            <CartDrawer restaurant={restaurant} />
        </div>
    );
}

export function RestaurantLayout({ restaurant, children }: Props) {
    return (
        <CartProvider
            initialRestaurantSlug={restaurant.slug}
            initialRestaurantId={restaurant.id}
            initialTableNumber={null}
        >
            <RestaurantContent restaurant={restaurant}>
                {children}
            </RestaurantContent>
        </CartProvider>
    );
}
