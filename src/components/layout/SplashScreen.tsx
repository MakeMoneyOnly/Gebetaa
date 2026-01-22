'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Pizza, Drumstick, Salad, Sandwich, UtensilsCrossed, Croissant, Beef, Soup, Carrot, IceCream } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
    onOpen: () => void;
}

/**
 * SplashScreen - Welcome screen with animated background icons
 */
export function SplashScreen({ onOpen }: Props) {
    const { language } = useLanguage();

    const icons = [
        { Icon: Pizza, className: "absolute top-12 left-6 w-12 h-12 text-black rotate-12 stroke-[1.5]" },
        { Icon: Drumstick, className: "absolute top-8 left-1/3 w-10 h-10 text-black -rotate-12 stroke-[1.5]" },
        { Icon: Salad, className: "absolute top-16 right-10 w-14 h-14 text-black rotate-45 stroke-[1.5]" },
        { Icon: Sandwich, className: "absolute top-48 left-10 w-16 h-16 text-black -rotate-6 stroke-[1.5]" },
        { Icon: UtensilsCrossed, className: "absolute top-40 right-1/3 w-8 h-8 text-black rotate-90 stroke-[1.5]" },
        { Icon: Croissant, className: "absolute top-52 -right-4 w-12 h-12 text-black -rotate-12 stroke-[1.5]" },
        { Icon: Beef, className: "absolute top-80 left-1/4 w-10 h-10 text-black rotate-12 stroke-[1.5]" },
        { Icon: Soup, className: "absolute top-72 right-20 w-14 h-14 text-black -rotate-12 stroke-[1.5]" },
        { Icon: Carrot, className: "absolute bottom-1/2 left-8 w-12 h-12 text-black rotate-45 stroke-[1.5]" },
        { Icon: IceCream, className: "absolute bottom-[45%] right-8 w-10 h-10 text-black -rotate-12 stroke-[1.5]" },
    ];

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ background: 'var(--brand-color)' }}
        >
            {/* Pattern Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-10">
                {icons.map(({ Icon, className }, i) => (
                    <Icon key={i} className={className} />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="flex items-center gap-2 mb-4"
                >
                    <span 
                        className="text-5xl font-black tracking-tight"
                        style={{ color: '#000' }}
                    >
                        Sabà
                    </span>
                    <div 
                        className="px-3 py-1 rounded-lg"
                        style={{ background: '#000' }}
                    >
                        <span 
                            className="text-5xl font-black tracking-tight"
                            style={{ color: 'var(--brand-color)' }}
                        >
                            Menu
                        </span>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-center font-bold"
                    style={{ color: 'rgba(0,0,0,0.6)', fontSize: '18px' }}
                >
                    {language === 'am' 
                        ? 'ዲጂታል ምናሌ ስርዓት' 
                        : 'Digital Menu System'}
                </motion.p>
            </div>

            {/* Bottom Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.1 }}
                className="relative z-10 rounded-t-[32px] px-6 pt-10 pb-10"
                style={{ 
                    background: 'var(--surface-1)',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
                }}
            >
                {/* Headline */}
                <h1 
                    className="text-center mb-3"
                    style={{ 
                        fontSize: '32px',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: 'var(--text-1)'
                    }}
                >
                    {language === 'am' ? (
                        <>
                            <span style={{ color: 'var(--brand-color)' }}>ተራብተዋል?</span>
                            <br />
                            በፍጥነት ያግኙ
                        </>
                    ) : (
                        <>
                            <span style={{ color: 'var(--brand-color)' }}>Hungry?</span>
                            <br />
                            Get It Fast
                        </>
                    )}
                </h1>

                <p 
                    className="text-center mb-8"
                    style={{ 
                        fontSize: '16px',
                        color: 'var(--text-3)',
                        fontWeight: 500
                    }}
                >
                    {language === 'am' 
                        ? 'ትኩስ፣ ፈጣን፣ እና ለእርስዎ የተዘጋጀ!' 
                        : 'Fresh, fast, and tailored to your taste!'}
                </p>

                {/* CTA Button */}
                <button
                    onClick={onOpen}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-full group active:scale-[0.98] transition-transform"
                    style={{
                        background: 'var(--surface-3)',
                        border: '1px solid var(--border-2)',
                        minHeight: '72px'
                    }}
                >
                    {/* Icon */}
                    <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                        style={{ 
                            background: 'var(--brand-color)',
                            boxShadow: 'var(--shadow-brand)'
                        }}
                    >
                        <ShoppingBag className="w-6 h-6 text-black" />
                    </div>

                    {/* Text */}
                    <span 
                        className="font-bold tracking-wide"
                        style={{ 
                            fontSize: '18px',
                            color: 'var(--text-1)'
                        }}
                    >
                        {language === 'am' ? 'አሁን ይዘዙ' : 'Order Now'}
                    </span>

                    {/* Arrows */}
                    <div className="flex items-center pr-4" style={{ color: 'var(--text-4)' }}>
                        <ChevronRight className="w-5 h-5 -mr-3 opacity-30" />
                        <ChevronRight className="w-5 h-5 -mr-3 opacity-60" />
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </button>

                {/* Home indicator */}
                <div className="flex justify-center mt-6">
                    <div 
                        className="w-32 h-1 rounded-full"
                        style={{ background: 'var(--surface-4)' }}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
