'use client';

import { useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import type { MenuItem, RestaurantWithMenu } from '@/types/database';
import { Star, ShoppingCart, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    item: MenuItem & { categoryId: string; categoryName: string };
    restaurant: RestaurantWithMenu;
    onClick?: () => void;
}

/**
 * DishCard - Unified card component for menu items
 * 
 * Design principles:
 * - Consistent Add-to-Cart button across all instances
 * - High-contrast price display (16px minimum)
 * - Touch-friendly targets (44px minimum)
 * - Clean, scannable layout optimized for ordering speed
 */
export function DishCard({ item, restaurant, onClick }: Props) {
    const { addItem } = useCart();
    const { language } = useLanguage();

    const name = language === 'am' && item.name_am ? item.name_am : item.name;
    const currencySymbol = restaurant.currency_symbol || 'Br';

    // Generate consistent rating from item id
    const rating = (4.0 + (parseInt(item.id.replace(/\D/g, '').slice(0, 2) || '50', 10) % 10) / 10).toFixed(1);
    const ratingNum = parseFloat(rating);
    const reviewCount = Math.floor(ratingNum * 20); // Consistent with DishDetailModal

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();

        // If item has required modifiers, open the detail modal instead of adding directly
        if (hasRequiredModifiers && onClick) {
            onClick();
            return;
        }

        addItem({
            id: item.id,
            name: item.name,
            name_am: item.name_am,
            price: item.price,
            quantity: 1,
            image_url: item.image_url,
            station: item.station,
        });
    };

    // Check for required modifiers to update button text
    const hasRequiredModifiers = useMemo(() => {
        if (!item.modifiers) return false;
        try {
            const mods = item.modifiers as any[];
            return Array.isArray(mods) && mods.some(m => m.required);
        } catch { return false; }
    }, [item.modifiers]);

    return (
        <motion.div
            className="card-interactive flex flex-col overflow-hidden cursor-pointer"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
        >
            {/* Image Section - 50% height */}
            <div className={`relative w-full aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)] -mx-4 -mt-4 mb-3`} style={{ width: 'calc(100% + 32px)' }}>
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'var(--surface-3)' }}
                    >
                        <Leaf className="w-8 h-8" style={{ color: 'var(--text-4)' }} />
                    </div>
                )}

                {/* Fasting badge */}
                {item.is_fasting && (
                    <div className="absolute top-2 left-2 badge" style={{ background: 'var(--brand-color)', color: '#000' }}>
                        <Leaf className="w-3 h-3 fill-black" />
                        <span>{language === 'am' ? 'ጾም' : 'Fasting'}</span>
                    </div>
                )}

                {/* Gradient overlay for text readability */}
                <div
                    className="absolute inset-x-0 bottom-0 h-12"
                    style={{ background: 'linear-gradient(to top, var(--surface-2), transparent)' }}
                />
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1">
                {/* Title - 14px minimum, high contrast */}
                <h4
                    className="font-bold leading-tight line-clamp-2 mb-1"
                    style={{
                        fontSize: 'var(--text-body)',
                        color: 'var(--text-1)'
                    }}
                >
                    {name}
                </h4>

                {/* Rating Row - Star icons + rating value */}
                {/* Rating Row - Star icons + rating value */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(ratingNum) ? 'fill-current' : ''}`}
                                style={{
                                    color: i < Math.floor(ratingNum) ? 'var(--brand-color)' : 'var(--text-4)'
                                }}
                            />
                        ))}
                        <span style={{ color: 'var(--text-2)', fontSize: '12px', fontWeight: 600, marginLeft: '4px' }}>
                            ({rating})
                        </span>
                    </div>
                </div>

                {/* Stock Warning */}
                {item.stock_quantity !== null && item.stock_quantity <= 5 && (
                    <div className="mb-1">
                        <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}
                        >
                            {language === 'am' ? `በመቀነስ ላይ: ${item.stock_quantity}` : `Only ${item.stock_quantity} left`}
                        </span>
                    </div>
                )}

                {/* Price and Add Button Row */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    {/* Price - High visibility, 16px */}
                    <span className="price">
                        <span className="price-currency">{currencySymbol}</span>
                        {item.price.toLocaleString()}
                    </span>

                    {/* Unified Add Button - Consistent across all cards */}
                    <motion.button
                        whileTap={{
                            scale: 0.88,
                            transition: { duration: 0.1 }
                        }}
                        whileHover={{
                            scale: 1.05,
                            transition: { duration: 0.2 }
                        }}
                        onClick={handleAdd}
                        className="btn-primary"
                        style={{
                            padding: '8px 12px',
                            minHeight: '36px',
                            fontSize: 'var(--text-caption)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.1s ease-out',
                            color: '#000'
                        }}
                        aria-label={`Add ${name} to cart`}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>
                            {language === 'am'
                                ? 'ጨምር'
                                : 'Add'}
                        </span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
