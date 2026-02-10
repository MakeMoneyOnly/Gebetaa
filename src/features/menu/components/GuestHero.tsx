'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Utensils, CupSoda, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useHaptic } from '@/hooks/useHaptic';

interface GuestHeroProps {
    activeTab: 'food' | 'drinks';
    onTabChange: (tab: 'food' | 'drinks') => void;
}

export function GuestHero({ activeTab, onTabChange }: GuestHeroProps) {
    const { trigger } = useHaptic();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Lock scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const handleTabChange = (tab: 'food' | 'drinks') => {
        trigger('soft');
        onTabChange(tab);
    };

    const toggleMenu = () => {
        trigger('medium');
        setIsMenuOpen(!isMenuOpen);
    };

    const menuItems = [
        { label: 'Home', href: '#' },
        { label: 'My Orders', href: '#' },
        { label: 'Special Offers', href: '#' },
        { label: 'About Gebeta', href: '#' },
        { label: 'For Restaurants', href: '#' },
        { label: 'Support', href: '#' },
    ];

    return (
        <div className={cn(
            "relative bg-brand-crimson pt-safe pb-16 px-6 rounded-b-[40px] shadow-lg mb-6 overflow-visible transition-all duration-300",
            isMenuOpen ? "z-[9999]" : "z-10"
        )}>
            {/* Full Screen Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 z-[9999] bg-brand-crimson text-white flex flex-col p-8 pt-safe"
                    >
                        <div className="flex justify-between items-center mb-16 pt-4">
                            <div className="relative h-10 w-32">
                                <Image src="/Logo.gif" alt="Gebeta Logo" fill className="object-contain brightness-0 invert" unoptimized />
                            </div>
                            <button
                                onClick={toggleMenu}
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-90"
                            >
                                <X size={30} strokeWidth={2.5} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-8">
                            {menuItems.map((item, index) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    className="text-4xl font-black tracking-tighter hover:text-brand-yellow transition-colors tap-highlight-transparent"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.label}
                                </motion.a>
                            ))}
                        </nav>

                        <div className="mt-auto pt-8 border-t border-white/10 pb-safe">
                            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">Connect with us</p>
                            <div className="flex gap-6 text-xl font-bold">
                                <a href="#" className="hover:text-brand-yellow transition-colors">Instagram</a>
                                <a href="#" className="hover:text-brand-yellow transition-colors">Twitter</a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 pt-4">
                <div className="flex items-center">
                    <div className="relative h-10 w-32">
                        <Image src="/Logo.gif" alt="Gebeta Logo" fill className="object-contain" unoptimized />
                    </div>
                </div>
                <button
                    onClick={toggleMenu}
                    className="text-white p-2 rounded-full active:scale-90 transition-all flex flex-col items-end gap-1.5 touch-manipulation"
                >
                    <span className="sr-only">Open Menu</span>
                    <div className="w-8 h-[3px] bg-white rounded-full"></div>
                    <div className="w-5 h-[3px] bg-white rounded-full"></div>
                </button>
            </div>

            {/* Main Copy */}
            <div className="max-w-lg mx-auto">
                <h1 className="text-[3.5rem] leading-[0.9] text-white font-black tracking-tighter mb-4 no-select">
                    Where flavor <br />
                    goes <span className="font-manrope font-medium italic text-brand-yellow">wild.</span>
                </h1>
                <p className="text-white/80 text-sm w-full leading-relaxed no-select">
                    Discover the best local bites, trending dishes, and must-try flavors near you.
                </p>
            </div>

            {/* Food/Drinks Tabs */}
            <div className="absolute -bottom-6 left-6 right-6 z-30">
                <div className="bg-white rounded-full p-1 shadow-float flex transform-gpu">
                    <button
                        onClick={() => handleTabChange('food')}
                        className={cn(
                            "flex-1 h-12 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 touch-manipulation no-select",
                            activeTab === 'food'
                                ? 'bg-brand-crimson text-white'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <Utensils size={18} />
                        Food
                    </button>
                    <button
                        onClick={() => handleTabChange('drinks')}
                        className={cn(
                            "flex-1 h-12 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 touch-manipulation no-select",
                            activeTab === 'drinks'
                                ? 'bg-brand-crimson text-white'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <CupSoda size={18} />
                        Drinks
                    </button>
                </div>
            </div>
        </div>
    );
}
