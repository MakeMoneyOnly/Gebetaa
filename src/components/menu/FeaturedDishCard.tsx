'use client';

import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import type { MenuItem, RestaurantWithMenu } from '@/types/database';
import { Plus, Leaf, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    item: MenuItem;
    restaurant: RestaurantWithMenu;
    onClick?: () => void;
}

/**
 * FeaturedDishCard - Premium visual treatment for chef specials
 * Restored original "Complex Conic Glow" design as requested
 */
export function FeaturedDishCard({ item, restaurant, onClick }: Props) {
    const { addItem } = useCart();
    const { language } = useLanguage();

    const name = language === 'am' && item.name_am ? item.name_am : item.name;
    const description = language === 'am' && item.description_am ? item.description_am : (item.description || `A chef-crafted masterpiece of ${item.name}, prepared with premium local ingredients.`);
    const currencySymbol = restaurant.currency_symbol || 'Br';
    const rating = (4.0 + (parseInt(item.id.replace(/\D/g, '').slice(0, 2) || '50', 10) % 10) / 10).toFixed(1);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    return (
        <motion.div
            className="snap-center shrink-0 w-[240px] relative mt-16 mb-8 group cursor-pointer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.5 }}
            onClick={onClick}
        >
            {/* --- COMPLEX CONIC GLOW BORDER (Search Style) --- */}
            {/* Layer 1: Outer glow */}
            <div className="absolute z-[-1] -inset-[1px] overflow-hidden rounded-[54px] blur-[2px] opacity-100 transition-opacity duration-500
                            before:absolute before:inset-[-100%] before:bg-[conic-gradient(#000,#5AA315_5%,#000_38%,#000_50%,var(--brand-color)_60%,#000_87%)]
                            before:animate-[spin_4s_linear_infinite]" />

            {/* Layer 2: Inner sharp border */}
            <div className="absolute z-[-1] -inset-[0.5px] overflow-hidden rounded-[52px] blur-[0.3px] opacity-100 transition-opacity duration-500
                            before:absolute before:inset-[-100%] before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#6EBD1F,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#B4F578,rgba(0,0,0,0)_58%)]
                            before:animate-[spin_3s_linear_infinite]" />

            {/* Main Luxury Card Container */}
            <div
                className="relative rounded-[52px] pt-16 pb-[21px] px-6 flex flex-col items-center shadow-2xl transition-all group-hover:border-white/20"
                style={{
                    background: 'var(--surface-2)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >

                {/* Floating Circular Item */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-[145px] h-[145px] z-10">
                    <div
                        className="w-full h-full rounded-full overflow-hidden border-[6px] shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                        style={{
                            borderColor: 'var(--surface-2)',
                            background: 'var(--surface-3)'
                        }}
                    >
                        {item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Leaf className="w-10 h-10" style={{ color: 'var(--text-4)' }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Signature Content */}
                <div className="mt-8 w-full text-center">
                    <h3
                        className="font-black tracking-tighter leading-tight mb-1 line-clamp-1"
                        style={{
                            fontSize: '20px',
                            color: 'var(--brand-color)'
                        }}
                    >
                        {name}
                    </h3>

                    <div
                        className="font-black tracking-tight mb-2"
                        style={{
                            fontSize: '18px',
                            color: 'var(--text-1)'
                        }}
                    >
                        {currencySymbol} {item.price.toLocaleString()}
                    </div>

                    <p
                        className="font-medium leading-normal line-clamp-2 text-left mb-[15px] opacity-80 px-2"
                        style={{
                            fontSize: '14px',
                            color: 'var(--text-3)'
                        }}
                    >
                        {description}
                    </p>

                    {/* Footer Layout */}
                    <div className="flex items-center justify-between w-full pt-1">
                        <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--brand-color)' }} />
                            <span className="font-bold" style={{ fontSize: '13px', color: 'var(--text-1)' }}>{rating}</span>
                            <span className="font-medium ml-0.5" style={{ fontSize: '11px', color: 'var(--text-3)' }}>Ratings</span>
                        </div>

                        {/* Small Circular Add Button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAdd}
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group/btn"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'var(--text-1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--brand-color)';
                                e.currentTarget.style.borderColor = 'var(--brand-color)';
                                e.currentTarget.style.color = '#000';
                                e.currentTarget.style.boxShadow = `0 0 20px var(--brand-color)`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = 'var(--text-1)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <Plus className="w-5 h-5 stroke-[3]" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
