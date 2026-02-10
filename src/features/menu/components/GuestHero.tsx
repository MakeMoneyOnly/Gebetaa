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
        <div
            className={cn(
                'bg-brand-crimson pt-safe relative mb-6 overflow-visible rounded-b-[40px] px-6 pb-16 shadow-lg transition-all duration-300',
                isMenuOpen ? 'z-[9999]' : 'z-10'
            )}
        >
            {/* Full Screen Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-brand-crimson pt-safe fixed inset-0 z-[9999] flex flex-col p-8 text-white"
                    >
                        <div className="mb-16 flex items-center justify-between pt-4">
                            <div className="relative h-10 w-32">
                                <Image
                                    src="/Logo.gif"
                                    alt="Gebeta Logo"
                                    fill
                                    className="object-contain brightness-0 invert"
                                    unoptimized
                                />
                            </div>
                            <button
                                onClick={toggleMenu}
                                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20 active:scale-90"
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
                                    className="hover:text-brand-yellow tap-highlight-transparent text-4xl font-black tracking-tighter transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.label}
                                </motion.a>
                            ))}
                        </nav>

                        <div className="pb-safe mt-auto border-t border-white/10 pt-8">
                            <p className="mb-2 text-sm font-medium tracking-widest text-white/60 uppercase">
                                Connect with us
                            </p>
                            <div className="flex gap-6 text-xl font-bold">
                                <a href="#" className="hover:text-brand-yellow transition-colors">
                                    Instagram
                                </a>
                                <a href="#" className="hover:text-brand-yellow transition-colors">
                                    Twitter
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between pt-4">
                <div className="flex items-center">
                    <div className="relative h-10 w-32">
                        <Image
                            src="/Logo.gif"
                            alt="Gebeta Logo"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                </div>
                <button
                    onClick={toggleMenu}
                    className="flex touch-manipulation flex-col items-end gap-1.5 rounded-full p-2 text-white transition-all active:scale-90"
                >
                    <span className="sr-only">Open Menu</span>
                    <div className="h-[3px] w-8 rounded-full bg-white"></div>
                    <div className="h-[3px] w-5 rounded-full bg-white"></div>
                </button>
            </div>

            {/* Main Copy */}
            <div className="mx-auto max-w-lg">
                <h1 className="no-select mb-4 text-[3.5rem] leading-[0.9] font-black tracking-tighter text-white">
                    Where flavor <br />
                    goes{' '}
                    <span className="font-manrope text-brand-yellow font-medium italic">wild.</span>
                </h1>
                <p className="no-select w-full text-sm leading-relaxed text-white/80">
                    Discover the best local bites, trending dishes, and must-try flavors near you.
                </p>
            </div>

            {/* Food/Drinks Tabs */}
            <div className="absolute right-6 -bottom-6 left-6 z-30">
                <div className="shadow-float flex transform-gpu rounded-full bg-white p-1">
                    <button
                        onClick={() => handleTabChange('food')}
                        className={cn(
                            'no-select flex h-12 flex-1 touch-manipulation items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95',
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
                            'no-select flex h-12 flex-1 touch-manipulation items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95',
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
