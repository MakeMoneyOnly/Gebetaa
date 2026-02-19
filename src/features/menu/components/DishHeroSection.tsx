'use client';

import { ArrowLeft, Heart } from 'lucide-react';
import Image from 'next/image';
import { DishItem } from './DishDetailDrawer.types';

interface DishHeroSectionProps {
    item: DishItem;
    isRemoteOrDataImage: boolean;
    isLiked: boolean;
    onBack: () => void;
    onToggleLike: (e?: React.MouseEvent) => void;
}

export function DishHeroSection({
    item,
    isRemoteOrDataImage,
    isLiked,
    onBack,
    onToggleLike,
}: DishHeroSectionProps) {
    return (
        <div className="relative h-[40vh] w-full shrink-0 overflow-hidden rounded-t-[32px]">
            <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                priority
                unoptimized={isRemoteOrDataImage}
            />
            {/* Gradient Fade to Background at Bottom */}
            <div className="pointer-events-none absolute right-0 -bottom-1 left-0 h-24 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/90 to-transparent" />

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-20 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-brand-crimson shadow-sm transition-all hover:bg-white active:scale-90"
            >
                <ArrowLeft size={24} strokeWidth={2.5} />
            </button>

            {/* Top Right Heart Button */}
            <button
                onClick={(e) => onToggleLike(e)}
                className={`absolute top-4 right-4 z-20 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-white/30 transition-all shadow-sm active:scale-90 ${isLiked
                    ? 'text-brand-crimson scale-110 shadow-md'
                    : 'bg-white/30 backdrop-blur-xl hover:bg-white/50 text-white'
                    }`}
            >
                <Heart
                    size={20}
                    stroke={isLiked ? 'currentColor' : '#a81818'}
                    fill={isLiked ? 'currentColor' : 'transparent'}
                    strokeWidth={isLiked ? 0 : 2.5}
                    className="transition-transform duration-300"
                />
            </button>
        </div>
    );
}