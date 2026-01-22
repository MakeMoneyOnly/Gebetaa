'use client';

import type { RestaurantWithMenu } from '@/types/database';
import { Leaf, MapPin } from 'lucide-react';
import { useFasting } from '@/context/FastingContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    restaurant: RestaurantWithMenu;
    tableNumber: string | null;
}

/**
 * MenuHeader - Fixed header with restaurant branding and fasting toggle
 */
export function MenuHeader({ restaurant, tableNumber }: Props) {
    const { isFastingMode, toggleFasting } = useFasting();
    const { language } = useLanguage();

    return (
        <header
            className="fixed top-0 left-0 right-0 z-[100]"
            style={{
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-1)',
                height: 'var(--header-height)'
            }}
        >
            <div className="flex justify-between items-center h-full px-4 max-w-lg mx-auto">
                {/* Brand Identity */}
                <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="relative">
                        <div
                            className="h-11 w-11 rounded-[var(--radius-md)] overflow-hidden flex items-center justify-center shadow-lg"
                            style={{
                                background: 'var(--surface-3)',
                                border: '1px solid var(--border-2)'
                            }}
                        >
                            {restaurant.logo_url ? (
                                <img
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span
                                    className="text-lg font-bold"
                                    style={{ color: 'var(--brand-color)' }}
                                >
                                    {restaurant.name.charAt(0)}
                                </span>
                            )}
                        </div>

                        {/* Fasting Badge on Logo */}
                        <AnimatePresence>
                            {isFastingMode && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -bottom-0.5 -right-0.5 z-20 h-5 w-5 rounded-full flex items-center justify-center shadow-md"
                                    style={{
                                        background: 'var(--brand-color)',
                                        border: '2px solid var(--surface-1)'
                                    }}
                                >
                                    <Leaf className="w-2.5 h-2.5 text-black fill-black" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Restaurant Info */}
                    <div className="flex flex-col justify-center">
                        <span
                            className="text-caption mb-0.5 font-bold tracking-tight"
                            style={{ color: 'var(--text-3)', fontSize: '10px', textTransform: 'uppercase' }}
                        >
                            {tableNumber
                                ? `${language === 'am' ? 'ጠረጴዛ' : 'Table'} ${tableNumber}`
                                : (language === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome to')}
                        </span>

                        <h1
                            className="font-black leading-none mb-1 tracking-tight"
                            style={{
                                fontSize: 'var(--text-title)',
                                color: 'var(--text-1)'
                            }}
                        >
                            {restaurant.name}
                        </h1>

                        {restaurant.location && (
                            <div className="flex items-center gap-1">
                                <MapPin
                                    className="w-3 h-3"
                                    style={{ color: 'var(--brand-color)' }}
                                />
                                <span
                                    className="text-caption font-medium"
                                    style={{
                                        color: 'var(--text-3)',
                                        fontSize: '11px'
                                    }}
                                >
                                    {restaurant.location}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fasting Toggle - Restored Design */}
                <button
                    onClick={() => toggleFasting()}
                    className="relative group active:scale-95 transition-transform outline-none"
                >
                    <motion.div
                        className={`
                            h-[30px] px-3 rounded-full flex items-center gap-1.5 border transition-all duration-300
                        `}
                        style={{
                            background: isFastingMode ? 'var(--brand-color)' : 'rgba(255,255,255,0.05)',
                            borderColor: isFastingMode ? 'var(--brand-color)' : 'rgba(255,255,255,0.1)',
                            color: isFastingMode ? '#000' : 'var(--text-3)',
                            boxShadow: isFastingMode ? '0 4px 12px rgba(136, 240, 38, 0.3)' : 'none'
                        }}
                    >
                        <Leaf
                            className={`w-3.5 h-3.5 ${isFastingMode ? 'fill-black' : ''}`}
                            style={{ color: isFastingMode ? '#000' : 'var(--text-4)' }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {isFastingMode
                                ? (language === 'am' ? 'ጾም' : 'FASTING')
                                : (language === 'am' ? 'መደበኛ' : 'REGULAR')}
                        </span>
                    </motion.div>
                </button>
            </div>
        </header>
    );
}
