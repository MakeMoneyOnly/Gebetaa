'use client';

import { useState, useMemo } from 'react';
import { Bell, FileText, Utensils, X, Star, CheckCircle2, ChevronRight, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';

/**
 * ServiceRequestButton - Floating "Bell" button for waiter requests
 * 
 * Features:
 * - Persistent floating button (bottom-left)
 * - Opens a small action sheet/modal
 * - Options: Call Waiter, Request Bill, Request Napkins/Cutlery
 */
export function ServiceRequestButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [requestSent, setRequestSent] = useState<string | null>(null);
    const [showReviewStep, setShowReviewStep] = useState(false);
    const [reviewedItemIndex, setReviewedItemIndex] = useState(0);
    const [userName, setUserName] = useState('');
    const [userComment, setUserComment] = useState('');
    const [userRating, setUserRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    const { language } = useLanguage();
    const { items: cartItems, orderHistory, restaurantId } = useCart();
    const supabase = createClient();

    // Derive simple list of unique items ordered for review
    const items = useMemo(() => {
        if (!orderHistory || orderHistory.length === 0) return [];

        // Filter unique items by ID
        const unique = new Map();
        orderHistory.forEach(item => {
            if (!unique.has(item.id)) unique.set(item.id, item);
        });
        return Array.from(unique.values());
    }, [orderHistory]);

    const handleRequest = (type: string) => {
        setRequestSent(type);

        // Show review step for Bill requests
        if (type === 'bill') {
            setTimeout(() => {
                setShowReviewStep(true);
            }, 800); // Shorter delay for better feel
        } else {
            // Auto close for other requests
            setTimeout(() => {
                setRequestSent(null);
                setIsOpen(false);
            }, 2500);
        }
    };

    const submitReview = async () => {
        // Handle empty items (general review) or specific item
        const itemId = items[reviewedItemIndex]?.id || null;

        setIsSubmittingReview(true);
        try {
            const { error } = await (supabase.from('reviews' as any) as any).insert({
                restaurant_id: restaurantId,
                item_id: itemId,
                user_name: userName,
                rating: userRating,
                comment: userComment
            });

            if (error) throw error;

            // If more items, go to next, otherwise finish
            if (reviewedItemIndex < items.length - 1) {
                setReviewedItemIndex(prev => prev + 1);
                setUserComment('');
                setUserRating(0);
            } else {
                setReviewSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    // Reset all
                    setRequestSent(null);
                    setShowReviewStep(false);
                    setReviewSuccess(false);
                    setReviewedItemIndex(0);
                    setUserName('');
                    setUserComment('');
                }, 2000);
            }
        } catch (err) {
            console.error('Review submission failed:', err);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const actions = [
        {
            id: 'waiter',
            icon: Bell,
            label: language === 'am' ? 'አስተናጋጅ ጥራ' : 'Call Waiter',
            color: 'var(--brand-color)'
        },
        {
            id: 'bill',
            icon: FileText,
            label: language === 'am' ? 'ሂሳብ ጠይቅ' : 'Request Bill',
            color: 'var(--brand-color)'
        },
        {
            id: 'cutlery',
            icon: Utensils,
            label: language === 'am' ? 'ተጨማሪ ዕቃዎች' : 'Extra Cutlery',
            color: 'var(--brand-color)'
        }
    ];

    return (
        <>
            {/* Main Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                    background: 'var(--brand-color)',
                    border: '1px solid var(--border-1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}
            >
                <Bell className="w-6 h-6 fill-black text-black" />
            </motion.button>

            {/* Action Sheet Modal */}
            <AnimatePresence>
                {
                    isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 z-[150]"
                                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                            />

                            {/* Sheet */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[160] p-6 rounded-t-[32px]"
                                style={{
                                    background: 'var(--surface-1)',
                                    borderTop: '1px solid var(--border-1)'
                                }}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3
                                        className="font-bold text-lg"
                                        style={{ color: 'var(--text-1)' }}
                                    >
                                        {language === 'am' ? 'እንዴት ልርዳዎት?' : 'How can we help?'}
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-full"
                                        style={{ background: 'var(--surface-2)' }}
                                    >
                                        <X className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                                    </button>
                                </div>

                                {requestSent ? (
                                    <AnimatePresence mode="wait">
                                        {!showReviewStep ? (
                                            <motion.div
                                                key="sent"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="py-12 text-center"
                                            >
                                                <div
                                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-brand/10"
                                                >
                                                    <Bell className="w-10 h-10 text-brand" />
                                                </div>
                                                <h4 className="font-black text-2xl mb-2 text-text-1">
                                                    {language === 'am' ? 'ጥያቄዎ ተልኳል!' : 'Request Sent!'}
                                                </h4>
                                                <p className="text-text-3 px-8 text-sm">
                                                    {language === 'am' ? 'አስተናጋጅ በቅርቡ ይመጣል' : 'A waiter will be with you shortly.'}
                                                </p>
                                            </motion.div>
                                        ) : reviewSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="py-12 text-center"
                                            >
                                                <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center mx-auto mb-6">
                                                    <CheckCircle2 className="w-10 h-10 text-black" />
                                                </div>
                                                <h4 className="font-black text-2xl mb-2 text-text-1">
                                                    {language === 'am' ? 'እናመሰግናለን!' : 'Thank You!'}
                                                </h4>
                                                <p className="text-text-3 px-8 text-sm">
                                                    {language === 'am' ? 'አስተያየትዎ እጅግ ጠቃሚ ነው' : 'Your feedback helps us serve you better.'}
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="review"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-6"
                                            >
                                                <div className="text-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand mb-1 block">
                                                        Progress: {reviewedItemIndex + 1} / {items.length}
                                                    </span>
                                                    <h4 className="font-black text-xl text-text-1">
                                                        {items.length > 0
                                                            ? (language === 'am' ? 'ምግቡ እንዴት ነበር?' : 'How was the food?')
                                                            : (language === 'am' ? 'ቆይታዎ እንዴት ነበር?' : 'How was your experience?')}
                                                    </h4>
                                                    {items.length > 0 && (
                                                        <p className="text-text-3 text-sm italic">
                                                            "{language === 'am' ? items[reviewedItemIndex]?.name_am || items[reviewedItemIndex]?.name : items[reviewedItemIndex]?.name}"
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Rating Stars */}
                                                <div className="flex justify-center gap-3 py-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setUserRating(star)}
                                                            className="transition-transform active:scale-90"
                                                        >
                                                            <Star
                                                                className={`w-10 h-10 transition-colors ${star <= userRating ? 'fill-brand text-brand' : 'text-surface-3'}`}
                                                                strokeWidth={star <= userRating || userRating === 0 ? 1 : 1.5}
                                                                fill={star <= userRating ? "currentColor" : "none"}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Name Input */}
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-4" />
                                                        <input
                                                            type="text"
                                                            placeholder={language === 'am' ? 'ስምዎ' : 'Your Name'}
                                                            value={userName}
                                                            onChange={(e) => setUserName(e.target.value)}
                                                            className="w-full h-14 pl-12 pr-4 bg-surface-2 rounded-2xl border border-border-1 text-text-1 focus:border-brand transition-colors outline-none font-bold"
                                                        />
                                                    </div>

                                                    {/* Comment Input */}
                                                    <div className="relative">
                                                        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-text-4" />
                                                        <textarea
                                                            rows={3}
                                                            placeholder={language === 'am' ? 'አስተያየትዎን ይጻፉ' : 'Tell us what you liked...'}
                                                            value={userComment}
                                                            onChange={(e) => setUserComment(e.target.value)}
                                                            className="w-full p-4 pl-12 bg-surface-2 rounded-2xl border border-border-1 text-text-1 focus:border-brand transition-colors outline-none resize-none text-sm font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={!userName || userRating === 0 || isSubmittingReview}
                                                    onClick={submitReview}
                                                    className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand/10 disabled:opacity-50 disabled:grayscale transition-all"
                                                >
                                                    {isSubmittingReview ? (
                                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span className="font-bold">
                                                                {reviewedItemIndex < items.length - 1
                                                                    ? (language === 'am' ? 'ቀጣይ ምግብ' : 'Next Item')
                                                                    : (language === 'am' ? 'አስገባ' : 'Submit Review')}
                                                            </span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        {actions.map((action) => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleRequest(action.id)}
                                                className="flex flex-col items-center gap-3 p-4 rounded-3xl transition-all active:scale-95 bg-surface-2 border border-border-1 hover:border-brand/30"
                                            >
                                                <div
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                    style={{ background: `${action.color}15` }}
                                                >
                                                    <action.icon className="w-7 h-7" style={{ color: action.color }} />
                                                </div>
                                                <span
                                                    className="text-xs font-bold text-center leading-tight"
                                                    style={{ color: 'var(--text-1)' }}
                                                >
                                                    {action.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >
        </>
    );
}
